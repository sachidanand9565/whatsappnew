/**
 * POST /api/wallet/recharge/requests/[id]/reject
 * Deprecated: recharge review is handled only in the Super Admin panel.
 */
import { apiError } from '@/lib/utils';

export async function POST() {
  return apiError('Recharge review is handled in the Super Admin panel', 403);
}
