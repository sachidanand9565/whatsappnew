/**
 * GET /api/wallet/recharge/requests
 * List this workspace's UPI recharge requests.
 * Admins see all requests (to review/approve); agents see only their own
 * submissions via the same response — the wallet page filters client-side
 * is unnecessary since everything here is already workspace-scoped.
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const rows = await query<RowDataPacket[]>(
      `SELECT wr.id, wr.amount, wr.utr_number, wr.payment_note, wr.status,
              wr.rejection_reason, wr.created_at, wr.reviewed_at,
              u.name AS reviewed_by_name
       FROM wallet_recharges wr
       LEFT JOIN users u ON u.id = wr.reviewed_by
       WHERE wr.workspace_id = ? AND wr.payment_method = 'upi'
       ORDER BY wr.id DESC
       LIMIT 100`,
      [payload.workspaceId]
    );

    return apiSuccess(rows);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[wallet/recharge/requests GET]', err);
    return apiError('Server error', 500);
  }
}
