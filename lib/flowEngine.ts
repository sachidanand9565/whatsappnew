/**
 * lib/flowEngine.ts
 * Stateful visual WhatsApp flow execution interpreter
 */

import { query, execute, insert } from './db';
import {
  sendTextMessage,
  sendInteractiveButtons,
  sendListMessage,
  sendMediaByUrl,
} from './whatsapp';
import { utcNow } from './utils';
import { emitSSE } from './sse';
import { RowDataPacket } from 'mysql2';

interface FlowNode {
  id: string;
  type: string;
  data: Record<string, any>;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
}

// Substitute placeholders: {{contact.name}}, {{contact.phone}}, {{var.variable_name}}
export function substituteVariables(
  text: string,
  variables: Record<string, any>,
  contact: { name?: string; phone: string }
): string {
  if (!text) return '';
  return text.replace(/\{\{([^{}]+)\}\}/g, (match, expression) => {
    const path = expression.trim();
    if (path === 'contact.name') return contact.name || '';
    if (path === 'contact.phone') return contact.phone;
    if (path.startsWith('var.')) {
      const varPath = path.substring(4);
      const parts = varPath.split('.');
      let current = variables;
      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = current[part];
        } else {
          return '';
        }
      }
      return current !== undefined && current !== null ? String(current) : '';
    }
    return match;
  });
}

// Validate inputs from Ask Question node
function validateInput(value: string, type: 'any' | 'number' | 'email' | 'phone'): boolean {
  if (type === 'any') return true;
  if (type === 'number') return !isNaN(Number(value));
  if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if (type === 'phone') return /^\+?[1-9]\d{1,14}$/.test(value.replace(/\s/g, ''));
  return true;
}

