'use client';

import { useState } from 'react';
import { Ban, CheckCircle2, Loader2 } from 'lucide-react';

interface Props {
  enrollmentId: string;
  holderName?: string;
}

// Void (cancel) a queued payout. Rendered next to ApprovePayButton for rows
// that are not paid — including rows with no approved schedule, which the
// pay button cannot act on. Requires a reason, recorded in the audit log.
export default function VoidPayoutButton({ enrollmentId, holderName }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function handleVoid() {
    const reason = prompt(
      `Void this payout${holderName ? ` for ${holderName}` : ''}? It will be removed from the queue and cannot be paid afterwards.\n\nEnter the reason (required — recorded in the audit log):`,
    );
    if (reason === null) return;
    if (!reason.trim()) {
      setState('error');
      setErrorMsg('A reason is required to void a payout.');
      return;
    }

    setState('loading');
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/enrollments/void-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId, reason: reason.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState('error');
        setErrorMsg(data.error ?? 'Void failed');
        return;
      }

      if (!data.voided) throw new Error('Void was not confirmed.');
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
      <span className="inline-flex items-center gap-1 text-xs text-slate-500 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5" /> Voided — removing from queue
      </span>
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
      onClick={handleVoid}
      disabled={state === 'loading'}
      title="Void this payout (requires a reason)"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 disabled:opacity-50 rounded-lg transition-colors"
    >
      {state === 'loading' ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Ban className="w-3 h-3" />
      )}
      Void
    </button>
  );
}
