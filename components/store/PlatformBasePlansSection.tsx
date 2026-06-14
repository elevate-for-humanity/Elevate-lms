'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Loader2, ShoppingCart, Building2, CreditCard } from 'lucide-react';
import {
  BASE_PLANS,
  type BasePlanId,
  type BillingInterval,
} from '@/lib/store/platform-pricing';
import { BNPL_CHECKOUT_LABEL } from '@/lib/bnpl-config';

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
  const [interval, setInterval] = useState<BillingInterval>('monthly');
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
        body: JSON.stringify({
          planId,
          interval,
          addonSlugs: selectedAddonSlugs,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent('/store/plans')}`;
          return;
        }
        throw new Error(data.error || 'Checkout failed');
      }
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }
      throw new Error('No checkout URL returned');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start checkout');
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section className="py-16 px-4 bg-white" id="base-plans">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">{headline}</h2>
        <p className="text-slate-600 text-center mb-8 max-w-2xl mx-auto">{subheadline}</p>

        <div className="flex justify-center mb-10">
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50">
            <button
              type="button"
              onClick={() => setInterval('monthly')}
              className={`px-5 py-2 rounded-md text-sm font-semibold ${
                interval === 'monthly' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setInterval('annual')}
              className={`px-5 py-2 rounded-md text-sm font-semibold ${
                interval === 'annual' ? 'bg-white shadow text-slate-900' : 'text-slate-600'
              }`}
            >
              Annual <span className="text-brand-green-600 text-xs ml-1">save ~17%</span>
            </button>
          </div>
        </div>

        {error && (
          <p className="mb-6 text-center text-sm text-brand-red-600 bg-brand-red-50 border border-brand-red-200 rounded-lg py-2 px-4 max-w-lg mx-auto">
            {error}
          </p>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const popular = plan.popular;
            const price = interval === 'annual' ? plan.priceAnnual : plan.priceMonthly;
            const priceLabel = interval === 'annual' ? '/yr' : '/mo';
            const monthlyEquivalent = interval === 'annual' ? Math.round(price / 12) : price;
            return (
              <div
                key={plan.id}
                className={`rounded-2xl p-8 flex flex-col ${
                  popular
                    ? 'bg-brand-blue-600 text-white ring-4 ring-brand-blue-300 shadow-xl'
                    : 'bg-slate-50 border border-slate-200'
                }`}
              >
                {popular && (
                  <span className="self-start bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    MOST POPULAR
                  </span>
                )}
                <h3 className={`text-2xl font-bold ${popular ? 'text-white' : 'text-slate-900'}`}>
                  {plan.name}
                </h3>
                <div className="mt-4 mb-2">
                  <span className="text-4xl font-bold">${price}</span>
                  <span className={popular ? 'text-brand-blue-100' : 'text-slate-600'}>
                    {priceLabel}
                  </span>
                </div>
                {interval === 'annual' && (
                  <p className={`text-sm mb-4 ${popular ? 'text-brand-blue-100' : 'text-slate-500'}`}>
                    ${monthlyEquivalent}/mo equivalent
                  </p>
                )}
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.featureBullets.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check
                        className={`w-5 h-5 flex-shrink-0 ${popular ? 'text-white' : 'text-brand-green-600'}`}
                      />
                      <span className={popular ? 'text-white' : 'text-slate-700'}>{f}</span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={loadingPlan !== null}
                  onClick={() => subscribe(plan.id)}
                  className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 disabled:opacity-60 ${
                    popular
                      ? 'bg-white text-brand-blue-700 hover:bg-brand-blue-50'
                      : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'
                  }`}
                >
                  {loadingPlan === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="w-4 h-4" />
                  )}
                  Subscribe
                </button>
                <div className={`mt-3 p-3 rounded-lg ${popular ? 'bg-white/10' : 'bg-slate-100'}`}>
                  <div className={`flex items-center gap-2 text-xs ${popular ? 'text-white' : 'text-slate-600'}`}>
                    <CreditCard className="w-4 h-4" />
                    <span>{BNPL_CHECKOUT_LABEL}</span>
                  </div>
                </div>
                <Link
                  href="/store/trial"
                  className={`block w-full text-center py-2.5 mt-2 rounded-lg text-sm font-semibold border ${
                    popular
                      ? 'border-white/40 text-white hover:bg-white/10'
                      : 'border-slate-300 text-slate-700 hover:bg-white'
                  }`}
                >
                  Or start 14-day org trial
                </Link>
              </div>
            );
          })}
        </div>

        {/* Enterprise Plan */}
        <div className="mt-12 p-8 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-red-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Enterprise</h3>
                <p className="text-slate-400">For large organizations with custom needs</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <p className="text-2xl font-bold text-white">Custom pricing</p>
              <p className="text-slate-400 text-sm">Volume discounts, dedicated support, custom integrations</p>
            </div>
            <Link
              href="/store/contact?type=enterprise"
              className="px-8 py-4 bg-brand-red-600 text-white rounded-lg font-bold hover:bg-brand-red-700 transition whitespace-nowrap"
            >
              Contact Sales
            </Link>
          </div>
        </div>

        {selectedAddonSlugs.length > 0 && (
          <p className="text-center text-xs text-slate-500 mt-6">
            Checkout includes selected add-ons: {selectedAddonSlugs.join(', ')}
          </p>
        )}
      </div>
    </section>
  );
}
