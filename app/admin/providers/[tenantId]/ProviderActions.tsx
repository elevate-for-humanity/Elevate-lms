'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldOff, Loader2 } from 'lucide-react';

export default function ProviderActions({
  tenantId,
  currentStatus,
}: {
  tenantId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [suspending, setSuspending] = useState(false);
  const [reason, setReason] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  async function suspend() {
    setSuspending(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/providers/${tenantId}/suspend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Suspension failed');
        return;
      }
      setShowConfirm(false);
      startTransition(() => router.refresh());
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSuspending(false);
    }
  }

  if (currentStatus === 'suspended') {
    return (
      <span className="text-sm text-red-600 font-medium flex items-center gap-1.5">
        <ShieldOff className="w-4 h-4" /> Suspended
      </span>
    );
  }

  return (
    <div className="relative">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition"
        >
          <ShieldOff className="w-4 h-4" /> Suspend Provider
        </button>
      ) : (
        <div className="absolute right-0 top-0 z-10 bg-white border border-slate-200 rounded-xl shadow-lg p-4 w-72 space-y-3">
          <p className="text-sm font-semibold text-slate-900">Suspend this provider?</p>
          <p className="text-xs text-slate-500">
            All programs will be unpublished immediately. The provider admin will lose access.
          </p>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Reason for suspension (optional)"
            rows={2}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              onClick={() => { setShowConfirm(false); setError(''); }}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={suspend}
              disabled={suspending}
              className="flex-1 px-3 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {suspending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Confirm
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
