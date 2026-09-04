'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

export function OpenLearnerPortalButton({ studentId }: { studentId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function openPortal() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: studentId, reason: 'Admin learner portal review' }),
      });
      const result = await response.json();
      if (!response.ok || !result.preview_url) throw new Error(result.error || 'Could not open learner portal');
      window.open(result.preview_url, '_blank', 'noopener,noreferrer');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open learner portal');
    } finally {
      setBusy(false);
    }
  }
  return <div className="flex flex-col items-end gap-1"><button type="button" onClick={openPortal} disabled={busy} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-blue-800 disabled:opacity-60"><ExternalLink className="h-4 w-4" />{busy ? 'Opening…' : 'Open learner portal'}</button>{error ? <p className="max-w-64 text-right text-xs font-semibold text-rose-700">{error}</p> : null}</div>;
}
