'use client';

import { useState } from 'react';
import { Send, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  guestCount: number;
}

export function BulkOnboardingButton({ guestCount }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<{ sent: number; failed: number } | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSend() {
    if (guestCount === 0) return;
    if (!confirm(`Send onboarding emails to up to 50 guest applicants (${guestCount} pending)?`)) return;

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/applications/bulk-send-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 50 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to send onboarding emails');
        setState('error');
        return;
      }
      setResult({ sent: data.sent, failed: data.failed });
      setState('done');
    } catch {
      setErrorMsg('Network error — please try again');
      setState('error');
    }
  }

  if (guestCount === 0) return null;

  if (state === 'done' && result) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-brand-green-50 border border-brand-green-200 rounded-lg text-sm text-brand-green-700">
        <CheckCircle className="w-4 h-4" />
        Sent {result.sent} onboarding emails{result.failed > 0 ? ` (${result.failed} failed)` : ''}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleSend}
        disabled={state === 'loading'}
        className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
      >
        {state === 'loading' ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Send className="w-4 h-4" />
        )}
        {state === 'loading' ? 'Sending…' : `Send Onboarding (${guestCount} pending)`}
      </button>
      {state === 'error' && (
        <p className="text-xs text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
