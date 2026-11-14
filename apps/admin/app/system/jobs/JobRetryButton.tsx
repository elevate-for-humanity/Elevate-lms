'use client';

import { useState } from 'react';
import { RefreshCw } from 'lucide-react';

export default function JobRetryButton({ jobId }: { jobId: string }) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function handleRetry() {
    setState('loading');
    try {
      const res = await fetch('/api/admin/jobs/retry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId }),
      });
      setState(res.ok ? 'done' : 'error');
      if (res.ok) {
        // Refresh the page after a short delay so the table updates
        setTimeout(() => window.location.reload(), 800);
      }
    } catch {
      setState('error');
    }
  }

  if (state === 'done') {
    return <span className="text-xs text-green-600 font-medium">Queued</span>;
  }
  if (state === 'error') {
    return <span className="text-xs text-red-600 font-medium">Failed</span>;
  }

  return (
    <button
      onClick={handleRetry}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 transition-colors"
    >
      <RefreshCw className={`w-3 h-3 ${state === 'loading' ? 'animate-spin' : ''}`} />
      {state === 'loading' ? 'Retrying…' : 'Retry'}
    </button>
  );
}
