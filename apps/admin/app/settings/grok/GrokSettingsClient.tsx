'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Eye, EyeOff, KeyRound, Loader2, XCircle } from 'lucide-react';

type ProviderStatus = {
  keys?: { XAI_API_KEY?: { set?: boolean; masked?: string } };
};

export default function GrokSettingsClient() {
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [masked, setMasked] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function checkStatus() {
    const response = await fetch('/api/admin/ai-provider-status', { cache: 'no-store' });
    const data = (await response.json()) as ProviderStatus & { error?: string };
    if (!response.ok) throw new Error(data.error || 'Unable to check Grok status');
    const xai = data.keys?.XAI_API_KEY;
    const ready = Boolean(xai?.set);
    setConfigured(ready);
    setMasked(xai?.masked || '');
    return ready;
  }

  useEffect(() => {
    void checkStatus().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : 'Unable to check Grok status'),
    );
  }, []);

  async function save() {
    if (!key.trim()) return;
    setBusy(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/env-vars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [{ key: 'XAI_API_KEY', value: key.trim() }] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save the Grok key');
      setKey('');
      setShow(false);
      const ready = await checkStatus();
      if (!ready) throw new Error('The key was saved but the Grok runtime did not activate');
      setMessage('Grok is configured and available to Admin Studio.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to configure Grok');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-slate-950 p-3 text-white">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-black text-slate-950">Grok / xAI setup</h1>
          <p className="mt-1 text-sm text-slate-600">
            Save the xAI credential as <code>XAI_API_KEY</code>. It is never returned to this page
            after saving.
          </p>
        </div>
      </div>

      <div
        className={`mt-5 flex items-center gap-2 rounded-xl border p-3 text-sm font-bold ${configured ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}
      >
        {configured ? <CheckCircle className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
        {configured ? `Configured${masked ? ` (${masked})` : ''}` : 'Not configured'}
      </div>

      <label className="mt-6 block text-sm font-bold text-slate-800" htmlFor="xai-api-key">
        Grok API key
      </label>
      <div className="mt-2 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <input
            id="xai-api-key"
            type={show ? 'text' : 'password'}
            value={key}
            onChange={(event) => setKey(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            placeholder="Paste your xAI API key"
            className="min-h-12 w-full rounded-xl border border-slate-300 px-3 pr-11 text-base text-slate-950 outline-none focus:border-brand-blue-600 focus:ring-2 focus:ring-brand-blue-100"
          />
          <button
            type="button"
            onClick={() => setShow((value) => !value)}
            aria-label={show ? 'Hide API key' : 'Show API key'}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500"
          >
            {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>
        <button
          type="button"
          onClick={() => void save()}
          disabled={busy || !key.trim()}
          className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 font-black text-white disabled:opacity-40"
        >
          {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save & test'}
        </button>
      </div>

      {message ? (
        <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">{error}</p>
      ) : null}
    </section>
  );
}
