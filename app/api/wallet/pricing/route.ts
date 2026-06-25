/**
 * GET /api/wallet/pricing — list per-category message rates (read-only here).
 * Pricing is configured from the Super Admin panel, not from this app.
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { apiSuccess, apiError } from '@/lib/utils';
import { getAllRates } from '@/lib/wallet';

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
    const rates = await getAllRates();
    return apiSuccess(rates);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[wallet/pricing GET]', err);
    return apiError('Server error', 500);
  }
}

// Pricing is now managed exclusively from the Super Admin panel.
export async function PUT() {
  return apiError('Pricing is managed from the Super Admin panel', 403);
}
