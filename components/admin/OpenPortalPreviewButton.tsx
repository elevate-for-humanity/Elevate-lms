'use client';

import { useState } from 'react';
import { ExternalLink } from 'lucide-react';

export function OpenPortalPreviewButton({
  targetUserId,
  label,
  reason,
}: {
  targetUserId: string;
  label: string;
  reason: string;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function openPortal() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_user_id: targetUserId, reason }),
      });
      const result = await response.json();
      if (!response.ok || !result.preview_url) {
        throw new Error(result.error || 'Could not open the portal');
      }
      window.open(result.preview_url, '_blank', 'noopener,noreferrer');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open the portal');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={openPortal}
        disabled={busy}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-black text-indigo-800 shadow-sm hover:bg-indigo-50 disabled:opacity-60"
      >
        <ExternalLink className="h-4 w-4" />
        {busy ? 'Opening secure preview…' : label}
      </button>
      {error ? (
        <p className="max-w-72 text-right text-xs font-semibold text-rose-100">{error}</p>
      ) : null}
    </div>
  );
}
