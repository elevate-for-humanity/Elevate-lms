'use client';

import { useState } from 'react';
import { DollarSign, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';

interface Props {
  enrollmentId: string;
  amount?: number;
  holderName?: string;
  holderEmail?: string;
  qbConnected: boolean;
  provider?: string;
}

export default function ApprovePayButton({
  enrollmentId,
  amount,
  holderName,
  holderEmail,
  qbConnected,
  provider,
}: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [qbPaymentId, setQbPaymentId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (provider === 'quickbooks') return (
    <a href="https://qbo.intuit.com/app/contractors" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-lg border px-3 text-sm font-bold text-blue-800">
      Pay in QuickBooks <ExternalLink className="h-4 w-4" />
    </a>
  );
  if (provider !== 'paypal' || !amount || amount <= 0) return (
    <span className="text-xs text-amber-800">{!amount ? 'Approved payout schedule required' : 'Complete payout setup first'}</span>
  );

  async function handlePay() {
    if (
      !confirm(
        `Approve and release ${holderName ?? 'this program holder'}${amount ? ` — $${amount.toLocaleString()}` : ''} through PayPal now?\n\n${qbConnected ? 'After the payout provider confirms delivery, it will be recorded in QuickBooks.' : 'QuickBooks is not connected, so the accounting record will remain pending.'}`,
      )
    )
      return;

    setState('loading');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/enrollments/mark-payout-paid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enrollment_id: enrollmentId,
          expected_amount_cents: Math.round((amount || 0) * 100),
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

      if (!data.released) throw new Error('Payment release was not confirmed.');
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
          <CheckCircle2 className="w-3.5 h-3.5" /> Submitted — awaiting confirmation
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
        <button onClick={() => setState('idle')} className="text-xs text-slate-500 underline">
          Retry
        </button>
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
      Pay with PayPal
    </button>
  );
}
