'use client';

import { useState } from 'react';
import { Link2, Loader2, CheckCircle2 } from 'lucide-react';

export default function LinkAccountButton({
  apprenticeId,
  userId,
  email,
}: {
  apprenticeId: string;
  userId: string;
  email: string;
}) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleLink() {
    setState('loading');
    try {
      const res = await fetch('/api/admin/apprenticeships/link-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apprenticeId, userId }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error ?? 'Failed'); setState('error'); return; }
      setState('done');
    } catch {
      setErrorMsg('Network error');
      setState('error');
    }
  }

  if (state === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-green-700 font-medium">
        <CheckCircle2 className="w-4 h-4" /> Linked
      </span>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleLink}
        disabled={state === 'loading'}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-brand-blue-700 disabled:opacity-50 transition"
      >
        {state === 'loading'
          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Linking…</>
          : <><Link2 className="w-3.5 h-3.5" /> Link Account</>}
      </button>
      {state === 'error' && <p className="text-xs text-red-600">{errorMsg}</p>}
    </div>
  );
}
