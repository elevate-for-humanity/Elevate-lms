'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

export default function CreatorStatusActions({
  creatorId,
  action,
}: {
  creatorId: string;
  action: 'suspend' | 'reactivate';
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    const label = action === 'suspend' ? 'Suspend' : 'Reactivate';
    if (!confirm(`${label} this creator?`)) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/creators/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error ?? `Failed to ${action}`);
      }
      toast.success(`Creator ${action === 'suspend' ? 'suspended' : 'reactivated'}`);
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handle}
      disabled={loading}
      className={
        action === 'suspend'
          ? 'text-brand-orange-600 hover:underline text-sm disabled:opacity-50'
          : 'text-brand-green-600 hover:underline text-sm disabled:opacity-50'
      }
    >
      {loading ? '…' : action === 'suspend' ? 'Suspend' : 'Reactivate'}
    </button>
  );
}
