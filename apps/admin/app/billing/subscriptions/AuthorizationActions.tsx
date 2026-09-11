'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AuthorizationActions({
  id,
  status,
  hasDocument,
}: {
  id: string;
  status: string;
  hasDocument: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function review(action: 'approve' | 'reject') {
    const reason =
      action === 'reject' ? window.prompt('Why does this document need correction?') : null;
    if (action === 'reject' && !reason) return;
    setBusy(true);
    setError('');
    const response = await fetch(`/api/admin/billing/authorizations/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(action === 'approve' ? { action } : { action, reason }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setError(body.error || 'Review failed.');
      setBusy(false);
      return;
    }
    router.refresh();
  }
  if (!hasDocument || status === 'requested')
    return <span className="text-xs font-semibold text-amber-700">Waiting on student</span>;
  if (status === 'approved')
    return (
      <span className="text-xs font-semibold text-emerald-700">Approved — ready for cutover</span>
    );
  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <button
          disabled={busy}
          onClick={() => void review('approve')}
          className="rounded-lg bg-emerald-700 px-3 py-2 text-xs font-black text-white"
        >
          Approve
        </button>
        <button
          disabled={busy}
          onClick={() => void review('reject')}
          className="rounded-lg bg-red-700 px-3 py-2 text-xs font-black text-white"
        >
          Reject
        </button>
      </div>
      {error ? <p className="text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
