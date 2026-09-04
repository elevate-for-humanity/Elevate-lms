'use client';

import { useEffect, useState } from 'react';

type Recipient = { name: string; email: string; kind: 'apprentice' | 'host_shop' };

export default function PortalReadinessEmailPage() {
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ sent?: number; failed?: number; error?: string } | null>(null);

  useEffect(() => {
    fetch('/api/admin/portal-readiness-email', { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || 'Unable to load audience');
        setRecipients(body.recipients || []);
      })
      .catch((error) => setResult({ error: error.message }))
      .finally(() => setLoading(false));
  }, []);

  async function send() {
    setSending(true);
    setResult(null);
    try {
      const response = await fetch('/api/admin/portal-readiness-email', { method: 'POST' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || 'Send failed');
      setResult(body);
    } catch (error) {
      setResult({ error: error instanceof Error ? error.message : 'Send failed' });
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-950">
      <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">Portal communications</p>
        <h1 className="mt-2 text-3xl font-black">Portal readiness notice</h1>
        <p className="mt-3 text-slate-700">Canonical active apprentices and active approved Host Shop partners. Test, archived, inactive, duplicate, and placeholder-address records are excluded.</p>
        {loading ? <p className="mt-6 font-semibold">Loading verified audience…</p> : (
          <>
            <div className="mt-6 grid gap-3">
              {recipients.map((recipient) => (
                <div key={recipient.email} className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="font-black">{recipient.name}</p>
                  <p className="text-sm text-slate-600">{recipient.kind === 'apprentice' ? 'Apprentice' : 'Host Shop'} · {recipient.email}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={send} disabled={sending || recipients.length === 0} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 font-black text-white disabled:opacity-50">
              {sending ? 'Sending…' : `Send to all ${recipients.length} verified recipients`}
            </button>
          </>
        )}
        {result?.error ? <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 font-semibold text-red-900">{result.error}</p> : null}
        {result && !result.error ? <p role="status" className="mt-4 rounded-xl bg-green-50 p-4 font-semibold text-green-900">Sent: {result.sent ?? 0}. Failed: {result.failed ?? 0}.</p> : null}
      </div>
    </main>
  );
}
