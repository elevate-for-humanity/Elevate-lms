'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Eye, EyeOff, KeyRound, Loader2, XCircle } from 'lucide-react';

type ProviderKey = 'XAI_API_KEY' | 'ANTHROPIC_API_KEY';
type SecretStatus = { set?: boolean; masked?: string };
type ProviderStatus = { keys?: Partial<Record<ProviderKey, SecretStatus>> };

const PROVIDERS: Array<{
  key: ProviderKey;
  title: string;
  description: string;
  placeholder: string;
}> = [
  {
    key: 'XAI_API_KEY',
    title: 'Grok / xAI',
    description: 'Used by Course Builder and Admin Studio when xAI is selected.',
    placeholder: 'Paste your xAI API key',
  },
  {
    key: 'ANTHROPIC_API_KEY',
    title: 'Anthropic / Claude',
    description: 'Used as the Claude provider credential and AI fallback.',
    placeholder: 'Paste your Anthropic API key',
  },
];

export default function GrokSettingsClient() {
  const [values, setValues] = useState<Record<ProviderKey, string>>({
    XAI_API_KEY: '',
    ANTHROPIC_API_KEY: '',
  });
  const [visible, setVisible] = useState<Record<ProviderKey, boolean>>({
    XAI_API_KEY: false,
    ANTHROPIC_API_KEY: false,
  });
  const [status, setStatus] = useState<ProviderStatus['keys']>({});
  const [busy, setBusy] = useState<ProviderKey | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function checkStatus() {
    const response = await fetch('/api/admin/ai-provider-status', { cache: 'no-store' });
    const data = (await response.json()) as ProviderStatus & { error?: string };
    if (!response.ok) throw new Error(data.error || 'Unable to check AI provider status');
    setStatus(data.keys || {});
    return data.keys || {};
  }

  useEffect(() => {
    void checkStatus().catch((reason: unknown) =>
      setError(reason instanceof Error ? reason.message : 'Unable to check AI provider status'),
    );
  }, []);

  async function save(providerKey: ProviderKey) {
    const value = values[providerKey].trim();
    if (!value) return;
    setBusy(providerKey);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/admin/env-vars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: [{ key: providerKey, value }] }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save the provider key');
      setValues((current) => ({ ...current, [providerKey]: '' }));
      setVisible((current) => ({ ...current, [providerKey]: false }));
      const currentStatus = await checkStatus();
      if (!currentStatus[providerKey]?.set)
        throw new Error('The key was saved but the AI runtime did not activate');
      setMessage(
        `${providerKey === 'XAI_API_KEY' ? 'Grok' : 'Anthropic'} is configured and available.`,
      );
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to configure the AI provider');
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
      <div className="flex items-start gap-3">
        <span className="rounded-xl bg-slate-950 p-3 text-white">
          <KeyRound className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-black text-slate-950">AI provider keys</h1>
          <p className="mt-1 text-sm text-slate-600">
            Configure Grok and Anthropic in one place. Saved credentials are masked and never
            returned to this page.
          </p>
        </div>
      </div>
      <div className="mt-6 space-y-5">
        {PROVIDERS.map((provider) => {
          const configured = Boolean(status?.[provider.key]?.set);
          const masked = status?.[provider.key]?.masked || '';
          const isBusy = busy === provider.key;
          return (
            <div key={provider.key} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-black text-slate-950">{provider.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{provider.description}</p>
                </div>
                <div
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${configured ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}
                >
                  {configured ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {configured ? `Configured${masked ? ` (${masked})` : ''}` : 'Not configured'}
                </div>
              </div>
              <label className="mt-4 block text-sm font-bold text-slate-800" htmlFor={provider.key}>
                {provider.title} API key
              </label>
              <div className="mt-2 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <div className="relative min-w-0">
                  <input
                    id={provider.key}
                    type={visible[provider.key] ? 'text' : 'password'}
                    value={values[provider.key]}
                    onChange={(event) =>
                      setValues((current) => ({ ...current, [provider.key]: event.target.value }))
                    }
                    autoComplete="off"
                    spellCheck={false}
                    placeholder={provider.placeholder}
                    className="min-h-12 w-full rounded-xl border border-slate-300 px-3 pr-11 text-base text-slate-950 outline-none focus:border-brand-blue-600 focus:ring-2 focus:ring-brand-blue-100"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setVisible((current) => ({
                        ...current,
                        [provider.key]: !current[provider.key],
                      }))
                    }
                    aria-label={visible[provider.key] ? 'Hide API key' : 'Show API key'}
                    className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-500"
                  >
                    {visible[provider.key] ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => void save(provider.key)}
                  disabled={busy !== null || !values[provider.key].trim()}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-slate-950 px-5 font-black text-white disabled:opacity-40"
                >
                  {isBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Save & activate'}
                </button>
              </div>
            </div>
          );
        })}
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
