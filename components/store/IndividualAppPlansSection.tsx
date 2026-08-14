'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Clock, Code2, Loader2, ShoppingCart, Sparkles } from 'lucide-react';
import type { IndividualAppCatalog } from '@/lib/apps/individual-app-plans';

interface Props {
  catalog: IndividualAppCatalog;
}

export function IndividualAppPlansSection({ catalog }: Props) {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const subscribe = async (planId: string) => {
    setError(null);
    setLoadingPlan(planId);
    try {
      const res = await fetch('/api/apps/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appSlug: catalog.slug, plan: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(`/store/apps/${catalog.slug}`)}`;
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
    <section className="bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full bg-brand-blue-100 px-4 py-2 text-sm font-bold text-brand-blue-800">
            <Clock className="h-4 w-4" /> {catalog.trialDays}-day free trial — individual account
          </span>
        </div>
        <h2 className="mb-2 text-center text-3xl font-bold text-slate-900">Choose how much control you need</h2>
        <p className="mx-auto mb-6 max-w-3xl text-center text-slate-600">Every plan starts with the zero-code guided experience. Higher tiers add capacity and advanced controls; customers should not need developer tools just to get started.</p>
        <div className="mx-auto mb-10 grid max-w-4xl gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-2 font-black text-emerald-900"><Sparkles className="h-5 w-5"/>Simple Mode — default</div><p className="mt-2 text-sm leading-6 text-emerald-900/80">Plain-English setup, AI guidance, visual controls and recommended next steps. No code required.</p></div>
          <div className="rounded-2xl border border-slate-300 bg-white p-5"><div className="flex items-center gap-2 font-black text-slate-900"><Code2 className="h-5 w-5"/>Advanced Mode — higher tiers</div><p className="mt-2 text-sm leading-6 text-slate-600">Custom domains, API access, white-label, multi-user controls, advanced integrations and other power-user features appear only when the plan includes them.</p></div>
        </div>

        <p className="mb-10 text-center">
          <Link href={catalog.trialHref} className="font-semibold text-brand-blue-600 hover:underline">Start free trial (no card)</Link>
          {catalog.importHref ? <>{' '}·{' '}<Link href={catalog.importHref} className="font-semibold text-brand-blue-600 hover:underline">Import an existing website</Link></> : null}
        </p>

        {error && <p className="mx-auto mb-6 max-w-lg rounded-lg border border-brand-red-200 bg-brand-red-50 px-4 py-2 text-center text-sm text-brand-red-600">{error}</p>}

        <div className="grid gap-8 md:grid-cols-3">
          {catalog.plans.map((plan) => {
            const popular = plan.popular;
            const tierMessage = plan.id === 'starter'
              ? 'Best for getting started with the guided, zero-code workflow.'
              : plan.id === 'professional'
                ? 'Adds business-ready capabilities and removes common Starter limits.'
                : 'Adds advanced controls, scale, API/white-label capabilities where supported.';
            return (
              <div key={plan.id} className={`flex flex-col rounded-2xl p-8 ${popular ? 'bg-brand-blue-600 text-white shadow-xl ring-4 ring-brand-blue-300' : 'border border-slate-200 bg-white'}`}>
                {popular && <span className="mb-3 self-start rounded-full bg-brand-red-600 px-3 py-1 text-xs font-bold text-white">MOST POPULAR</span>}
                <h3 className={`text-2xl font-bold ${popular ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                <p className={`mt-2 text-sm leading-6 ${popular ? 'text-brand-blue-100' : 'text-slate-500'}`}>{tierMessage}</p>
                <div className="mb-6 mt-4"><span className="text-4xl font-bold">${plan.priceMonthly}</span><span className={popular ? 'text-brand-blue-100' : 'text-slate-600'}>/mo</span></div>
                <ul className="mb-8 flex-1 space-y-3">{plan.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><Check className={`h-5 w-5 flex-shrink-0 ${popular ? 'text-white' : 'text-brand-green-600'}`} /><span className={popular ? 'text-white' : 'text-slate-700'}>{f}</span></li>)}</ul>
                <div className="space-y-2">
                  <button type="button" disabled={loadingPlan !== null} onClick={() => subscribe(plan.id)} className={`flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold transition-colors disabled:opacity-60 ${popular ? 'bg-white text-brand-blue-700 hover:bg-brand-blue-50' : 'bg-brand-blue-600 text-white hover:bg-brand-blue-700'}`}>
                    {loadingPlan === plan.id ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-4 w-4" />} Subscribe — {plan.priceLabel}
                  </button>
                  <Link href={catalog.trialHref} className={`block w-full rounded-lg border py-2.5 text-center text-sm font-semibold ${popular ? 'border-white/40 text-white hover:bg-white/10' : 'border-slate-300 text-slate-700 hover:bg-slate-50'}`}>Try free for {catalog.trialDays} days</Link>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 text-center text-sm leading-6 text-slate-600">
          Elevate should recommend an upgrade only when the customer reaches a real plan limit or requests a gated capability. Example: “Custom domains are included in Professional. Upgrade to connect your own domain.”
        </div>

        <p className="mx-auto mt-8 max-w-xl text-center text-xs text-slate-500">Individual subscriptions are tied to your login — not an organization license. Need a team or WIOA provider site? <Link href="/store/trial" className="text-brand-blue-600 hover:underline">Managed platform trial</Link>.</p>
      </div>
    </section>
  );
}
