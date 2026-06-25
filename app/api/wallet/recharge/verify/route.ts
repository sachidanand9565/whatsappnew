/**
 * POST /api/wallet/recharge/verify
 * Verifies the Razorpay payment signature returned by Checkout, then
 * credits the wallet exactly once per order (idempotent on order status).
 */
import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { requireAuth } from '@/lib/auth';
import { query, execute } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';
import { creditWallet } from '@/lib/wallet';
import { RowDataPacket } from 'mysql2';

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return apiError('Missing payment verification fields');
    }

    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return apiError('Payment gateway not configured', 500);

    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return apiError('Payment verification failed — signature mismatch', 400);
    }

    const recharges = await query<RowDataPacket[]>(
      'SELECT id, workspace_id, amount, status FROM wallet_recharges WHERE razorpay_order_id = ? LIMIT 1',
      [razorpay_order_id]
    );
    const recharge = recharges[0];
    if (!recharge) return apiError('Recharge order not found', 404);
    if (recharge.workspace_id !== payload.workspaceId) return apiError('Forbidden', 403);

    if (recharge.status === 'paid') {
      // Already credited — return current balance without double-crediting
      const ws = await query<RowDataPacket[]>('SELECT wallet_balance FROM workspaces WHERE id = ?', [payload.workspaceId]);
      return apiSuccess({ balance: Number(ws[0]?.wallet_balance || 0), alreadyProcessed: true });
    }

    const affected = await execute(
      `UPDATE wallet_recharges SET status = 'paid', razorpay_payment_id = ? WHERE id = ? AND status != 'paid'`,
      [razorpay_payment_id, recharge.id]
    );
    if (affected === 0) {
      const ws = await query<RowDataPacket[]>('SELECT wallet_balance FROM workspaces WHERE id = ?', [payload.workspaceId]);
      return apiSuccess({ balance: Number(ws[0]?.wallet_balance || 0), alreadyProcessed: true });
    }

    const balance = await creditWallet(
      payload.workspaceId,
      Number(recharge.amount),
      'Wallet recharge via Razorpay',
      'razorpay',
      razorpay_payment_id
    );

    return apiSuccess({ balance });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[wallet/recharge/verify]', err);
    return apiError('Server error', 500);
  }
}
