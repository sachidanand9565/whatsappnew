/**
 * lib/cronRunner.ts
 * Background cron runner for flow delays & campaign queue processing
 */

import cron from 'node-cron';
import { query, execute, insert } from './db';
import { sendTemplateMessage } from './whatsapp';
import { utcNow, sleep, WA_RATE_LIMIT_MS } from './utils';
import { executeFlowStep } from './flowEngine';
import { RowDataPacket } from 'mysql2';

let isCronRunning = false;

// Resume flow sessions that hit their resume_at timestamp
export async function resumeDelayedFlowSessions() {
  const nowStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
  
  // Find delayed sessions where resume_at <= NOW()
  const sessions = await query<RowDataPacket[]>(
    `SELECT fs.*, f.nodes, f.edges
     FROM flow_sessions fs
     JOIN flows f ON f.id = fs.flow_id
     WHERE fs.status = 'active' AND fs.resume_at IS NOT NULL AND fs.resume_at <= ?`,
    [nowStr]
  );

  if (sessions.length === 0) return;
  console.log(`Cron: Resuming ${sessions.length} delayed flow sessions.`);

  for (const session of sessions) {
    try {
      // Get workspace settings
      const ws = await query<RowDataPacket[]>(
        'SELECT access_token, phone_number_id FROM workspaces WHERE id = ? LIMIT 1',
        [session.workspace_id]
      );
      if (ws.length === 0 || !ws[0].access_token || !ws[0].phone_number_id) {
        continue;
      }
      const { access_token, phone_number_id } = ws[0];

      // Reset resume_at first to prevent concurrent double-executions
      await execute(
        'UPDATE flow_sessions SET resume_at = NULL WHERE id = ?',
        [session.id]
      );

      // Execute next steps
      await executeFlowStep(
        {
          id: session.id,
          workspace_id: session.workspace_id,
          flow_id: session.flow_id,
          contact_id: session.contact_id,
          current_node_id: session.current_node_id,
          variables: typeof session.variables === 'string' ? JSON.parse(session.variables) : session.variables || {},
          status: session.status,
        },
        session,
        null,
        phone_number_id as string,
        access_token as string
      );
    } catch (err) {
      console.error(`Error resuming flow session ${session.id}:`, err);
    }
  }
}

