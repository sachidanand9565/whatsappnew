/**
 * POST /api/wallet/recharge/upi-request
 * User pays via UPI (QR/ID shown on the Wallet page) then submits the
 * transaction reference here. Wallet is credited only after an admin
 * reviews and approves the request — see /api/wallet/recharge/requests.
 */
import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { insert } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';

const MIN_AMOUNT = 100;
const MAX_AMOUNT = 100000;

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const amount = Number(body.amount);
    const utrNumber = (body.utrNumber as string || '').trim();
    const note = (body.note as string || '').trim();

    if (!amount || isNaN(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return apiError(`Amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT}`);
    }
    if (!utrNumber) return apiError('UTR / transaction reference number is required');

    const id = await insert(
      `INSERT INTO wallet_recharges (workspace_id, payment_method, amount, utr_number, payment_note, status)
       VALUES (?, 'upi', ?, ?, ?, 'pending')`,
      [payload.workspaceId, amount, utrNumber, note || null]
    );

    return apiSuccess({ id, status: 'pending' }, 201);
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[wallet/recharge/upi-request]', err);
    return apiError('Server error', 500);
  }
}
