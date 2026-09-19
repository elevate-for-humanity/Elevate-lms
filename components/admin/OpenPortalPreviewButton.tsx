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
      if (!response.ok || !result.preview_url || !result.preview_handoff) {
        throw new Error(result.error || 'Could not create the secure portal preview');
      }

      // Cross-subdomain previews use a short-lived signed POST handoff. Sending
      // the token in a form body keeps it out of URLs, browser history, access
      // logs, and referrer headers.
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = result.preview_url;
      const handoff = document.createElement('input');
      handoff.type = 'hidden';
      handoff.name = 'handoff';
      handoff.value = result.preview_handoff;
      form.appendChild(handoff);
      document.body.appendChild(form);
      form.submit();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not open the portal');
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
