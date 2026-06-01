import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { apiSuccess, apiError, utcNow } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

type Params = { params: { id: string } };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const payload = requireAuth(req);
    const campaignId = Number(params.id);

    // Load campaign
    const camps = await query<RowDataPacket[]>(
      `SELECT c.*, t.name as tname, t.language, t.body_text,
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

    // Get pending contacts count
    const stats = await query<RowDataPacket[]>(
      `SELECT COUNT(*) as pending_count
       FROM campaign_contacts
       WHERE campaign_id = ? AND status = 'pending'`,
      [campaignId]
    );
    const total = stats[0]?.pending_count || 0;

    return apiSuccess({ message: `Campaign queued for sending to ${total} contacts.`, total });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[launch]', err);
    return apiError('Server error', 500);
  }
}