// Helper to log node executions for debugging/monitoring
async function logNodeExecution(
  sessionId: number | string,
  flowId: number,
  contactId: number,
  nodeId: string,
  nodeType: string,
  input: string | null,
  output: string | null,
  status: 'success' | 'error' | 'skipped',
  errorMsg: string | null = null
) {
  try {
    await insert(
      `INSERT INTO flow_node_logs (session_id, flow_id, contact_id, node_id, node_type, input, output, status, error_msg, executed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sessionId, flowId, contactId, nodeId, nodeType, input, output, status, errorMsg, utcNow()]
    );
  } catch (err) {
    console.error('Failed to write flow node log:', err);
  }
}

/**
 * Checks if incoming message triggers an active flow.
 * If yes, starts a new session and executes it.
 */
export async function triggerFlowIfMatch(
  workspaceId: number,
  contactId: number,
  messageText: string,
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const lowerText = messageText.toLowerCase().trim();

  // Fetch active flows in workspace
  const flows = await query<RowDataPacket[]>(
    'SELECT id, name, trigger_keywords, trigger_type, nodes, edges FROM flows WHERE workspace_id = ? AND is_active = 1',
    [workspaceId]
  );

  for (const flow of flows) {
    let keywords: string[] = [];
    try {
      keywords = typeof flow.trigger_keywords === 'string'
        ? JSON.parse(flow.trigger_keywords)
        : flow.trigger_keywords || [];
    } catch {
      keywords = [];
    }

    let isMatched = false;
    if (flow.trigger_type === 'any') {
      isMatched = true;
    } else if (flow.trigger_type === 'keyword' && keywords.includes(lowerText)) {
      isMatched = true;
    }

    if (isMatched) {
      console.log(`Flow "${flow.name}" (ID: ${flow.id}) triggered for contact ${contactId}`);

      // Create new session
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24h expiry
      const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

      const sessionId = await insert(
        `INSERT INTO flow_sessions (workspace_id, flow_id, contact_id, current_node_id, variables, status, expires_at, started_at)
         VALUES (?, ?, ?, 'start', '{}', 'active', ?, ?, ?)`,
        [workspaceId, flow.id, contactId, expiresAtStr, utcNow(), utcNow()]
      );

      // Log flow trigger event
      await execute('UPDATE flows SET triggered_count = triggered_count + 1 WHERE id = ?', [flow.id]);

      // Execute flow starting from the 'start' node
      const session = {
        id: sessionId,
        workspace_id: workspaceId,
        flow_id: flow.id,
        contact_id: contactId,
        current_node_id: 'start',
        variables: {},
        status: 'active',
      };

      await executeFlowStep(session, flow, null, phoneNumberId, accessToken);
      return true;
    }
  }

  return false;
}

/**
 * Resumes an active flow session on user reply.
 */
export async function resumeFlow(
  session: any,
  msg: any,
  phoneNumberId: string,
  accessToken: string
): Promise<boolean> {
  const workspaceId = session.workspace_id;
  const contactId   = session.contact_id;
  const replyText   = msg.text || msg.button?.text || '';

  // Load flow structure
  const flows = await query<RowDataPacket[]>(
    'SELECT id, name, nodes, edges FROM flows WHERE id = ? LIMIT 1',
    [session.flow_id]
  );
  if (flows.length === 0) {
    await execute('UPDATE flow_sessions SET status = "error" WHERE id = ?', [session.id]);
    return false;
  }
  const flow = flows[0];

  // Parse nodes & edges
  let nodes: Record<string, FlowNode> = {};
  try {
    nodes = typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes || {};
  } catch {
    nodes = {};
  }

  const currentNode = nodes[session.current_node_id];
  if (!currentNode) {
    await execute('UPDATE flow_sessions SET status = "error" WHERE id = ?', [session.id]);
    return false;
  }

  // Parse variables
  let variables: Record<string, any> = {};
  try {
    variables = typeof session.variables === 'string'
      ? JSON.parse(session.variables)
      : session.variables || {};
  } catch {
    variables = {};
  }

  // Load contact CRM info
  const contacts = await query<RowDataPacket[]>(
    'SELECT name, phone FROM contacts WHERE id = ? LIMIT 1',
    [contactId]
  );
  if (contacts.length === 0) return false;
  const contact = contacts[0] as { name?: string; phone: string };

  // Handlers for active node types that pause for input
  if (currentNode.type === 'ask_question') {
    const valType = currentNode.data.validation || 'any';
    const isValid = validateInput(replyText, valType);

    if (!isValid) {
      // Input is invalid. Notify user and repeat question.
      await logNodeExecution(session.id, flow.id, contactId, currentNode.id, currentNode.type, replyText, 'Validation failed: resent question', 'error', 'Invalid input format');
      
      const retryText = `Please enter a valid ${valType}.`;
      await sendTextMessage(accessToken, phoneNumberId, contact.phone, retryText);
      return true; // We handled the reply, but session remains on the same node
    }

    // Input is valid. Save to variables.
    const saveKey = currentNode.data.save_as || 'last_reply';
    variables[saveKey] = replyText;
    await execute(
      'UPDATE flow_sessions SET variables = ? WHERE id = ?',
      [JSON.stringify(variables), session.id]
    );

    await logNodeExecution(session.id, flow.id, contactId, currentNode.id, currentNode.type, replyText, `Saved key "${saveKey}"`, 'success');

    // Move to next node
    let edges: FlowEdge[] = [];
    try {
      edges = typeof flow.edges === 'string' ? JSON.parse(flow.edges) : flow.edges || [];
    } catch {
      edges = [];
    }

    const nextEdge = edges.find(e => e.source === currentNode.id);
    if (!nextEdge) {
      // Completed flow
      await execute('UPDATE flow_sessions SET status = "completed", completed_at = ? WHERE id = ?', [utcNow(), session.id]);
      await execute('UPDATE flows SET completed_count = completed_count + 1 WHERE id = ?', [flow.id]);
      await logNodeExecution(session.id, flow.id, contactId, 'end_session', 'system', null, 'Flow finished (no next node)', 'success');
      return true;
    }

    // Update session current node
    session.current_node_id = nextEdge.target;
    session.variables = variables;
    await execute(
      'UPDATE flow_sessions SET current_node_id = ?, resume_at = NULL WHERE id = ?',
      [nextEdge.target, session.id]
    );

    // Continue executing the flow nodes in a loop
    await executeFlowStep(session, flow, null, phoneNumberId, accessToken);
    return true;
  }

  // Fallback: If session was somehow paused at a non-input node, just resume
  await executeFlowStep(session, flow, null, phoneNumberId, accessToken);
  return true;
}

/**
 * Loops through flow nodes, executes actions, and transitions until it reaches a pause node or end.
 */
export async function executeFlowStep(
  session: any,
  flow: any,
  incomingText: string | null,
  phoneNumberId: string,
  accessToken: string
) {
  const contactId = session.contact_id;
  const workspaceId = session.workspace_id;

  // Load contact
  const contacts = await query<RowDataPacket[]>(
    'SELECT name, phone FROM contacts WHERE id = ? LIMIT 1',
    [contactId]
  );
  if (contacts.length === 0) return;
  const contact = contacts[0] as { name?: string; phone: string };

  // Parse nodes & edges
  let nodes: Record<string, FlowNode> = {};
  let edges: FlowEdge[] = [];
  try { nodes = typeof flow.nodes === 'string' ? JSON.parse(flow.nodes) : flow.nodes || {}; } catch { nodes = {}; }
  try { edges = typeof flow.edges === 'string' ? JSON.parse(flow.edges) : flow.edges || []; } catch { edges = []; }

  let currentNodeId = session.current_node_id;
  let loopProtection = 0;

  while (currentNodeId && loopProtection++ < 100) {
    const node = nodes[currentNodeId];
    if (!node) {
      await execute('UPDATE flow_sessions SET status = "error" WHERE id = ?', [session.id]);
      await logNodeExecution(session.id, flow.id, contactId, currentNodeId, 'unknown', null, null, 'error', 'Node definition not found');
      break;
    }

    console.log(`Executing node ${currentNodeId} of type ${node.type}`);

    // Read variables from DB to ensure freshest state in loop
    const sessRows = await query<RowDataPacket[]>(
      'SELECT variables FROM flow_sessions WHERE id = ? LIMIT 1',
      [session.id]
    );
    let variables: Record<string, any> = {};
    if (sessRows.length > 0) {
      try {
        variables = typeof sessRows[0].variables === 'string'
          ? JSON.parse(sessRows[0].variables)
          : sessRows[0].variables || {};
      } catch {}
    }

    let nextNodeId: string | null = null;
    let pauseExecution = false;

    try {
      switch (node.type) {
        case 'start': {
          // Just transition to next
          const edge = edges.find(e => e.source === node.id);
          nextNodeId = edge ? edge.target : null;
          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, 'Flow started', 'success');
          break;
        }

        case 'message': {
          const bodyText = substituteVariables(node.data.text || '', variables, contact);
          const buttons = node.data.buttons || [];

          if (buttons.length > 0) {
            const formattedButtons = buttons.map((b: any) => ({
              text: substituteVariables(b.text || '', variables, contact),
            }));
            const res = await sendInteractiveButtons(accessToken, phoneNumberId, contact.phone, bodyText, formattedButtons);
            const wamid = res?.messages?.[0]?.id;
            
            // Store outbound interactive message in message history
            const t = utcNow();
            const btnContent = JSON.stringify({ __type: 'interactive', body: bodyText, buttons: formattedButtons });
            await insert(
              `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
               VALUES (?, ?, ?, 'outbound', 'interactive', ?, 'sent', ?, ?)`,
              [workspaceId, contactId, wamid, btnContent, t, t]
            );
            emitSSE({ type: 'new_message', workspaceId, contactId, direction: 'outbound' });
          } else {
            const res = await sendTextMessage(accessToken, phoneNumberId, contact.phone, bodyText);
            const wamid = res?.messages?.[0]?.id;
            const t = utcNow();
            await insert(
              `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
               VALUES (?, ?, ?, 'outbound', 'text', ?, 'sent', ?, ?)`,
              [workspaceId, contactId, wamid, bodyText, t, t]
            );
            emitSSE({ type: 'new_message', workspaceId, contactId, direction: 'outbound' });
          }

          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, `Sent message: ${bodyText.slice(0, 100)}`, 'success');
          const edge = edges.find(e => e.source === node.id);
          nextNodeId = edge ? edge.target : null;
          break;
        }

        case 'send_media': {
          const mediaType = node.data.media_type || 'image';
          const mediaUrl = substituteVariables(node.data.url || '', variables, contact);
          const caption = substituteVariables(node.data.caption || '', variables, contact);

          const res = await sendMediaByUrl(accessToken, phoneNumberId, contact.phone, mediaType, mediaUrl, caption || undefined);
          const wamid = res?.messages?.[0]?.id;

          const t = utcNow();
          const mediaContent = JSON.stringify({ __type: 'media', mime_type: mediaType, link: mediaUrl, caption, workspace_id: workspaceId });
          await insert(
            `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
             VALUES (?, ?, ?, 'outbound', ?, ?, 'sent', ?, ?)`,
            [workspaceId, contactId, wamid, mediaType, mediaContent, t, t]
          );
          emitSSE({ type: 'new_message', workspaceId, contactId, direction: 'outbound' });

          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, `Sent media type: ${mediaType} URL: ${mediaUrl}`, 'success');
          const edge = edges.find(e => e.source === node.id);
          nextNodeId = edge ? edge.target : null;
          break;
        }

        case 'list_message': {
          const bodyText = substituteVariables(node.data.body || '', variables, contact);
          const btnText = substituteVariables(node.data.button_text || 'Select', variables, contact);
          const rawSections = node.data.sections || [];

          const resolvedSections = rawSections.map((sec: any) => ({
            title: substituteVariables(sec.title || '', variables, contact),
            rows: (sec.rows || []).map((row: any) => ({
              title: substituteVariables(row.title || '', variables, contact),
              description: substituteVariables(row.description || '', variables, contact),
            })),
          }));

          const res = await sendListMessage(accessToken, phoneNumberId, contact.phone, bodyText, btnText, resolvedSections);
          const wamid = res?.messages?.[0]?.id;

          const t = utcNow();
          const listContent = JSON.stringify({ __type: 'interactive_list', body: bodyText, button: btnText, sections: resolvedSections });
          await insert(
            `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
             VALUES (?, ?, ?, 'outbound', 'interactive', ?, 'sent', ?, ?)`,
            [workspaceId, contactId, wamid, listContent, t, t]
          );
          emitSSE({ type: 'new_message', workspaceId, contactId, direction: 'outbound' });

          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, `Sent List Message: ${bodyText.slice(0, 100)}`, 'success');
          const edge = edges.find(e => e.source === node.id);
          nextNodeId = edge ? edge.target : null;
          break;
        }

        case 'ask_question': {
          // Send the question and pause
          const questionText = substituteVariables(node.data.question || '', variables, contact);
          const res = await sendTextMessage(accessToken, phoneNumberId, contact.phone, questionText);
          const wamid = res?.messages?.[0]?.id;
          
          const t = utcNow();
          await insert(
            `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
             VALUES (?, ?, ?, 'outbound', 'text', ?, 'sent', ?, ?)`,
            [workspaceId, contactId, wamid, questionText, t, t]
          );
          emitSSE({ type: 'new_message', workspaceId, contactId, direction: 'outbound' });

          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, `Asked question: ${questionText}`, 'success');

          // Pause session at this node
          await execute(
            'UPDATE flow_sessions SET current_node_id = ?, resume_at = NULL WHERE id = ?',
            [node.id, session.id]
          );
          pauseExecution = true;
          break;
        }

        case 'condition': {
          const variableVal = substituteVariables(node.data.variable || '', variables, contact);
          const operatorVal = node.data.operator || 'equals';
          const compareVal  = substituteVariables(node.data.value || '', variables, contact);

          let isTrue = false;
          switch (operatorVal) {
            case 'equals':         isTrue = String(variableVal).toLowerCase() === String(compareVal).toLowerCase(); break;
            case 'not_equals':     isTrue = String(variableVal).toLowerCase() !== String(compareVal).toLowerCase(); break;
            case 'contains':       isTrue = String(variableVal).toLowerCase().includes(String(compareVal).toLowerCase()); break;
            case 'starts_with':    isTrue = String(variableVal).toLowerCase().startsWith(String(compareVal).toLowerCase()); break;
            case 'is_empty':       isTrue = !variableVal || String(variableVal).trim() === ''; break;
            case 'is_not_empty':   isTrue = !!variableVal && String(variableVal).trim() !== ''; break;
          }

          const targetHandle = isTrue ? 'true' : 'false';
          const edge = edges.find(e => e.source === node.id && e.sourceHandle === targetHandle);
          nextNodeId = edge ? edge.target : null;

          await logNodeExecution(
            session.id,
            flow.id,
            contactId,
            node.id,
            node.type,
            null,
            `Condition evaluated: ${isTrue ? 'True' : 'False'} (Value: "${variableVal}" ${operatorVal} "${compareVal}")`,
            'success'
          );
          break;
        }

        case 'set_attr': {
          const attr = node.data.attribute;
          const val  = substituteVariables(node.data.value || '', variables, contact);

          if (attr && ['name', 'email', 'city', 'status', 'notes'].includes(attr)) {
            await execute(
              `UPDATE contacts SET ${attr} = ? WHERE id = ?`,
              [val, contactId]
            );
          } else if (attr === 'tags') {
            // Append or overwrite tags depending on format
            let parsedTags: string[] = [];
            try { parsedTags = JSON.parse(val); } catch { parsedTags = val.split(',').map((t: string) => t.trim()); }
            await execute(
              'UPDATE contacts SET tags = ? WHERE id = ?',
              [JSON.stringify(parsedTags), contactId]
            );
          }

          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, `Contact CRM field "${attr}" updated to "${val}"`, 'success');
          const edge = edges.find(e => e.source === node.id);
          nextNodeId = edge ? edge.target : null;
          break;
        }

        case 'add_tag': {
          const newTags = node.data.tags || [];
          if (newTags.length > 0) {
            const rows = await query<RowDataPacket[]>(
              'SELECT tags FROM contacts WHERE id = ? LIMIT 1',
              [contactId]
            );
            let currentTags: string[] = [];
            if (rows.length > 0 && rows[0].tags) {
              try { currentTags = typeof rows[0].tags === 'string' ? JSON.parse(rows[0].tags) : rows[0].tags || []; } catch {}
            }
            const merged = Array.from(new Set([...currentTags, ...newTags]));
            await execute(
              'UPDATE contacts SET tags = ? WHERE id = ?',
              [JSON.stringify(merged), contactId]
            );
          }

          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, `Added tags: ${JSON.stringify(newTags)}`, 'success');
          const edge = edges.find(e => e.source === node.id);
          nextNodeId = edge ? edge.target : null;
          break;
        }

        case 'api': {
          const method = node.data.method || 'GET';
          const url = substituteVariables(node.data.url || '', variables, contact);
          const bodyText = substituteVariables(node.data.body || '', variables, contact);
          const saveKey = node.data.save_as;

          let responseData: any = null;
          let statusText = 'success';
          let errStr: string | null = null;

          try {
            const fetchOptions: RequestInit = {
              method,
              headers: { 'Content-Type': 'application/json' },
            };
            if (method !== 'GET' && bodyText) {
              fetchOptions.body = bodyText;
            }
            
            const res = await fetch(url, fetchOptions);
            const text = await res.text();
            try { responseData = JSON.parse(text); } catch { responseData = text; }

            if (!res.ok) {
              statusText = 'error';
              errStr = `HTTP error ${res.status}`;
            }
          } catch (err: any) {
            statusText = 'error';
            errStr = err.message || 'API request failed';
          }

          if (saveKey && responseData !== null) {
            variables[saveKey] = responseData;
            await execute(
              'UPDATE flow_sessions SET variables = ? WHERE id = ?',
              [JSON.stringify(variables), session.id]
            );
          }

          await logNodeExecution(
            session.id,
            flow.id,
            contactId,
            node.id,
            node.type,
            null,
            `API node finished (${method} ${url}) saved key "${saveKey}"`,
            statusText as any,
            errStr
          );

          const edge = edges.find(e => e.source === node.id);
          nextNodeId = edge ? edge.target : null;
          break;
        }

        case 'delay': {
          const duration = Number(node.data.duration) || 5;
          const unit = node.data.unit || 'seconds';

          const resumeAt = new Date();
          if (unit === 'seconds') resumeAt.setSeconds(resumeAt.getSeconds() + duration);
          else if (unit === 'minutes') resumeAt.setMinutes(resumeAt.getMinutes() + duration);
          else if (unit === 'hours') resumeAt.setHours(resumeAt.getHours() + duration);

          const resumeAtStr = resumeAt.toISOString().slice(0, 19).replace('T', ' ');

          // Find the target node when resuming
          const edge = edges.find(e => e.source === node.id);
          const nextNode = edge ? edge.target : 'end';

          await execute(
            'UPDATE flow_sessions SET current_node_id = ?, resume_at = ? WHERE id = ?',
            [nextNode, resumeAtStr, session.id]
          );

          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, `Delay scheduled for ${duration} ${unit} (resumes at ${resumeAtStr})`, 'success');
          pauseExecution = true;
          break;
        }

        case 'transfer_agent': {
          const handoffMsg = substituteVariables(node.data.message || 'Connecting you to an agent...', variables, contact);
          
          await sendTextMessage(accessToken, phoneNumberId, contact.phone, handoffMsg);
          const wamid = 'sys_transfer_' + Date.now();
          const t = utcNow();
          await insert(
            `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
             VALUES (?, ?, ?, 'outbound', 'text', ?, 'sent', ?, ?)`,
            [workspaceId, contactId, wamid, handoffMsg, t, t]
          );

          // Update CRM Status to intervened/open and assign unassigned
          await execute(
            `UPDATE contacts SET chat_status = 'open', intervened_by = 'Flow Bot Handoff' WHERE id = ?`,
            [contactId]
          );

          // Add System event message
          const sysWamid = 'sys_event_' + Date.now();
          const systemLogText = 'Bot paused - Transferred to Human Agent Queue';
          await insert(
            `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
             VALUES (?, ?, ?, 'inbound', 'system', ?, 'delivered', ?, ?)`,
            [workspaceId, contactId, sysWamid, systemLogText, t, t]
          );

          emitSSE({ type: 'chat_status_update', workspaceId, contactId, chatStatus: 'open' });
          emitSSE({ type: 'new_message', workspaceId, contactId, direction: 'inbound' });

          // Terminate flow session
          await execute('UPDATE flow_sessions SET status = "completed", completed_at = ? WHERE id = ?', [utcNow(), session.id]);
          await execute('UPDATE flows SET completed_count = completed_count + 1 WHERE id = ?', [flow.id]);

          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, 'Chat handoff completed. Flow ended.', 'success');
          pauseExecution = true;
          break;
        }

        case 'connect_flow': {
          const targetFlowName = substituteVariables(node.data.flow_name || '', variables, contact);

          // Find target flow
          const targetFlows = await query<RowDataPacket[]>(
            'SELECT id, name FROM flows WHERE name = ? AND workspace_id = ? AND is_active = 1 LIMIT 1',
            [targetFlowName, workspaceId]
          );

          if (targetFlows.length > 0) {
            const targetFlow = targetFlows[0];
            // End current session
            await execute('UPDATE flow_sessions SET status = "completed", completed_at = ? WHERE id = ?', [utcNow(), session.id]);
            await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, `Jumping to sub-flow: ${targetFlow.name}`, 'success');

            // Trigger target flow new session
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 24);
            const expiresAtStr = expiresAt.toISOString().slice(0, 19).replace('T', ' ');

            const newSessionId = await insert(
              `INSERT INTO flow_sessions (workspace_id, flow_id, contact_id, current_node_id, variables, status, expires_at, started_at)
               VALUES (?, ?, ?, 'start', ?, 'active', ?, ?, ?)`,
              [workspaceId, targetFlow.id, contactId, JSON.stringify(variables), expiresAtStr, utcNow(), utcNow()]
            );

            const newSession = {
              id: newSessionId,
              workspace_id: workspaceId,
              flow_id: targetFlow.id,
              contact_id: contactId,
              current_node_id: 'start',
              variables,
              status: 'active',
            };

            // execute immediately
            await executeFlowStep(newSession, targetFlow, null, phoneNumberId, accessToken);
          } else {
            await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, null, 'error', `Target sub-flow "${targetFlowName}" not found or inactive`);
            const edge = edges.find(e => e.source === node.id);
            nextNodeId = edge ? edge.target : null;
          }
          pauseExecution = true; // we either jumped or hit end
          break;
        }

        case 'end': {
          await execute('UPDATE flow_sessions SET status = "completed", completed_at = ? WHERE id = ?', [utcNow(), session.id]);
          await execute('UPDATE flows SET completed_count = completed_count + 1 WHERE id = ?', [flow.id]);
          await logNodeExecution(session.id, flow.id, contactId, node.id, node.type, null, 'Flow completed successfully', 'success');
          pauseExecution = true;
          break;
        }

        default: {
          // Unknown node
          const edge = edges.find(e => e.source === node.id);
          nextNodeId = edge ? edge.target : null;
          break;
        }
      }
    } catch (err: any) {
      console.error(`Error executing node ${currentNodeId}:`, err);
      await logNodeExecution(session.id, flow.id, contactId, currentNodeId, node.type, null, null, 'error', err.message || 'Node execution error');
      // end session on crash
      await execute('UPDATE flow_sessions SET status = "error" WHERE id = ?', [session.id]);
      break;
    }

    if (pauseExecution) {
      break;
    }

    currentNodeId = nextNodeId;
    // update current node ID in database
    if (currentNodeId) {
      await execute(
        'UPDATE flow_sessions SET current_node_id = ? WHERE id = ?',
        [currentNodeId, session.id]
      );
    } else {
      // Completed flow (implicit end)
      await execute('UPDATE flow_sessions SET status = "completed", completed_at = ? WHERE id = ?', [utcNow(), session.id]);
      await execute('UPDATE flows SET completed_count = completed_count + 1 WHERE id = ?', [flow.id]);
      await logNodeExecution(session.id, flow.id, contactId, 'implicit_end', 'system', null, 'Implicit flow end (no next node)', 'success');
      break;
    }
  }
}
