'use client';

import { useEffect, useState } from 'react';

type Provider = 'paypal' | 'branch';

type Status = {
  provider: Provider | null;
  destination: string | null;
  transfersEnabled: boolean;
  payoutsEnabled: boolean;
  providerConfigured: boolean;
  verificationStatus: string;
  onboardingReady: boolean;
  missingRequirements: string[];
};

const initial: Status = {
  provider: null,
  destination: null,
  transfersEnabled: false,
  payoutsEnabled: false,
  providerConfigured: false,
  verificationStatus: 'not_started',
  onboardingReady: false,
  missingRequirements: [],
};

export function PayoutAccessPanel() {
  const [status, setStatus] = useState<Status>(initial);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');

  const load = () =>
    fetch('/api/program-holder/payouts')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        setStatus(data);
      })
      .catch((cause) =>
        setError(cause instanceof Error ? cause.message : 'Unable to load payout setup.'),
      )
      .finally(() => setBusy(false));

  useEffect(() => {
    void load();
  }, []);

  async function openPayoutProvider(action: 'onboard' | 'dashboard') {
    setBusy(true);
    setError('');

    try {
      const response = await fetch('/api/program-holder/payouts', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, provider: status.provider || 'branch' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to continue.');
      if (data.url) window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to continue.');
    } finally {
      setBusy(false);
    }
  }

  const ready =
    status.onboardingReady &&
    status.transfersEnabled &&
    status.payoutsEnabled &&
    status.providerConfigured;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[.16em] text-blue-700">
        Secure contractor payouts
      </p>
      <h2 className="mt-2 text-2xl font-black">
        {ready ? 'Funds access is ready' : 'Finish secure payment setup'}
      </h2>
      <p className="mt-2 text-sm text-slate-600">
        Your payment provider securely collects your banking details. Elevate never receives or
        stores the full account or debit-card number. QuickBooks records completed payments but does
        not hold your payout credentials.
      </p>

      <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
        <p className="font-bold text-blue-950">
          {status.provider === 'paypal' ? 'PayPal' : 'Direct deposit (ACH)'}
        </p>
        <p className="mt-1 text-sm text-blue-900">
          {status.provider === 'paypal'
            ? 'Connect PayPal only if you want payments delivered to PayPal.'
            : 'Add banking information through the secure ACH provider to receive direct deposits. Availability and speed are confirmed by the provider.'}
        </p>
      </div>

      {status.destination ? (
        <p className="mt-3 text-sm">Connected destination: {status.destination}</p>
      ) : null}

      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">
          {error}
        </p>
      ) : null}

      <button
        disabled={busy}
        onClick={() => openPayoutProvider(ready ? 'dashboard' : 'onboard')}
        className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50"
      >
        {busy ? 'Checking…' : ready ? 'Open payout settings' : 'Add banking information'}
      </button>
    </section>
  );
}
