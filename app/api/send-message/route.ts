/**
 * POST /api/send-message
 * Send a text or template message to a contact
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, insert } from '@/lib/db';
import { sendTextMessage, sendTemplateMessage, sendMediaMessage } from '@/lib/whatsapp';
import { apiSuccess, apiError, normalizePhone, utcNow } from '@/lib/utils';
import { getMessageRate, debitWallet, InsufficientBalanceError } from '@/lib/wallet';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const { contactId, type, text, templateName, language, components, templateParams, mediaId, caption, filename } = body;

    if (!contactId) return apiError('contactId is required');

    // Get workspace config
    const ws = await query<RowDataPacket[]>(
      'SELECT access_token, phone_number_id FROM workspaces WHERE id = ? AND is_active = 1',
      [payload.workspaceId]
    );
    if (ws.length === 0) return apiError('Workspace not configured', 400);
    const { access_token, phone_number_id } = ws[0];

    if (!access_token || !phone_number_id) {
      return apiError('WhatsApp API not configured in workspace settings', 400);
    }

    // Get contact phone
    const contacts = await query<RowDataPacket[]>(
      'SELECT phone FROM contacts WHERE id = ? AND workspace_id = ?',
      [contactId, payload.workspaceId]
    );
    if (contacts.length === 0) return apiError('Contact not found', 404);
    const phone = normalizePhone(contacts[0].phone as string);

    let result: Record<string, unknown>;
    let content: string;
    let msgType: string;

//  return type;
    if (type === 'template') {
      if (!templateName) return apiError('templateName required for template messages');

      // Fetch template body from DB so inbox can render it properly, and to know its
      // billing category for the wallet deduction below.
      const tplRows = await query<RowDataPacket[]>(
        'SELECT body_text, buttons, header_type, header_content, footer_text, category FROM templates WHERE name = ? AND workspace_id = ? LIMIT 1',
        [templateName, payload.workspaceId]
      );
      const tplRow = tplRows[0];
      const category = (tplRow?.category as string) || 'UTILITY';

      // Wallet check — block sending once the workspace runs out of credits
      const rate = await getMessageRate(category);
      const walletRows = await query<RowDataPacket[]>('SELECT wallet_balance FROM workspaces WHERE id = ?', [payload.workspaceId]);
      const balance = Number(walletRows[0]?.wallet_balance || 0);
      if (rate > 0 && balance < rate) {
        return apiError(`Insufficient wallet balance. This ${category.toLowerCase()} template costs ₹${rate.toFixed(2)} but your wallet has ₹${balance.toFixed(2)}. Please recharge.`, 402);
      }

      // Accept either full WhatsApp `components` array OR simple `templateParams` string array
      let resolvedComponents: object[] = components || [];
      if (!components && Array.isArray(templateParams) && templateParams.length > 0) {
        resolvedComponents = [{
          type: 'body',
          parameters: templateParams.map((val: string) => ({ type: 'text', text: String(val) })),
        }];
      }

      result = await sendTemplateMessage(access_token as string, phone_number_id as string, phone, templateName, language || 'en', resolvedComponents);

      // Message sent successfully — deduct wallet
      if (rate > 0) {
        try {
          await debitWallet(payload.workspaceId, rate, `${category} template sent: ${templateName}`, 'message', String(contactId));
        } catch (err) {
          if (!(err instanceof InsufficientBalanceError)) throw err;
          // Balance dropped between the check and the debit (race) — message already sent via Meta, just log it.
          console.error('[wallet] debit failed after send (race)', { workspaceId: payload.workspaceId, templateName });
        }
      }

      let bodyText = (tplRow?.body_text as string) || '';

      // Replace variables with actual values from templateParams
      if (Array.isArray(templateParams) && templateParams.length > 0) {
        templateParams.forEach((val: string, i: number) => {
          bodyText = bodyText.replace(new RegExp(`\\{\\{${i + 1}\\}\\}`, 'g'), val);
        });
      }

      // Store in inbox-compatible format so messages render correctly
      content = JSON.stringify({
        __type:         'template',
        template_name:  templateName,
        header_type:    (tplRow?.header_type  as string) || '',
        header_content: (tplRow?.header_content as string) || '',
        body:           bodyText,
        footer:         (tplRow?.footer_text  as string) || '',
        buttons:        JSON.parse((tplRow?.buttons as string) || '[]'),
      });
      msgType = 'template';
    } else if (['image', 'document', 'video', 'audio'].includes(type)) {
      if (!mediaId) return apiError('mediaId required for media messages');
      const mt = type as 'image' | 'document' | 'video' | 'audio';
      
      
      result  = await sendMediaMessage(access_token as string, phone_number_id as string, phone, mt, mediaId as string, caption, filename);
      content = JSON.stringify({ __type: 'media', media_id: mediaId, mime_type: mt, caption, filename, workspace_id: payload.workspaceId });
      msgType = type;
    } else {
      if (!text) return apiError('text required');
      result  = await sendTextMessage(access_token as string, phone_number_id as string, phone, text);
      content = text;
      msgType = 'text';
    }

    const wamid = (result?.messages as Record<string, unknown>[])?.[0]?.id as string;

    // Store in DB
    const msgId = await insert(
      `INSERT INTO messages (workspace_id, contact_id, wamid, direction, type, content, status, sent_at, created_at)
       VALUES (?, ?, ?, 'outbound', ?, ?, 'sent', ?, ?)`,
      [payload.workspaceId, contactId, wamid, msgType, content, utcNow(), utcNow()]
    );

    return apiSuccess({ messageId: msgId, wamid });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[send-message]', err);
    return apiError('Failed to send message', 500);
  }
}
