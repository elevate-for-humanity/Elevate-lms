'use client';

import { useState } from 'react';
import { DollarSign, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

interface Props {
  enrollmentId: string;
  amount?: number;
  holderName?: string;
  holderEmail?: string;
  qbConnected: boolean;
}

export default function ApprovePayButton({
  enrollmentId, amount, holderName, holderEmail, qbConnected,
}: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [qbPaymentId, setQbPaymentId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handlePay() {
    if (!confirm(`Approve & pay ${holderName ?? 'this program holder'}${amount ? ` — $${amount.toLocaleString()}` : ''}?\n\n${qbConnected ? 'This will also push a contractor payment to QuickBooks.' : 'QuickBooks is not connected — payment will be marked paid locally only.'}`)) return;

    setState('loading');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/enrollments/mark-payout-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id:       enrollmentId,
          push_to_quickbooks:  qbConnected,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setErrorMsg(data.error ?? 'Payment failed');
        return;
      }

      if (data.quickbooks?.qb_payment_id) {
        setQbPaymentId(data.quickbooks.qb_payment_id);
      }

      setState('done');
      // Reload page after short delay to refresh queue
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      setState('error');
      setErrorMsg('Network error — try again');
    }
  }

  if (state === 'done') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
          <CheckCircle2 className="w-3.5 h-3.5" /> Paid
        </span>
        {qbPaymentId && (
          <span className="text-xs text-slate-400">QB: {qbPaymentId.slice(0, 8)}…</span>
        )}
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-red-600">{errorMsg}</span>
        <button onClick={() => setState('idle')} className="text-xs text-slate-500 underline">Retry</button>
      </div>
    );
  }

  return (
    <button
      onClick={handlePay}
      disabled={state === 'loading'}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg transition-colors"
    >
      {state === 'loading' ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <DollarSign className="w-3 h-3" />
      )}
      {qbConnected ? 'Approve & Pay' : 'Mark Paid'}
    </button>
  );
}
