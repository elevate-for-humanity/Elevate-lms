'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  Sparkles,
  ArrowRight,
  PlayCircle,
  Building2,
  GraduationCap,
  Bot,
  BriefcaseBusiness,
  ShieldCheck,
  AppWindow,
  Wrench,
} from 'lucide-react';
import {
  CAPABILITY_CATALOG,
  type CapabilityCategory,
  type PlatformCapability,
} from '@/lib/platform/capability-catalog';
import { BASE_PLANS, ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

const categoryMeta: Record<CapabilityCategory, { label: string; icon: typeof Bot }> = {
  business: { label: 'Business Growth', icon: BriefcaseBusiness },
  ai: { label: 'AI Team', icon: Bot },
  education: { label: 'Education', icon: GraduationCap },
  workforce: { label: 'Workforce', icon: Building2 },
  compliance: { label: 'Compliance', icon: ShieldCheck },
  apps: { label: 'Business Apps', icon: AppWindow },
  enterprise: { label: 'Enterprise', icon: Wrench },
};

function priceFor(capability: PlatformCapability): string | null {
  if (capability.key === 'website_builder') {
    return INDIVIDUAL_APP_CATALOG['website-builder'].plans[0]?.priceLabel ?? null;
  }
  if (capability.key === 'sam_gov_manager') {
    return INDIVIDUAL_APP_CATALOG['sam-gov'].plans[0]?.priceLabel ?? null;
  }
  if (capability.key === 'grants_discovery') {
    return INDIVIDUAL_APP_CATALOG.grants.plans[0]?.priceLabel ?? null;
  }

  const addon = ADD_ON_MARKETPLACE.find((candidate) => candidate.features.includes(capability.key));
  if (addon) return `$${addon.priceMonthly}/mo add-on`;

  const includedPlan = Object.values(BASE_PLANS).find((plan) => plan.features.includes(capability.key));
  if (includedPlan) return `Included from $${includedPlan.priceMonthly}/mo`;
  return null;
}

function primaryHref(capability: PlatformCapability): string {
  return capability.storeHref || capability.marketingHref || capability.demoHref || '/store/plans';
}

export function UnifiedSalesMarketplace() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<'all' | CapabilityCategory>('all');

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CAPABILITY_CATALOG.filter((capability) => capability.status !== 'internal')
      .filter((capability) => category === 'all' || capability.category === category)
      .filter((capability) => {
        if (!needle) return true;
        return [capability.name, capability.description, ...capability.keywords]
          .join(' ')
          .toLowerCase()
          .includes(needle);
      });
  }, [query, category]);

  return (
    <section className="bg-slate-950 py-16 text-white" id="marketplace">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-bold text-slate-200">
            <Sparkles className="h-4 w-4" /> Start basic. Add capabilities as your business grows.
          </span>
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Build your Elevate business stack</h2>
          <p className="mt-4 text-base leading-7 text-slate-300 sm:text-lg">
            Search the platform, try products, start a trial, and add specialized AI, education,
            workforce and business tools without buying a second system.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search website builder, CRM, PARIS, testing, apprenticeship..."
              className="w-full rounded-2xl border border-white/15 bg-white px-12 py-4 text-base font-medium text-slate-950 outline-none ring-brand-red-500 focus:ring-2"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`rounded-full px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-brand-red-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}
          >
            All
          </button>
          {(Object.keys(categoryMeta) as CapabilityCategory[]).map((key) => {
            const meta = categoryMeta[key];
            const Icon = meta.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategory(key)}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${category === key ? 'bg-brand-red-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}
              >
                <Icon className="h-4 w-4" /> {meta.label}
              </button>
            );
          })}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((capability) => {
            const meta = categoryMeta[capability.category];
            const Icon = meta.icon;
            const price = priceFor(capability);
            return (
              <article key={capability.key} className="flex min-h-[300px] flex-col rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-lg">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
                    <Icon className="h-5 w-5 text-brand-red-300" />
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-300">
                    {capability.status === 'enterprise' ? 'Enterprise' : capability.status === 'repair' ? 'Preview' : 'Available'}
                  </span>
                </div>

                <h3 className="mt-5 text-xl font-black">{capability.name}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-300">{capability.description}</p>
                {price ? <p className="mt-4 text-sm font-black text-white">{price}</p> : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link
                    href={primaryHref(capability)}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-red-500"
                  >
                    {capability.status === 'enterprise' ? 'Explore' : 'View / Start'} <ArrowRight className="h-4 w-4" />
                  </Link>
                  {capability.demoHref ? (
                    <Link
                      href={capability.demoHref}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
                    >
                      <PlayCircle className="h-4 w-4" /> Demo
                    </Link>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-300">
            No matching capability. Try a broader search.
          </div>
        ) : null}

        <div className="mt-12 grid gap-4 rounded-3xl border border-brand-red-500/30 bg-gradient-to-r from-brand-red-950/70 to-slate-900 p-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h3 className="text-2xl font-black">Not sure what to choose?</h3>
            <p className="mt-2 text-slate-300">Start with the 14-day trial. Your platform can recommend upgrades based on the tools you actually use.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/store/trial" className="rounded-xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100">Start Free Trial</Link>
            <Link href="/store/plans" className="rounded-xl border border-white/25 px-5 py-3 font-black text-white hover:bg-white/10">Compare Plans</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
