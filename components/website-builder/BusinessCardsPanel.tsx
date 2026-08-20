'use client';

import { useEffect, useState } from 'react';
import { CreditCard, ShieldCheck, WalletCards } from 'lucide-react';

type PaymentState = {
  configured?: boolean;
  connected?: boolean;
  status?: string;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
};

export function BusinessCardsPanel({ websiteId }: { websiteId: string }) {
  const [payments, setPayments] = useState<PaymentState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    void fetch(`/api/platform/payments/connect?websiteId=${encodeURIComponent(websiteId)}`)
      .then(async (response) => {
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'Could not check payment readiness');
        setPayments(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not check payment readiness'));
  }, [websiteId]);

  async function connectPayments() {
    setBusy(true);
    setError('');
    try {
      const response = await fetch(`/api/platform/payments/connect?websiteId=${encodeURIComponent(websiteId)}`, { method: 'POST' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Could not start Stripe onboarding');
      if (data.url) window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start Stripe onboarding');
      setBusy(false);
    }
  }

  const paymentsReady = Boolean(payments?.connected && payments?.chargesEnabled && payments?.payoutsEnabled);

  return (
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="mb-2 flex items-center gap-2 text-slate-900">
                <WalletCards className="h-5 w-5" />
                <h2 className="text-lg font-black">Payments & business cards</h2>
              </div>
              <p className="text-sm leading-6 text-slate-600">
                Connect this website's own Stripe business account to accept customer payments. Commercial virtual and physical cards are being prepared as an optional Stripe Issuing capability and remain disabled until the platform and business are approved for live Issuing.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700">
              <ShieldCheck className="h-4 w-4" />
              {paymentsReady ? 'Payments ready' : payments?.connected ? `Stripe ${payments.status || 'onboarding'}` : 'Stripe not connected'}
            </div>
          </div>

          {error ? <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{error}</p> : null}

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="font-black text-slate-900">1. Connect payments</p>
              <p className="mt-1 text-sm text-slate-600">The seller completes Stripe identity, business and payout onboarding for this website.</p>
              {!paymentsReady ? (
                <button type="button" disabled={busy} onClick={() => void connectPayments()} className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">
                  {payments?.connected ? 'Continue Stripe setup' : 'Connect Stripe'}
                </button>
              ) : null}
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <CreditCard className="mb-2 h-5 w-5 text-slate-700" />
              <p className="font-black text-slate-900">2. Virtual cards</p>
              <p className="mt-1 text-sm text-slate-600">Planned commercial expense cards with cardholder and spending controls.</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-700">Approval required — not live</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <CreditCard className="mb-2 h-5 w-5 text-slate-700" />
              <p className="font-black text-slate-900">3. Physical cards</p>
              <p className="mt-1 text-sm text-slate-600">Planned physical commercial cards with shipping, limits, freeze controls and transaction history.</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-amber-700">Approval required — not live</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
