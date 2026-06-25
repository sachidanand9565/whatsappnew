/**
 * POST /api/wallet/recharge/create-order
 * Creates a Razorpay order for a wallet top-up. The client then opens
 * Razorpay Checkout with the returned order_id and, on success, calls
 * /api/wallet/recharge/verify to credit the wallet.
 */
import { NextRequest } from 'next/server';
import Razorpay from 'razorpay';
import { requireAuth } from '@/lib/auth';
import { insert } from '@/lib/db';
import { apiSuccess, apiError } from '@/lib/utils';

const MIN_AMOUNT = 100;   // ₹100
const MAX_AMOUNT = 100000; // ₹1,00,000

export async function POST(req: NextRequest) {
  try {
    const payload = requireAuth(req);
    const body = await req.json();
    const amount = Number(body.amount);

    if (!amount || isNaN(amount) || amount < MIN_AMOUNT || amount > MAX_AMOUNT) {
      return apiError(`Amount must be between ₹${MIN_AMOUNT} and ₹${MAX_AMOUNT}`);
    }

    const keyId     = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) return apiError('Payment gateway not configured', 500);

    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // paise
      currency: 'INR',
      receipt:  `wallet_${payload.workspaceId}_${Date.now()}`,
      notes:    { workspace_id: String(payload.workspaceId) },
    });

    await insert(
      `INSERT INTO wallet_recharges (workspace_id, razorpay_order_id, amount, status)
       VALUES (?, ?, ?, 'created')`,
      [payload.workspaceId, order.id, amount]
    );

    return apiSuccess({
      orderId:  order.id,
      amount:   order.amount,
      currency: order.currency,
      keyId,
    });
  } catch (err: unknown) {
    if (err instanceof Error && err.message === 'UNAUTHORIZED') return apiError('Unauthorized', 401);
    console.error('[wallet/recharge/create-order]', err);
    return apiError('Failed to create payment order', 500);
  }
}
