/**
 * GET /api/messages?contactId=X
 * Returns conversation history with a contact
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const sp        = new URL(req.url).searchParams;
    const contactId = sp.get('contactId');
    const limit     = Math.min(100, Number(sp.get('limit') || 50));

    if (!contactId) return apiError('contactId required');

    // Fetch all messages for this contact's phone number AND any outbound
    // messages that were replied-to (handles templates saved under a different
    // contact_id or with contact_id = NULL due to race conditions).
    const messages = await query<RowDataPacket[]>(
      `SELECT m.*, c.name as contact_name, c.phone as contact_phone
       FROM messages m
       LEFT JOIN contacts c ON c.id = m.contact_id
       WHERE m.workspace_id = ?
         AND (
           m.contact_id IN (
             SELECT id FROM contacts
             WHERE workspace_id = ?
               AND phone = (SELECT phone FROM contacts WHERE id = ? AND workspace_id = ?)
           )
           OR m.wamid IN (
             SELECT replied_to_wamid FROM messages
             WHERE workspace_id = ?
               AND replied_to_wamid IS NOT NULL
               AND contact_id IN (
                 SELECT id FROM contacts
                 WHERE workspace_id = ?
                   AND phone = (SELECT phone FROM contacts WHERE id = ? AND workspace_id = ?)
               )
           )
         )
       ORDER BY COALESCE(m.created_at, m.sent_at) DESC, m.id DESC
       LIMIT ?`,
      [
        payload.workspaceId,
        payload.workspaceId, contactId, payload.workspaceId,
        payload.workspaceId,
        payload.workspaceId, contactId, payload.workspaceId,
        limit,
      ]
    );

    return apiSuccess(messages.reverse()); // oldest first
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    return apiError('Server error', 500);
  }
}
