'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import QRCode from 'qrcode';
import { apiFetch } from '@/hooks/useApi';
import toast from 'react-hot-toast';
import {
  Wallet as WalletIcon, ArrowUpCircle, ArrowDownCircle, Loader2,
  IndianRupee, Copy,
} from 'lucide-react';

interface Transaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  balance_after: number;
  reason: string;
  reference_type: string | null;
  created_at: string;
}

interface RechargeRequest {
  id: number;
  amount: number;
  utr_number: string;
  payment_note: string | null;
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at: string;
  reviewed_by_name: string | null;
}

const PRESET_AMOUNTS = [500, 1000, 2000, 5000];
const UPI_ID   = 'sachidanandkushwaha1899-2@okaxis';
const UPI_NAME = 'Sachidanand Kushwaha';

const STATUS_BADGE: Record<string, string> = {
  pending:  'bg-amber-50 text-amber-700 border-amber-200',
  approved: 'bg-green-50 text-green-700 border-green-200',
  rejected: 'bg-red-50 text-red-700 border-red-200',
};

export default function WalletPage() {
  const [balance, setBalance]           = useState<number | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [amount, setAmount]             = useState('1000');
  const [utrNumber, setUtrNumber]       = useState('');
  const [note, setNote]                 = useState('');
  const [submitting, setSubmitting]     = useState(false);
  const [requests, setRequests]         = useState<RechargeRequest[]>([]);
  const canvasRef                       = useRef<HTMLCanvasElement>(null);

  const loadWallet = useCallback(() => {
    setLoading(true);
    apiFetch('/api/wallet')
      .then((r) => { setBalance(r.data.balance); setTransactions(r.data.transactions || []); })
      .catch((e: Error) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadRequests = useCallback(() => {
    apiFetch('/api/wallet/recharge/requests').then((r) => setRequests(r.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    loadWallet();
    loadRequests();
  }, [loadWallet, loadRequests]);

  // Regenerate the UPI QR whenever the amount changes
  useEffect(() => {
    const amt = Number(amount) || 0;
    const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}&am=${amt}&cu=INR&tn=${encodeURIComponent('Wallet Recharge')}`;
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, upiUrl, { width: 220, margin: 1 }).catch(() => {});
    }
  }, [amount]);

  function copyUpiId() {
    navigator.clipboard.writeText(UPI_ID);
    toast.success('UPI ID copied!');
  }

  async function submitProof() {
    const amt = Number(amount);
    if (!amt || amt < 100) { toast.error('Minimum recharge amount is ₹100'); return; }
    if (!utrNumber.trim()) { toast.error('Enter the UTR / transaction reference number from your payment app'); return; }

    setSubmitting(true);
    try {
      await apiFetch('/api/wallet/recharge/upi-request', {
        method: 'POST',
        body: JSON.stringify({ amount: amt, utrNumber: utrNumber.trim(), note: note.trim() }),
      });
      toast.success('Payment submitted — wallet will be credited after admin approval.');
      setUtrNumber('');
      setNote('');
      loadRequests();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Wallet</h1>

      {/* Balance */}
      <div className="card flex flex-col items-start gap-2 max-w-sm">
        <div className="inline-flex p-2 rounded-lg bg-emerald-50 mb-1">
          <WalletIcon size={18} className="text-emerald-600" />
        </div>
        <p className="text-sm font-medium text-gray-500">Current Balance</p>
        {loading ? (
          <Loader2 size={22} className="animate-spin text-gray-400" />
        ) : (
          <p className={`text-3xl font-bold ${(balance || 0) <= 0 ? 'text-red-600' : 'text-gray-900'}`}>
            ₹{(balance || 0).toFixed(2)}
          </p>
        )}
        {(balance || 0) <= 0 && !loading && (
          <p className="text-xs text-red-500 font-medium">Wallet empty — template messages are blocked until you recharge.</p>
        )}
      </div>

      {/* Add Credits via UPI */}
      <div className="card grid md:grid-cols-2 gap-6">
        {/* QR side */}
        <div className="flex flex-col items-center justify-center gap-3 border-r border-gray-100 md:pr-6">
          <canvas ref={canvasRef} className="rounded-xl border border-gray-100 shadow-sm" />
          <p className="text-sm font-semibold text-gray-800">{UPI_NAME}</p>
          <button onClick={copyUpiId} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors">
            {UPI_ID} <Copy size={11} />
          </button>
          <p className="text-[11px] text-gray-400 text-center">Scan with any UPI app, pay the amount below, then submit your transaction reference for approval.</p>
        </div>

        {/* Form side */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700">1. Choose amount</p>
          <div className="flex gap-2 flex-wrap">
            {PRESET_AMOUNTS.map((a) => (
              <button key={a} onClick={() => setAmount(String(a))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${amount === String(a) ? 'bg-whatsapp-green text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                ₹{a}
              </button>
            ))}
          </div>
          <span className="relative block">
            <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="number" min={100} value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input pl-8 w-full" placeholder="Amount"
            />
          </span>

          <p className="text-sm font-semibold text-gray-700 pt-2">2. Submit payment proof</p>
          <input
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value)}
            placeholder="UTR / Transaction reference number"
            className="input w-full text-sm"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="input w-full text-sm"
          />
          <button onClick={submitProof} disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            {submitting ? <Loader2 size={14} className="animate-spin" /> : null} Submit for Approval
          </button>
          <p className="text-xs text-gray-400">Credits are added to your wallet once an admin verifies the payment.</p>
        </div>
      </div>

      {/* My recharge requests */}
      {requests.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Recharge Requests</h2>
          <div className="divide-y divide-gray-50">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2.5 gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-gray-800">₹{Number(r.amount).toFixed(2)} <span className="text-xs text-gray-400">· UTR {r.utr_number}</span></p>
                  {r.status === 'rejected' && r.rejection_reason && (
                    <p className="text-[11px] text-red-500">{r.rejection_reason}</p>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${STATUS_BADGE[r.status]}`}>{r.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-8">No transactions yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Reason</th>
                  <th className="pb-3 font-medium text-right">Amount</th>
                  <th className="pb-3 font-medium text-right">Balance After</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-2 text-gray-500">{new Date(t.created_at.includes('Z') ? t.created_at : t.created_at.replace(' ', 'T') + 'Z').toLocaleString()}</td>
                    <td className="py-2">{t.reason}</td>
                    <td className={`py-2 text-right font-medium flex items-center justify-end gap-1 ${t.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                      {t.type === 'credit' ? <ArrowUpCircle size={13} /> : <ArrowDownCircle size={13} />}
                      {t.type === 'credit' ? '+' : '-'}₹{Number(t.amount).toFixed(2)}
                    </td>
                    <td className="py-2 text-right text-gray-500">₹{Number(t.balance_after).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
