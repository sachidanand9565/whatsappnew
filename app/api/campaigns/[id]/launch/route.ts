/**
 * POST /api/campaigns/[id]/launch
 * Launch a broadcast campaign — actually sends messages to all pending contacts.
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, execute, insert } from '@/lib/db';
import { apiSuccess, apiError, utcNow, normalizePhone } from '@/lib/utils';
import { sendTemplateMessage } from '@/lib/whatsapp';
import { decryptIdNum } from '@/lib/idCrypto';
import { getMessageRate, debitWallet, creditWallet, InsufficientBalanceError } from '@/lib/wallet';
import { RowDataPacket } from 'mysql2';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const payload = requireAuth(req);
    const campaignId = decryptIdNum(params.id);

    // Load campaign + template + workspace creds
    const camps = await query<RowDataPacket[]>(
      `SELECT c.*, t.name as tname, t.language, t.body_text, t.category,
              t.header_type, t.header_content, t.footer_text, t.buttons,
              w.access_token, w.phone_number_id
       FROM campaigns c
       JOIN templates t ON t.id = c.template_id
       JOIN workspaces w ON w.id = c.workspace_id
       WHERE c.id = ? AND c.workspace_id = ?`,
      [campaignId, payload.workspaceId]
    );
    if (camps.length === 0) return apiError('Campaign not found', 404);
    const camp = camps[0];

    if (!camp.access_token || !camp.phone_number_id) {
      return apiError('WhatsApp API not configured', 400);
    }
    if (camp.status === 'running' || camp.status === 'completed') {
      return apiError(`Campaign is already ${camp.status as string}`, 400);
    }
    if (camp.campaign_type === 'api') {
      return apiError('API campaigns cannot be launched manually. Use the /send endpoint instead.', 400);
    }

    // Mark as running
    await execute('UPDATE campaigns SET status = ?, started_at = ? WHERE id = ?', ['running', utcNow(), campaignId]);

    // Get all pending contacts
    const pendingContacts = await query<RowDataPacket[]>(
      `SELECT cc.id as cc_id, cc.contact_id, ct.phone, ct.name as contact_name
       FROM campaign_contacts cc
       JOIN contacts ct ON ct.id = cc.contact_id
       WHERE cc.campaign_id = ? AND cc.status = 'pending'`,
      [campaignId]
    );

    const total = pendingContacts.length;
    if (total === 0) {
      await execute('UPDATE campaigns SET status = ?, completed_at = ? WHERE id = ?', ['completed', utcNow(), campaignId]);
      return apiSuccess({ message: 'No pending contacts to send.', total: 0, sent: 0, failed: 0 });
    }

    // Parse template_vars mapping: { "1": "name", "2": "city" }
    let varMapping: Record<string, string> = {};
    try { varMapping = JSON.parse((camp.template_vars as string) || '{}'); } catch { varMapping = {}; }

    // Parse buttons
    let buttons: unknown[] = [];
    try { buttons = JSON.parse((camp.buttons as string) || '[]'); } catch { buttons = []; }

    const accessToken = camp.access_token as string;
    const phoneNumberId = camp.phone_number_id as string;
    const templateName = camp.tname as string;
    const language = (camp.language as string) || 'en';
    const bodyTextTemplate = (camp.body_text as string) || '';
    const category = (camp.category as string) || 'UTILITY';
    const rate = await getMessageRate(category);

    let sentCount = 0;
    let failedCount = 0;
    let walletExhausted = false;

    // Send in batches of 10 with 1s delay between batches
    const BATCH_SIZE = 10;
    for (let i = 0; i < pendingContacts.length; i += BATCH_SIZE) {
      if (walletExhausted) break;
      const batch = pendingContacts.slice(i, i + BATCH_SIZE);

      const batchPromises = batch.map(async (contact) => {
        // Wallet check — debit before sending so we never pay Meta for a message we can't afford
        if (rate > 0) {
          try {
            await debitWallet(payload.workspaceId, rate, `${category} campaign template: ${templateName}`, 'campaign', String(campaignId));
          } catch (err) {
            if (err instanceof InsufficientBalanceError) {
              walletExhausted = true;
              await execute(
                `UPDATE campaign_contacts SET status = 'failed', error = 'Insufficient wallet balance' WHERE id = ?`,
                [contact.cc_id]
              );
              failedCount++;
              return;
            }
            throw err;
          }
        }

        try {
          // Build variables for this contact from mapping
          // varMapping example: { "1": "name", "2": "city" }
          // We look up contact fields: contact.contact_name, contact.phone, etc.
          // For CSV contacts, we need to load custom fields
          const variables: Record<string, string> = {};
          const contactFields: Record<string, string> = {
            name: (contact.contact_name as string) || '',
            phone: (contact.phone as string) || '',
          };

          // If template has variable mappings, apply them
          if (Object.keys(varMapping).length > 0) {
            for (const [varIdx, mappedVal] of Object.entries(varMapping)) {
              if (varIdx.startsWith('__')) continue;
              if (typeof mappedVal === 'string' && mappedVal.startsWith('manual::')) {
                variables[varIdx] = mappedVal.slice(8);                 // fixed manual value
              } else {
                variables[varIdx] = contactFields[mappedVal] || mappedVal || '';
              }
            }
          }

          // Build template components
          const components: any[] = [];

          // Add header component if template has IMAGE, DOCUMENT, or VIDEO header
          const headerType = camp.header_type as string;
          if (['IMAGE', 'DOCUMENT', 'VIDEO'].includes(headerType)) {
            const mediaType = headerType.toLowerCase() as 'image' | 'document' | 'video';
            const mediaTypeValue = varMapping.__header_media_type;
            const mediaVal = varMapping.__header_media_value;
            if (mediaTypeValue && mediaVal) {
              components.push({
                type: 'header',
                parameters: [
                  {
                    type: mediaType,
                    [mediaType]: mediaTypeValue === 'url' ? { link: mediaVal } : { id: mediaVal }
                  }
                ]
              });
            }
          }

          if (Object.keys(variables).length > 0) {
            const sortedKeys = Object.keys(variables).sort((a, b) => Number(a) - Number(b));
            components.push({
              type: 'body',
              parameters: sortedKeys.map((k) => ({ type: 'text', text: variables[k] })),
            });
          }

          // Send via Meta API (normalize the number so it always has a country code)
          const toPhone = normalizePhone(contact.phone as string);
          const result = await sendTemplateMessage(
            accessToken,
            phoneNumberId,
            toPhone,
            templateName,
            language,
            components,
          );

          const wamid = (result?.messages as Record<string, unknown>[])?.[0]?.id as string | undefined;

          // Build rendered body text
          let bodyText = bodyTextTemplate;
          for (const [k, v] of Object.entries(variables)) {
            bodyText = bodyText.replace(new RegExp(`\\{\\{${k}\\}\\}`, 'g'), v);
          }

          // Store message in messages table
          const templateContent = JSON.stringify({
            __type: 'template',
            template_name: templateName,
            header_type: camp.header_type || 'NONE',
            header_content: camp.header_content || '',
            body: bodyText,
            footer: camp.footer_text || '',
            buttons,
          });

          const t = utcNow();
          const msgId = await insert(
            `INSERT INTO messages
               (workspace_id, contact_id, wamid, direction, type, content, campaign_id, status, sent_at, created_at)
             VALUES (?, ?, ?, 'outbound', 'template', ?, ?, 'sent', ?, ?)`,
            [payload.workspaceId, contact.contact_id, wamid || null, templateContent, campaignId, t, t]
          );

          // Update campaign_contacts status
          await execute(
            `UPDATE campaign_contacts SET status = 'sent', message_id = ?, sent_at = ? WHERE id = ?`,
            [msgId, t, contact.cc_id]
          );

          sentCount++;
        } catch (err) {
          // Send failed after we already debited the wallet — refund since no message went out
          if (rate > 0) {
            await creditWallet(payload.workspaceId, rate, `Refund: failed send for ${templateName}`, 'campaign', String(campaignId));
          }
          // Mark this contact as failed — surface the real Meta reason, not just "status code 400"
          const fb = (err as { response?: { data?: { error?: Record<string, unknown> } } })?.response?.data?.error;
          const code = fb?.code ? `[${fb.code}] ` : '';
          const errorMsg = fb
            ? `${code}${(fb.error_user_msg as string) || (fb.message as string) || 'Meta error'}`
            : (err instanceof Error ? err.message : 'Unknown error');
          await execute(
            `UPDATE campaign_contacts SET status = 'failed', error = ? WHERE id = ?`,
            [errorMsg.slice(0, 250), contact.cc_id]
          );
          failedCount++;
          console.error(`[launch] Failed to send to ${contact.phone}:`, err);
        }
      });

      await Promise.all(batchPromises);

      // Update campaign counters after each batch
      await execute(
        `UPDATE campaigns SET sent_count = ?, failed_count = ? WHERE id = ?`,
        [sentCount, failedCount, campaignId]
      );

      // Delay between batches to avoid rate limiting (skip after last batch)
      if (i + BATCH_SIZE < pendingContacts.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // If wallet ran out mid-campaign, pause it (remaining contacts stay 'pending' so
    // re-launching after a recharge picks up where it left off) instead of marking complete.
    const finalStatus = walletExhausted ? 'paused' : 'completed';
    await execute(
      `UPDATE campaigns SET status = ?, ${walletExhausted ? '' : 'completed_at = ?, '}sent_count = ?, failed_count = ? WHERE id = ?`,
      walletExhausted ? [finalStatus, sentCount, failedCount, campaignId] : [finalStatus, utcNow(), sentCount, failedCount, campaignId]
    );

    return apiSuccess({
      message: walletExhausted
        ? `Campaign paused — wallet balance exhausted. Sent: ${sentCount}, Failed: ${failedCount}. Recharge and re-launch to continue.`
        : `Campaign completed. Sent: ${sentCount}, Failed: ${failedCount}`,
      total,
      sent: sentCount,
      failed: failedCount,
      walletExhausted,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[launch]', err);
    return apiError('Server error', 500);
  }
}
