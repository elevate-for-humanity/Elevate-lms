'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ApproveButtonProps {
  applicationId: string;
  status: string | null;
}

export default function ApproveButton({ applicationId, status }: ApproveButtonProps) {
  const [current, setCurrent] = useState(status);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function update(newStatus: 'approved' | 'denied') {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/barber-shop-applications/status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: applicationId, status: newStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to update status');
      }
      setCurrent(newStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" /> Saving…
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {current !== 'approved' && (
        <button
          onClick={() => update('approved')}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
        >
          <CheckCircle className="w-4 h-4" /> Approve
        </button>
      )}
      {current !== 'denied' && (
        <button
          onClick={() => update('denied')}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          <XCircle className="w-4 h-4" /> Deny
        </button>
      )}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
