'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, Building2, CreditCard } from 'lucide-react';
import {
  BASE_PLANS,
  type BasePlanId,
  type BillingInterval,
} from '@/lib/store/platform-pricing';

interface Props {
  selectedAddonSlugs?: string[];
  headline?: string;
  subheadline?: string;
}

export function PlatformBasePlansSection({
  selectedAddonSlugs = [],
  headline = 'Base plans',
  subheadline = 'Start simple. Add workforce, LMS, and apprenticeship modules when you are ready.',
}: Props) {
  const [interval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = Object.values(BASE_PLANS);

  const subscribe = async (planId: BasePlanId) => {
    setError(null);
    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/store/platform-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, interval, addonSlugs: selectedAddonSlugs }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `https://app.elevateforhumanity.org/login?redirect=${encodeURIComponent('https://www.elevateforhumanity.org/store/plans')}`;
          return;
        }
        if (res.status === 409 && data.trialUrl) {
          window.location.href = data.trialUrl;
          return;
        }
        throw new Error(data.error || 'Checkout failed');
      }

      if (!data.checkoutUrl) throw new Error('No checkout URL returned');
      window.location.href = data.checkoutUrl;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="bg-white px-4 py-16" id="base-plans">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-2 text-center text-3xl font-bold text-slate-900">{headline}</h2>
        <p className="mx-auto mb-8 max-w-2xl text-center text-slate-600">{subheadline}</p>

        <div className="mb-10 flex justify-center">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            <button type="button" aria-pressed={interval === 'monthly'} onClick={() => setBillingInterval('monthly')} className={`rounded-md px-5 py-2 text-sm font-semibold ${interval === 'monthly' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}>Monthly</button>
            <button type="button" aria-pressed={interval === 'annual'} onClick={() => setBillingInterval('annual')} className={`rounded-md px-5 py-2 text-sm font-semibold ${interval === 'annual' ? 'bg-white text-slate-900 shadow' : 'text-slate-600'}`}>Annual <span className="ml-1 text-xs text-brand-green-600">save ~17%</span></button>
          </div>
        </div>

        {error && <p className="mx-auto mb-6 max-w-lg rounded-lg border border-brand-red-200 bg-brand-red-50 px-4 py-2 text-center text-sm text-brand-red-600">{error}</p>}

        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => {
            const popular = plan.popular;
            const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            const priceLabel = interval === 'annual' ? '/yr' : '/mo';
            const monthlyEquivalent = interval === 'annual' ? Math.round(price / 12) : price;
            return (
              <div key={plan.id} className={`flex flex-col rounded-2xl p-8 ${popular ? 'bg-brand-blue-600 text-white ring-4 ring-brand-blue-300 shadow-xl' : 'border border-slate-200 bg-slate-50'}`}>
                {popular && <span className="mb-3 self-start rounded-full bg-brand-red-600 px-3 py-1 text-xs font-bold text-white">MOST POPULAR</span>}
                <h3 className={`text-2xl font-bold ${popular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <div className="mb-2 mt-4"><span className="text-4xl font-bold">${price}</span><span className={popular ? 'text-brand-blue-100' : 'text-slate-600'}>{priceLabel}</span></div>
                {interval === 'annual' && <p className={`mb-4 text-sm ${popular ? 'text-brand-blue-100' : 'text-slate-500'}`}>${monthlyEquivalent}/mo equivalent</p>}
                <ul className="mb-6 flex-1 space-y-3">
                  {plan.featureBullets.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><Check className={`h-5 w-5 flex-shrink-0 ${popular ? 'text-white' : 'text-brand-green-600'}`} /><span className={popular ? 'text-white' : 'text-slate-700'}>{f}</span></li>)}
                </ul>
                <button type="button" disabled={loadingPlan !== null} onClick={() => subscribe(plan.id)} className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold disabled:opacity-60 ${popular ? 'bg-white text-brand-blue-700 hover:bg-brand-blue-50' : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'}`}>
                  {loadingPlan === plan.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                  {loadingPlan === plan.id ? 'Loading secure checkout…' : `Subscribe — $${price}${priceLabel}`}
                </button>
                <Link href="/store/trial" className={`mt-2 block w-full rounded-lg border py-2.5 text-center text-sm font-semibold ${popular ? 'border-white/40 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>14-day free trial — no card required</Link>
              </div>
            );
          })}
        </div>

        <div className="mt-12 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 p-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-4"><div className="flex h-16 w-16 items-center justify-center rounded-xl bg-brand-red-600"><Building2 className="h-8 w-8 text-white" /></div><div><h3 className="text-xl font-bold text-white">Enterprise</h3><p className="text-slate-400">For large organizations with custom requirements</p></div></div>
            <div className="text-center md:text-right"><p className="text-2xl font-bold text-white">Custom pricing</p><p className="text-sm text-slate-400">Volume pricing, onboarding, and integrations</p></div>
            <Link href="/contact?subject=Enterprise%20Platform" className="whitespace-nowrap rounded-lg bg-brand-red-600 px-8 py-4 font-bold text-white hover:bg-brand-red-700">Contact Sales</Link>
          </div>
        </div>

        {selectedAddonSlugs.length > 0 && <p className="mt-6 text-center text-xs text-slate-500">Secure checkout includes selected add-ons: {selectedAddonSlugs.join(', ')}</p>}
      </div>
    </section>
  );
}
