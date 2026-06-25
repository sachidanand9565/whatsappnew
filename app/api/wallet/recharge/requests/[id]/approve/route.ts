/**
 * POST /api/wallet/recharge/requests/[id]/approve
 * Deprecated: recharge approvals are handled only in the Super Admin panel,
 * which receives the UPI payments. Disabled here to prevent self-crediting.
 */
import { apiError } from '@/lib/utils';

export async function POST() {
  return apiError('Recharge approvals are handled in the Super Admin panel', 403);
}
