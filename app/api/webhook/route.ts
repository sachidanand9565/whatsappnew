/**
 * GET  /api/webhook  — Meta webhook verification
 * POST /api/webhook  — Receive incoming messages & status updates
 */
import { NextRequest, NextResponse } from 'next/server';
import { query, insert, execute } from '@/lib/db';
import { parseWebhookBody, sendTextMessage, markAsRead } from '@/lib/whatsapp';
import { normalizePhone, utcNow, unixToUtc } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';
import { emitSSE } from '@/lib/sse';
import { triggerFlowIfMatch, resumeFlow } from '@/lib/flowEngine';

// ---- GET: Verify webhook with Meta ----
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mode      = searchParams.get('hub.mode');
  const token     = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode !== 'subscribe' || !token || !challenge) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 1️⃣ Check ENV variable first (works without DB)
  const envToken = process.env.VERIFY_TOKEN;
  if (envToken && token === envToken) {
    return new NextResponse(challenge, { status: 200 });
  }

  // 2️⃣ Fallback: check DB for multi-tenant workspaces
  try {
    const ws = await query<RowDataPacket[]>(
      'SELECT id FROM workspaces WHERE verify_token = ? AND is_active = 1 LIMIT 1',
      [token]
    );
    if (ws.length > 0) {
      return new NextResponse(challenge, { status: 200 });
    }
  } catch {
    // DB not available — already checked ENV above
  }

  return new NextResponse('Forbidden', { status: 403 });
}

