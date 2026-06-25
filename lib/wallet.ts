/**
 * lib/wallet.ts
 * Workspace wallet — balance checks, atomic debit/credit, per-category pricing.
 */
import { query, insert, execute } from './db';
import { utcNow } from './utils';
import { RowDataPacket } from 'mysql2';

export class InsufficientBalanceError extends Error {
  constructor() { super('INSUFFICIENT_WALLET_BALANCE'); }
}

// ---- Manual UPI recharge details (Razorpay flow is on hold) ----
export const UPI_PAYEE_ID   = process.env.UPI_PAYEE_ID   || 'sachidanandkushwaha1899-2@okaxis';
export const UPI_PAYEE_NAME = process.env.UPI_PAYEE_NAME || 'Sachidanand Kushwaha';

// ---- Get the configured rate (INR) for a template category ----
export async function getMessageRate(category: string): Promise<number> {
  const rows = await query<RowDataPacket[]>(
    'SELECT rate FROM message_pricing WHERE category = ?',
    [category]
  );
  return rows[0] ? Number(rows[0].rate) : 0;
}

export async function getAllRates(): Promise<{ category: string; rate: number }[]> {
  const rows = await query<RowDataPacket[]>('SELECT category, rate FROM message_pricing ORDER BY category');
  return rows.map((r) => ({ category: r.category as string, rate: Number(r.rate) }));
}

export async function getWalletBalance(workspaceId: number): Promise<number> {
  const rows = await query<RowDataPacket[]>(
    'SELECT wallet_balance FROM workspaces WHERE id = ?',
    [workspaceId]
  );
  return rows[0] ? Number(rows[0].wallet_balance) : 0;
}

// ---- Atomically debit the wallet; throws InsufficientBalanceError if balance too low ----
export async function debitWallet(
  workspaceId:    number,
  amount:         number,
  reason:         string,
  referenceType?: string,
  referenceId?:   string
): Promise<number> {
  if (amount <= 0) return getWalletBalance(workspaceId);

  const affected = await execute(
    'UPDATE workspaces SET wallet_balance = wallet_balance - ? WHERE id = ? AND wallet_balance >= ?',
    [amount, workspaceId, amount]
  );
  if (affected === 0) throw new InsufficientBalanceError();

  const balanceAfter = await getWalletBalance(workspaceId);
  await insert(
    `INSERT INTO wallet_transactions (workspace_id, type, amount, balance_after, reason, reference_type, reference_id, created_at)
     VALUES (?, 'debit', ?, ?, ?, ?, ?, ?)`,
    [workspaceId, amount, balanceAfter, reason, referenceType || null, referenceId || null, utcNow()]
  );
  return balanceAfter;
}

// ---- Credit the wallet (recharge, refund, manual adjustment) ----
export async function creditWallet(
  workspaceId:    number,
  amount:         number,
  reason:         string,
  referenceType?: string,
  referenceId?:   string
): Promise<number> {
  await execute('UPDATE workspaces SET wallet_balance = wallet_balance + ? WHERE id = ?', [amount, workspaceId]);

  const balanceAfter = await getWalletBalance(workspaceId);
  await insert(
    `INSERT INTO wallet_transactions (workspace_id, type, amount, balance_after, reason, reference_type, reference_id, created_at)
     VALUES (?, 'credit', ?, ?, ?, ?, ?, ?)`,
    [workspaceId, amount, balanceAfter, reason, referenceType || null, referenceId || null, utcNow()]
  );
  return balanceAfter;
}

// ---- Check (without deducting) whether the wallet can afford one message of this category ----
export async function canAffordCategory(workspaceId: number, category: string): Promise<boolean> {
  const [balance, rate] = await Promise.all([getWalletBalance(workspaceId), getMessageRate(category)]);
  return balance >= rate;
}
