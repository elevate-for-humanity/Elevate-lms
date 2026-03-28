'use client';

import { useState } from 'react';
import { Mail, Loader2, CheckCircle } from 'lucide-react';

interface Props {
  pendingCount: number;
}

export function FollowUpBlastButton({ pendingCount }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [sent, setSent] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleBlast() {
    if (pendingCount === 0) return;
    if (!confirm(`Send follow-up emails to ${pendingCount} pending applicant(s)?`)) return;

    setState('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/applications/follow-up-blast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? 'Failed to send follow-up emails');
        setState('error');
        return;
      }
      setSent(data.sent ?? pendingCount);
      setState('done');
      // Reset after 4 seconds
      setTimeout(() => setState('idle'), 4000);
    } catch {
      setErrorMsg('Network error — please try again');
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  }

  if (pendingCount === 0) return null;

  return (
    <button
      onClick={handleBlast}
      disabled={state === 'loading'}
      title={`Send follow-up emails to ${pendingCount} pending applicant(s)`}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
        state === 'done'
          ? 'bg-green-600 text-white'
          : state === 'error'
          ? 'bg-red-600 text-white'
          : 'bg-amber-500 hover:bg-amber-600 text-white'
      }`}
    >
      {state === 'loading' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : state === 'done' ? (
        <CheckCircle className="w-4 h-4" />
      ) : (
        <Mail className="w-4 h-4" />
      )}
      {state === 'loading'
        ? 'Sending…'
        : state === 'done'
        ? `Sent ${sent}`
        : state === 'error'
        ? errorMsg.slice(0, 40)
        : `Follow-up (${pendingCount})`}
    </button>
  );
}
