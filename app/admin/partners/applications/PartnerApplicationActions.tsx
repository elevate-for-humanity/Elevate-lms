'use client';

import toast from 'react-hot-toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PartnerApplicationActions({
  applicationId,
  disabled,
}: {
  applicationId: string;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function approve() {
    if (disabled || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/applications/${applicationId}/approve`, {
        method: 'POST',
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Approve failed');
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to approve application');
    } finally {
      setLoading(false);
    }
  }

  async function deny() {
    if (disabled || loading) return;
    const reason = window.prompt('Reason for denial (optional):', '') || '';
    setLoading(true);
    try {
      const res = await fetch(`/api/partner/applications/${applicationId}/deny`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.error || 'Deny failed');
      }
      router.refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to deny application');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={approve}
        disabled={disabled || loading}
        className="px-3 py-1.5 text-xs font-semibold rounded bg-brand-green-600 text-white hover:bg-brand-green-700 disabled:opacity-50"
      >
        Approve
      </button>
      <button
        type="button"
        onClick={deny}
        disabled={disabled || loading}
        className="px-3 py-1.5 text-xs font-semibold rounded bg-brand-red-600 text-white hover:bg-brand-red-700 disabled:opacity-50"
      >
        Deny
      </button>
    </div>
  );
}