// Process running campaigns in chunk sizes of 50 contacts
export async function processRunningCampaigns() {
  const campaigns = await query<RowDataPacket[]>(
    `SELECT c.*, t.name as tname, t.language, t.body_text,
            t.header_type, t.header_content, t.footer_text, t.buttons,
            w.access_token, w.phone_number_id
     FROM campaigns c
     JOIN templates t ON t.id = c.template_id
     JOIN workspaces w ON w.id = c.workspace_id
     WHERE c.status = 'running'`
  );

  if (campaigns.length === 0) return;
  console.log(`Cron: Processing ${campaigns.length} running campaigns.`);

  for (const camp of campaigns) {
    try {
      // Get chunk of pending contacts
      const contacts = await query<RowDataPacket[]>(
        `SELECT cc.contact_id, c.phone, cc.id as cc_id
         FROM campaign_contacts cc
         JOIN contacts c ON c.id = cc.contact_id
         WHERE cc.campaign_id = ? AND cc.status = 'pending'
         LIMIT 50`,
        [camp.id]
      );

      if (contacts.length === 0) {
        // No contacts left to send, mark campaign completed
        const stats = await query<RowDataPacket[]>(
          `SELECT COUNT(*) as total,
                  SUM(CASE WHEN status='sent' THEN 1 ELSE 0 END) as sent,
                  SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed
           FROM campaign_contacts WHERE campaign_id = ?`,
          [camp.id]
        );
        const { sent, failed } = stats[0] as { sent: number; failed: number };
        const finalStatus = failed > 0 && sent === 0 ? 'failed' : 'completed';

        await execute(
          `UPDATE campaigns SET status = ?, completed_at = ?,
           sent_count = ?, failed_count = ? WHERE id = ?`,
          [finalStatus, utcNow(), sent || 0, failed || 0, camp.id]
        );
        console.log(`Cron: Campaign ${camp.id} completed sending.`);
        continue;
      }

      console.log(`Cron: Campaign ${camp.id} sending to next chunk of ${contacts.length} contacts.`);

      let sentInChunk = 0;
      let failedInChunk = 0;

      for (const contact of contacts) {
        // Double-check if campaign is still running (to allow user pause)
        const check = await query<RowDataPacket[]>(
          'SELECT status FROM campaigns WHERE id = ? LIMIT 1',
          [camp.id]
        );
        if (check.length === 0 || check[0].status !== 'running') {
          console.log(`Campaign ${camp.id} was paused or cancelled mid-chunk.`);
          break;
        }

        try {
          // Send template
          const result = await sendTemplateMessage(
            camp.access_token as string,
            camp.phone_number_id as string,
            contact.phone,
            camp.tname as string,
            camp.language as string,
            buildTemplateComponents(camp)
          );

          const wamid = (result?.messages as Record<string, unknown>[])?.[0]?.id as string;

          // Render body text
          let bodyText = (camp.body_text as string) || '';
          const vars = (camp.template_vars as Record<string, string>) || {};
          for (const [k, v] of Object.entries(vars)) {
            bodyText = bodyText.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
          }
          let buttons: unknown[] = [];
          try { buttons = JSON.parse((camp.buttons as string) || '[]'); } catch { buttons = []; }

          const templateContent = JSON.stringify({
            __type:         'template',
            template_name:  camp.tname,
            header_type:    camp.header_type    || 'NONE',
            header_content: camp.header_content || '',
            body:           bodyText,
            footer:         camp.footer_text    || '',
            buttons,
          });

          const t = utcNow();
          const msgId = await insert(
            `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, campaign_id, status, sent_at, created_at)
             VALUES (?, ?, ?, 'outbound', 'template', ?, ?, 'sent', ?, ?)`,
            [camp.workspace_id, contact.contact_id, wamid, templateContent, camp.id, t, t]
          );

          await execute(
            'UPDATE campaign_contacts SET status = ?, message_id = ?, sent_at = ? WHERE id = ?',
            ['sent', msgId, t, contact.cc_id]
          );
          sentInChunk++;
        } catch (err: any) {
          console.error(`[bulk cron] failed for ${contact.phone}`, err);
          await execute(
            'UPDATE campaign_contacts SET status = ?, error = ? WHERE id = ?',
            ['failed', String(err.message || err), contact.cc_id]
          );
          failedInChunk++;
        }

        await sleep(WA_RATE_LIMIT_MS);
      }

      // Update counters in campaign record
      await execute(
        `UPDATE campaigns SET
           sent_count = sent_count + ?,
           failed_count = failed_count + ?
         WHERE id = ?`,
        [sentInChunk, failedInChunk, camp.id]
      );
    } catch (err) {
      console.error(`Error processing campaign ${camp.id}:`, err);
    }
  }
}

function buildTemplateComponents(camp: RowDataPacket): object[] {
  const vars = (camp.template_vars as Record<string, string>) || {};
  const params = Object.values(vars).map((v) => ({ type: 'text', text: v }));
  if (params.length === 0) return [];
  return [{ type: 'body', parameters: params }];
}

// Start cron daemon inside Node runtime
export function startCronRunner() {
  if (isCronRunning) return;
  isCronRunning = true;
  console.log('Cron: Initializing WhatsApp SaaS Background Cron (every minute)...');

  cron.schedule('* * * * *', async () => {
    try {
      await resumeDelayedFlowSessions();
      await processRunningCampaigns();
    } catch (err) {
      console.error('Error in background cron job execution:', err);
    }
  });
}
