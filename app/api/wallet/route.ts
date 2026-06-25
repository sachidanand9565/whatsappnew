/**
 * GET /api/wallet — current workspace's wallet balance + recent transactions
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { query } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';
import { RowDataPacket } from 'mysql2';

export async function GET(req: NextRequest) {
  try {
    const payload = requireAuth(req);

    const wsRows = await query<RowDataPacket[]>(
      'SELECT wallet_balance FROM workspaces WHERE id = ?',
      [payload.workspaceId]
    );
    if (wsRows.length === 0) return apiError('Workspace not found', 404);

    const transactions = await query<RowDataPacket[]>(
      `SELECT id, type, amount, balance_after, reason, reference_type, reference_id, created_at
       FROM wallet_transactions
       WHERE workspace_id = ?
       ORDER BY id DESC
       LIMIT 100`,
      [payload.workspaceId]
    );

    return apiSuccess({
      balance: Number(wsRows[0].wallet_balance),
      transactions,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[wallet GET]', err);
    return apiError('Server error', 500);
  }
}