// ---- POST: Handle incoming messages ----
export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return new NextResponse('Bad Request', { status: 400 });
  }

  // Identify workspace by phoneNumberId
  const { messages, statuses, echoes, phoneNumberId, profileNames } = parseWebhookBody(body);

  let workspaceId: number | null = null;
  let workspaceAccessToken = '';
  let activeWebhooks: { url: string; secret: string | null }[] = [];
  if (phoneNumberId) {
    const ws = await query<RowDataPacket[]>(
      'SELECT id, access_token FROM workspaces WHERE phone_number_id = ? AND is_active = 1 LIMIT 1',
      [phoneNumberId]
    );
    if (ws.length > 0) {
      workspaceId = ws[0].id as number;
      workspaceAccessToken = ws[0].access_token as string || '';
      // Fetch all active custom webhooks for this workspace
      try {
        const hooks = await query<RowDataPacket[]>(
          'SELECT url, secret FROM chatbot_webhooks WHERE workspace_id = ? AND is_active = 1',
          [workspaceId]
        );
        activeWebhooks = hooks.map((h) => ({ url: h.url as string, secret: h.secret as string | null }));
      } catch { /* table may not exist yet */ }
    }
  }

  // Log raw payload
  await insert(
    'INSERT INTO webhook_logs (workspace_id, event_type, payload) VALUES (?, ?, ?)',
    [workspaceId, 'webhook', JSON.stringify(body)]
  );

  if (!workspaceId) return NextResponse.json({ received: true });

  // ---- Process inbound messages ----
  for (const msg of messages) {
    const phone       = normalizePhone(msg.from);
    const profileName = profileNames[msg.from] || profileNames[phone] || null;

    let contactId: number;
    // INSERT IGNORE is race-condition safe against concurrent campaign sends
    await execute(
      'INSERT IGNORE INTO contacts (workspace_id, phone, name, source, opted_in) VALUES (?, ?, ?, ?, 1)',
      [workspaceId, phone, profileName || null, 'inbound']
    );
    // Re-query to get the actual id (whether just inserted or already existed)
    const contactRow = await query<RowDataPacket[]>(
      'SELECT id, name, chat_status FROM contacts WHERE workspace_id = ? AND phone = ? LIMIT 1',
      [workspaceId, phone]
    );
    contactId = contactRow[0].id as number;
    let chatStatus = contactRow[0].chat_status as string || 'open';

    if (profileName && !contactRow[0].name) {
      await execute(
        "UPDATE contacts SET name = ? WHERE id = ? AND (name IS NULL OR name = '')",
        [profileName, contactId]
      );
    }
    // If resolved contact messages again → reopen to active inbox
    if (chatStatus === 'resolved') {
      await execute(
        "UPDATE contacts SET chat_status = 'open', intervened_by = NULL WHERE id = ? AND chat_status = 'resolved'",
        [contactId]
      );
      chatStatus = 'open';
    }

    // Extract readable content based on message type
    let content = '';
    if (msg.type === 'text')     content = msg.text || '';
    else if (msg.type === 'button') content = msg.button?.text || msg.button?.payload || 'Button reply';
    else if (msg.type === 'image') {
      const d = msg.image as Record<string, unknown> | undefined;
      content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type, caption: d?.caption, workspace_id: workspaceId });
    } else if (msg.type === 'audio') {
      const d = msg.audio as Record<string, unknown> | undefined;
      content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type, voice: !!d?.voice, workspace_id: workspaceId });
    } else if (msg.type === 'video') {
      const d = msg.video as Record<string, unknown> | undefined;
      content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type, caption: d?.caption, workspace_id: workspaceId });
    } else if (msg.type === 'document') {
      const d = msg.document as Record<string, unknown> | undefined;
      content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type, filename: d?.filename, caption: d?.caption, workspace_id: workspaceId });
    } else if (msg.type === 'sticker') {
      const d = msg.sticker as Record<string, unknown> | undefined;
      content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type || 'image/webp', workspace_id: workspaceId });
    } else if (msg.type === 'location') {
      const d = msg.location as Record<string, unknown> | undefined;
      content = JSON.stringify({ __type: 'location', latitude: d?.latitude, longitude: d?.longitude, name: d?.name, address: d?.address });
    } else if (msg.type === 'contacts') {
      const list = msg.contacts as Record<string, unknown>[] | undefined;
      content = JSON.stringify({ __type: 'contacts', contacts: list });
    } else if (msg.type === 'interactive') {
      const d = msg.interactive as Record<string, unknown> | undefined;
      const btnReply = (d?.button_reply as any)?.title;
      const listReply = (d?.list_reply as any)?.title;
      content = btnReply || listReply || '📋 Interactive reply';
    } else if (msg.type === 'reaction') {
      const d = (msg as any).reaction as Record<string, unknown> | undefined;
      content = `Reacted ${d?.emoji || '👍'} to a message`;
    } else if (msg.type === 'order') {
      content = '🛒 Order received';
    } else if (msg.type === 'system') {
      const d = (msg as any).system as Record<string, unknown> | undefined;
      content = (d?.body as string) || 'System message';
    } else if (msg.type === 'unknown' || msg.type === 'unsupported') {
      // WhatsApp Cloud API sends NO content for these (poll, voice/video call,
      // view-once, etc.) — only an "unsupported" flag. Keep the phrase
      // "Unsupported message type" so the inbox shows its styled badge.
      content = 'Unsupported message type';
    } else {
      content = `[${msg.type}]`;
    }

    // Guard database enum validation errors for unknown types
    const allowedTypes = ['text','image','document','audio','video','template','interactive','reaction','location','contacts','sticker','unknown'];
    const dbMsgType = allowedTypes.includes(msg.type) ? msg.type : 'unknown';

    // Store message (try with replied_to_wamid, fallback without)
    const msgSentAt = unixToUtc(msg.timestamp);
    const msgNow    = utcNow();
    try {
      await insert(
        `INSERT IGNORE INTO messages
           (workspace_id, contact_id, wamid, replied_to_wamid, direction, type, content, status, sent_at, created_at)
         VALUES (?, ?, ?, ?, 'inbound', ?, ?, 'delivered', ?, ?)`,
        [workspaceId, contactId, msg.wamid, msg.replied_to_wamid || null, dbMsgType, content, msgSentAt, msgNow]
      );
    } catch {
      // fallback: insert without replied_to_wamid (column may not exist yet)
      await insert(
        `INSERT IGNORE INTO messages
           (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
         VALUES (?, ?, ?, 'inbound', ?, ?, 'delivered', ?, ?)`,
        [workspaceId, contactId, msg.wamid, dbMsgType, content, msgSentAt, msgNow]
      );
    }
    
    // Notify connected inbox clients instantly via SSE
    emitSSE({ type: 'new_message', workspaceId, contactId, direction: 'inbound' });

    // Auto read receipt — only when chatbot webhook is active (bot will reply, not a human agent)
    if (activeWebhooks.length > 0 && workspaceAccessToken && phoneNumberId && msg.wamid) {
      markAsRead(workspaceAccessToken, phoneNumberId, msg.wamid).catch(() => {});
    }

    // ---- Forward to all active custom chatbot webhooks (non-blocking) ----
    if (activeWebhooks.length > 0) {
      const fwdPayload = {
        event:        'message.received',
        workspace_id: workspaceId,
        contact:      { id: contactId, phone },
        message: {
          wamid:            msg.wamid,
          type:             msg.type,
          content,
          timestamp:        msg.timestamp,
          replied_to_wamid: msg.replied_to_wamid || null,
        },
      };
      for (const hook of activeWebhooks) {
        forwardToCustomWebhook(hook.url, hook.secret, fwdPayload);
      }
    }

    // ---- Flow System: run active flow or trigger keyword match ----
    let flowProcessed = false;
    if (chatStatus !== 'intervened') {
      const activeSession = await query<RowDataPacket[]>(
        'SELECT * FROM flow_sessions WHERE workspace_id = ? AND contact_id = ? AND status = "active" LIMIT 1',
        [workspaceId, contactId]
      );

      if (activeSession.length > 0) {
        flowProcessed = await resumeFlow(activeSession[0], { text: content }, phoneNumberId, workspaceAccessToken);
      } else if (content.trim()) {
        flowProcessed = await triggerFlowIfMatch(workspaceId, contactId, content, phoneNumberId, workspaceAccessToken);
      }
    }

    // ---- Chatbot fallback: match rules (only if not processed by flow and not intervened) ----
    if (!flowProcessed && chatStatus !== 'intervened' && msg.type === 'text' && msg.text) {
      await processChatbot(workspaceId, contactId, msg.text, phoneNumberId);
    }
  }

  // ---- Process echoes (messages the business sent from the WhatsApp Business app) ----
  for (const echo of echoes) {
    if (!echo.to || !echo.wamid) continue;
    const phone = normalizePhone(echo.to);

    // Upsert the customer contact
    await execute(
      "INSERT IGNORE INTO contacts (workspace_id, phone, source, opted_in) VALUES (?, ?, 'outbound', 1)",
      [workspaceId, phone]
    );
    const contactRow = await query<RowDataPacket[]>(
      'SELECT id FROM contacts WHERE workspace_id = ? AND phone = ? LIMIT 1',
      [workspaceId, phone]
    );
    if (contactRow.length === 0) continue;
    const contactId = contactRow[0].id as number;

    // Build readable content (same shapes used for inbound)
    let content = '';
    if (echo.type === 'text')          content = echo.text || '';
    else if (echo.type === 'image')    { const d = echo.image as Record<string, unknown> | undefined; content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type, caption: d?.caption, workspace_id: workspaceId }); }
    else if (echo.type === 'video')    { const d = echo.video as Record<string, unknown> | undefined; content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type, caption: d?.caption, workspace_id: workspaceId }); }
    else if (echo.type === 'audio')    { const d = echo.audio as Record<string, unknown> | undefined; content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type, voice: !!d?.voice, workspace_id: workspaceId }); }
    else if (echo.type === 'document') { const d = echo.document as Record<string, unknown> | undefined; content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type, filename: d?.filename, caption: d?.caption, workspace_id: workspaceId }); }
    else if (echo.type === 'sticker')  { const d = echo.sticker as Record<string, unknown> | undefined; content = JSON.stringify({ __type: 'media', media_id: d?.id, mime_type: d?.mime_type || 'image/webp', workspace_id: workspaceId }); }
    else if (echo.type === 'location') { const d = echo.location as Record<string, unknown> | undefined; content = JSON.stringify({ __type: 'location', latitude: d?.latitude, longitude: d?.longitude, name: d?.name, address: d?.address }); }
    else                               content = `[${echo.type}]`;

    const allowedTypes = ['text','image','document','audio','video','template','interactive','reaction','location','contacts','sticker','unknown'];
    const dbMsgType = allowedTypes.includes(echo.type) ? echo.type : 'unknown';

    // Store as an outbound message (INSERT IGNORE dedupes if we also sent it via API)
    await insert(
      `INSERT IGNORE INTO messages
         (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
       VALUES (?, ?, ?, 'outbound', ?, ?, 'sent', ?, ?)`,
      [workspaceId, contactId, echo.wamid, dbMsgType, content, unixToUtc(echo.timestamp), utcNow()]
    );

    // Live update inbox (outbound — don't bump unread badge)
    emitSSE({ type: 'new_message', workspaceId, contactId, direction: 'outbound' });
  }

  // ---- Process status updates ----
  for (const status of statuses) {
    const now = utcNow();
    const fieldMap: Record<string, string> = {
      sent:      `status = 'sent', sent_at = '${now}'`,
      delivered: `status = 'delivered', delivered_at = '${now}'`,
      read:      `status = 'read', read_at = '${now}'`,
      failed:    "status = 'failed'",
    };
    const update = fieldMap[status.status];
    if (!update) continue;

    await execute(`UPDATE messages SET ${update} WHERE wamid = ?`, [status.wamid]);

    // Query message for contactId (SSE) + optional campaign processing
    const msgRows = await query<RowDataPacket[]>(
      'SELECT id, campaign_id, contact_id FROM messages WHERE wamid = ? LIMIT 1',
      [status.wamid]
    );
    if (msgRows.length > 0) {
      const contactId = msgRows[0].contact_id as number;

      // Push real-time tick update to inbox (delivered ✓✓ / read blue ✓✓)
      emitSSE({ type: 'status_update', workspaceId, contactId, wamid: status.wamid, status: status.status });

      // Update campaign_contacts status + campaign counters
      if (msgRows[0].campaign_id && (status.status === 'delivered' || status.status === 'read' || status.status === 'failed')) {
        const col = `${status.status}_count`;
        const msgId  = msgRows[0].id as number;
        const campId = msgRows[0].campaign_id as number;

        const statusOrder: Record<string, number> = { pending: 0, sent: 1, delivered: 2, read: 3, failed: 4 };
        const newOrder = statusOrder[status.status] ?? 0;

        const affected = await execute(
          `UPDATE campaign_contacts SET status = ?
           WHERE message_id = ? AND (
             FIELD(status, 'pending','sent','delivered','read','failed') < ?
           )`,
          [status.status, msgId, newOrder + 1]
        );

        if (affected > 0) {
          await execute(
            `UPDATE campaigns SET ${col} = ${col} + 1 WHERE id = ?`,
            [campId]
          );
        }
      }
    }
  }

  return NextResponse.json({ received: true });
}

