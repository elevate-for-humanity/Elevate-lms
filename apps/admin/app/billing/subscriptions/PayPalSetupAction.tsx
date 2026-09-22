'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PayPalSetupAction({
  scheduleId,
  providerStatus,
  approvalUrl,
}: {
  scheduleId: string;
  providerStatus: string;
  approvalUrl?: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function setup() {
    setBusy(true);
    setError('');
    const response = await fetch(`/api/admin/billing/schedules/${scheduleId}/paypal`, {
      method: 'POST',
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) setError(body.error || 'PayPal setup failed.');
    else router.refresh();
    setBusy(false);
  }
  if (providerStatus === 'active') {
    return <span className="text-xs font-bold text-emerald-700">PayPal automatic billing active</span>;
  }
  if (approvalUrl) {
    return (
      <a href={approvalUrl} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-700 underline">
        Open PayPal approval
      </a>
    );
  }
  return (
    <div>
      <button disabled={busy} onClick={() => void setup()} className="text-xs font-bold text-blue-700 underline disabled:opacity-50">
        {busy ? 'Creating…' : 'Create PayPal subscription'}
      </button>
      {error ? <p className="mt-1 text-xs font-bold text-red-700">{error}</p> : null}
    </div>
  );
}
