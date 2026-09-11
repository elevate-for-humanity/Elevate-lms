'use client';

import { useState } from 'react';
import { CreditCard, Loader2, ShieldCheck } from 'lucide-react';

export function PaymentMethodsClient({ configured }: { configured: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function addCard() {
    setBusy(true);
    setError('');
    const response = await fetch('/api/billing/setup', { method: 'POST' });
    const result = await response.json().catch(() => ({}));
    if (response.ok && result.url) window.location.assign(result.url);
    else {
      setError(result.error || 'Debit-card setup could not be started.');
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <CreditCard className="h-9 w-9 text-blue-700" />
        <h1 className="mt-4 text-3xl font-black text-slate-950">Payment methods</h1>
        <p className="mt-2 text-slate-700">
          Add a credit or debit card for authorized Elevate payments. Card numbers are collected and
          stored by the payment processor, not Elevate.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="font-black text-slate-950">
            {configured
              ? 'A default payment method is on file'
              : 'No default payment method is on file'}
          </p>
          <p className="mt-1 text-sm text-slate-600">
            You can securely add or replace the card used for future authorized charges.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void addCard()}
          disabled={busy}
          className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-blue-700 px-5 py-3 font-black text-white disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ShieldCheck className="h-5 w-5" />
          )}
          {busy
            ? 'Opening secure setup…'
            : configured
              ? 'Replace card'
              : 'Add debit or credit card'}
        </button>
        {error ? (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-800">
            {error}
          </p>
        ) : null}
      </section>
    </div>
  );
}
