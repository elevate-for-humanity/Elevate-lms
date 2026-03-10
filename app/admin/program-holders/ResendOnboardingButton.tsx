'use client';

import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';

export default function ResendOnboardingButton({ holderId }: { holderId: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  async function handleClick() {
    setState('sending');
    try {
      const res = await fetch('/api/admin/program-holders/resend-onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ holderId }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setState('sent');
        // Reset after 4 seconds so it can be used again
        setTimeout(() => setState('idle'), 4000);
      } else {
        console.error('[ResendOnboarding]', json.error);
        setState('error');
        setTimeout(() => setState('idle'), 4000);
      }
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  }

  if (state === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
        <CheckCircle className="w-3.5 h-3.5" /> Sent
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
        Failed
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={state === 'sending'}
      className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 text-sm font-medium disabled:opacity-50"
      title="Resend onboarding link"
    >
      {state === 'sending'
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : <Send className="w-3.5 h-3.5" />}
      {state === 'sending' ? 'Sending…' : 'Resend Link'}
    </button>
  );
}