// ---- Forward inbound message to custom webhook URL ----
function forwardToCustomWebhook(
  url: string,
  secret: string | null,
  payload: Record<string, unknown>
) {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  // Add HMAC-SHA256 signature if secret is configured
  if (secret) {
    try {
      const crypto = require('crypto') as typeof import('crypto');
      const sig = crypto.createHmac('sha256', secret).update(body).digest('hex');
      headers['X-Webhook-Signature'] = `sha256=${sig}`;
    } catch { /**/ }
  }

  // Fire-and-forget — never block inbound processing
  fetch(url, { method: 'POST', headers, body })
    .catch(() => { /* ignore errors */ });
}

// ---- Chatbot rule matching ----
async function processChatbot(
  workspaceId: number,
  contactId: number,
  text: string,
  phoneNumberId: string
) {
  const rules = await query<RowDataPacket[]>(
    `SELECT cr.*, w.access_token FROM chatbot_rules cr
     JOIN workspaces w ON w.id = cr.workspace_id
     WHERE cr.workspace_id = ? AND cr.is_active = 1
     ORDER BY cr.priority DESC`,
    [workspaceId]
  );

  // Get contact phone for sending reply
  const contacts = await query<RowDataPacket[]>(
    'SELECT phone FROM contacts WHERE id = ?', [contactId]
  );
  if (contacts.length === 0) return;

  const phone       = contacts[0].phone as string;
  const lowerText   = text.toLowerCase().trim();

  for (const rule of rules) {
    const trigger = (rule.trigger_value as string || '').toLowerCase();
    let matched    = false;

    switch (rule.trigger_type) {
      case 'exact':      matched = lowerText === trigger; break;
      case 'keyword':    matched = lowerText.includes(trigger); break;
      case 'contains':   matched = lowerText.includes(trigger); break;
      case 'starts_with': matched = lowerText.startsWith(trigger); break;
      case 'any':        matched = true; break;
    }

    if (matched && rule.response_type === 'text' && rule.response_text) {
      const result = await sendTextMessage(
        rule.access_token as string, phoneNumberId, phone, rule.response_text as string
      );
      const wamid = result?.messages?.[0]?.id;
      if (wamid) {
        const t = utcNow();
        await insert(
          `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
           VALUES (?, ?, ?, 'outbound', 'text', ?, 'sent', ?, ?)`,
          [workspaceId, contactId, wamid, rule.response_text, t, t]
        );
        // Notify inbox clients so chatbot reply shows live (outbound — don't increment badge)
        emitSSE({ type: 'new_message', workspaceId, contactId, direction: 'outbound' });
      }
      break;
    }
  }
}
