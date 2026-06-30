'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AcceptDeclineButtons({ enrollmentId }: { enrollmentId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(action: 'accept' | 'decline') {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch(`/api/program-holder/students/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enrollment_id: enrollmentId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
        return;
      }
      router.refresh();
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <button
          onClick={() => act('accept')}
          disabled={!!loading}
          className="px-3 py-2 bg-brand-green-600 hover:bg-brand-green-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
        >
          {loading === 'accept' ? 'Accepting…' : 'Accept'}
        </button>
        <button
          onClick={() => act('decline')}
          disabled={!!loading}
          className="px-3 py-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
        >
          {loading === 'decline' ? 'Declining…' : 'Decline'}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
