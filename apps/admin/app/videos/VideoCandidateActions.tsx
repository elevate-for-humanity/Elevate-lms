'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function VideoCandidateActions({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function decide(decision: 'approve' | 'reject') {
    setBusy(true); setError('');
    const response = await fetch(`/api/admin/video-jobs/${jobId}/review`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ decision }),
    });
    const body = await response.json().catch(() => ({}));
    setBusy(false);
    if (!response.ok) return setError(body.error || 'Review failed');
    router.refresh();
  }
  return <div className="mt-4 space-y-2">
    <div className="flex gap-2">
      <button disabled={busy} onClick={() => decide('approve')} className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white disabled:opacity-50">Approve &amp; publish</button>
      <button disabled={busy} onClick={() => decide('reject')} className="rounded-lg border border-red-300 px-3 py-2 text-xs font-black text-red-700 disabled:opacity-50">Reject</button>
    </div>
    {error && <p className="text-xs font-bold text-red-700">{error}</p>}
  </div>;
}
