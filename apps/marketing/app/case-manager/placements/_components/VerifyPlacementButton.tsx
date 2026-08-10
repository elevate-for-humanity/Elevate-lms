'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  placementId: string;
};

export default function VerifyPlacementButton({ placementId }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function verify() {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/case-manager/placements', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placementId,
          status: 'verified',
          verificationMethod: 'employer_contact',
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Unable to verify placement.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify placement.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={verify}
        disabled={saving}
        className="rounded-md bg-brand-green-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-green-800 disabled:opacity-60"
      >
        {saving ? 'Verifying…' : 'Verify'}
      </button>
      {error ? <span role="alert" className="max-w-48 text-right text-xs text-red-700">{error}</span> : null}
    </div>
  );
}
