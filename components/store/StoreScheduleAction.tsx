'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
export default function StoreScheduleAction({ scheduleId }: { scheduleId: string }) {
  const [confirming, setConfirming] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const router = useRouter();
  const stop = async () => {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/store/account/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduleId }),
      });
      const result = await response.json();
      if (!response.ok) throw Error(result.error || 'Could not stop future invoices.');
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not stop future invoices.');
      setBusy(false);
    }
  };
  return (
    <div className="mt-4">
      {confirming ? (
        <>
          <p className="text-sm">
            Stop future invoices for this subscription? Your current paid period remains available.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              disabled={busy}
              onClick={stop}
              className="rounded-lg bg-slate-950 px-4 py-3 text-sm font-bold text-white"
            >
              {busy ? 'Saving…' : 'Confirm stop'}
            </button>
            <button
              disabled={busy}
              onClick={() => setConfirming(false)}
              className="rounded-lg border px-4 py-3 text-sm font-bold"
            >
              Keep subscription
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setConfirming(true)}
          className="rounded-lg border px-4 py-3 text-sm font-bold"
        >
          Stop future invoices
        </button>
      )}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
