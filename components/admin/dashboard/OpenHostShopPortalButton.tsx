'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

export function OpenHostShopPortalButton({ shopId }: { shopId: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function openPortal() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/admin/select-host-shop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_id: shopId }),
      });
      const result = await response.json();
      if (!response.ok || !result.preview_url || !result.preview_handoff) {
        throw new Error(result.error || 'Could not create the secure Host Shop preview');
      }

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
      setError(cause instanceof Error ? cause.message : 'Could not open the Host Shop portal');
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => void openPortal()}
        disabled={busy}
        className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <ArrowRight className="h-4 w-4" aria-hidden />
        )}
        {busy ? 'Opening selected shop…' : 'Open this shop portal'}
      </button>
      {error ? <p className="mt-2 text-xs font-bold text-rose-700">{error}</p> : null}
    </div>
  );
}
