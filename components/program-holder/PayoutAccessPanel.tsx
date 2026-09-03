'use client';
import { useEffect, useState } from 'react';

type Status = {
  accountId: string | null;
  transfersEnabled: boolean;
  payoutsEnabled: boolean;
  verificationStatus: 'not_started' | 'pending' | 'restricted' | 'active';
  onboardingReady: boolean;
  missingRequirements: string[];
};
const initial: Status = {
  accountId: null,
  transfersEnabled: false,
  payoutsEnabled: false,
  verificationStatus: 'not_started',
  onboardingReady: false,
  missingRequirements: [],
};

export function PayoutAccessPanel() {
  const [status, setStatus] = useState<Status>(initial);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    fetch('/api/program-holder/payouts', { credentials: 'same-origin' })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to load payout status.');
        setStatus(data);
      })
      .catch((reason) =>
        setError(reason instanceof Error ? reason.message : 'Unable to load payout status.'),
      )
      .finally(() => setBusy(false));
  }, []);

  async function begin(action: 'onboard' | 'dashboard') {
    setBusy(true);
    setError('');
    try {
      const response = await fetch('/api/program-holder/payouts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to continue.');
      if (data.url) window.location.assign(data.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Unable to continue.');
      setBusy(false);
    }
  }

  const ready = status.onboardingReady && status.transfersEnabled && status.payoutsEnabled;
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
            Secure payout account
          </p>
          <h2 className="mt-2 text-2xl font-black">
            {ready ? 'Funds access is ready' : 'Add a debit card or bank account'}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Stripe securely collects and stores payout details. Elevate never receives or stores the
            full debit-card or bank-account number.
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-black ${ready ? 'bg-emerald-100 text-emerald-900' : 'bg-amber-100 text-amber-900'}`}
        >
          {busy
            ? 'Checking…'
            : ready
              ? 'Ready for payouts'
              : status.verificationStatus.replaceAll('_', ' ')}
        </span>
      </div>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="font-bold">Receive released funds</p>
          <p className="mt-1 text-sm text-slate-600">
            {status.transfersEnabled ? 'Enabled' : 'Complete Stripe verification'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="font-bold">Withdraw to debit card or bank</p>
          <p className="mt-1 text-sm text-slate-600">
            {status.payoutsEnabled ? 'Enabled' : 'Add and verify a payout destination'}
          </p>
        </div>
      </div>
      {error ? (
        <p role="alert" className="mt-4 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-800">
          {error}
        </p>
      ) : null}
      {!status.onboardingReady && status.missingRequirements.length ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="font-bold text-amber-950">Payment hold: onboarding incomplete</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {status.missingRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}
      <div className="mt-6">
        <button
          disabled={busy || !status.onboardingReady}
          onClick={() => begin(ready ? 'dashboard' : 'onboard')}
          className="min-h-11 rounded-xl bg-blue-700 px-5 py-3 font-bold text-white disabled:opacity-50"
        >
          {ready
            ? 'Access My Funds'
            : status.accountId
              ? 'Continue Payout Setup'
              : 'Add Debit Card or Bank'}
        </button>
      </div>
    </section>
  );
}
