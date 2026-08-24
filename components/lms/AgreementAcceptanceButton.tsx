'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function AgreementAcceptanceButton({ type, version }: { type: string; version: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  async function accept() {
    setBusy(true); setError('');
    const response = await fetch('/api/onboarding/accept-agreement', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ agreement_type: type, document_version: version }) });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) { setError(body.error || 'Agreement could not be saved.'); setBusy(false); return; }
    router.refresh();
  }
  return <div><button type="button" disabled={busy} onClick={accept} className="rounded-xl bg-slate-950 px-4 py-2 font-black text-white disabled:opacity-60">{busy ? 'Saving…' : 'I have read and agree'}</button>{error ? <p role="alert" className="mt-2 text-sm font-bold text-red-700">{error}</p> : null}</div>;
}
