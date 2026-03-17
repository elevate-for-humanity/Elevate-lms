'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function VerifyPlacementButton({ placementId }: { placementId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleVerify() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/case-manager/placements/${placementId}/verify`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to verify.');
        return;
      }
      router.refresh();
    } catch {
      setError('Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleVerify}
        disabled={loading}
        className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        {loading ? 'Verifying…' : 'Verify'}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
