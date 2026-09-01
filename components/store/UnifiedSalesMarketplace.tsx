'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CAPABILITY_CATALOG,
  type CapabilityCategory,
  type PlatformCapability,
} from '@/lib/platform/capability-catalog';
import { BASE_PLANS, ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

const categoryMeta: Record<CapabilityCategory, { label: string }> = {
  business: { label: 'Business' },
  ai: { label: 'AI Team' },
  education: { label: 'Education' },
  workforce: { label: 'Workforce' },
  compliance: { label: 'Compliance' },
  apps: { label: 'Business Apps' },
  enterprise: { label: 'Enterprise' },
};

type StoreFamily = 'business' | 'learning' | 'enterprise';

const familyMeta: Record<
  StoreFamily,
  { label: string; description: string; categories: CapabilityCategory[] }
> = {
  business: {
    label: 'Business Platform',
    description: 'Website, CRM, communications, AI assistants and focused business apps.',
    categories: ['business', 'ai', 'apps'],
  },
  learning: {
    label: 'Education & Workforce',
    description:
      'Course creation, learner operations, workforce, apprenticeship, employers and testing.',
    categories: ['education', 'workforce'],
  },
  enterprise: {
    label: 'Enterprise & Governance',
    description: 'Managed compliance, orchestration and platform engineering capabilities.',
    categories: ['compliance', 'enterprise'],
  },
};

const previewStyles: Record<CapabilityCategory, string> = {
  business: 'from-cyan-500 via-sky-600 to-indigo-700',
  ai: 'from-fuchsia-500 via-rose-500 to-orange-500',
  education: 'from-emerald-500 via-teal-600 to-cyan-700',
  workforce: 'from-amber-500 via-orange-600 to-rose-600',
  compliance: 'from-violet-600 via-indigo-700 to-slate-800',
  apps: 'from-blue-500 via-cyan-600 to-teal-700',
  enterprise: 'from-slate-600 via-slate-800 to-slate-950',
};

function interactiveDemoHref(capability: PlatformCapability): string | null {
  if (capability.key === 'website_builder') return '/store/demo/website';
  return null;
}

function ProductPreview({ capability, name }: { capability: PlatformCapability; name: string }) {
  const cues = capability.keywords.filter((word) => word.length > 2).slice(0, 3);
  const isInteractive = Boolean(interactiveDemoHref(capability));
  return (
    <div
      className={`group relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br ${previewStyles[capability.category]} p-5 text-white`}
    >
      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/15 blur-2xl transition duration-700 group-hover:scale-150" />
      <div className="absolute -bottom-14 -left-10 h-32 w-32 rounded-full bg-black/15 blur-2xl transition duration-700 group-hover:scale-150" />
      <div className="relative flex h-full flex-col rounded-2xl border border-white/25 bg-white/10 p-4 shadow-2xl backdrop-blur-sm transition duration-500 group-hover:-translate-y-1 group-hover:bg-white/15">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.16em]">
          <span>{categoryMeta[capability.category].label}</span>
          <span className="rounded-full bg-emerald-300 px-2 py-1 text-emerald-950">
            {isInteractive ? 'Interactive demo' : 'Guided tour'}
          </span>
        </div>
        <p className="mt-3 line-clamp-2 text-xl font-black leading-tight">{name}</p>
        <div className="mt-auto grid grid-cols-3 gap-2">
          {cues.map((cue, index) => (
            <div
              key={cue}
              className="rounded-lg border border-white/20 bg-white/15 p-2 transition duration-300 group-hover:-translate-y-0.5"
              style={{ transitionDelay: `${index * 70}ms` }}
            >
              <span className="block h-1.5 w-8 rounded-full bg-white/80" />
              <span className="mt-2 block truncate text-[10px] font-bold capitalize text-white/90">
                {cue.replaceAll('_', ' ')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type PublicAvailability = 'live' | 'beta' | 'enterprise';

function publicAvailability(capability: PlatformCapability): PublicAvailability {
  if (capability.status === 'enterprise') return 'enterprise';
  if (capability.status === 'repair') return 'beta';
  return 'live';
}

function availabilityLabel(value: PublicAvailability): string {
  if (value === 'enterprise') return 'Enterprise';
  if (value === 'beta') return 'Beta';
  return 'Available';
}

function priceFor(capability: PlatformCapability): string {
  if (capability.key === 'website_builder')
    return INDIVIDUAL_APP_CATALOG['website-builder'].plans[0]?.priceLabel ?? 'See plans';
  if (capability.key === 'sam_gov_manager')
    return INDIVIDUAL_APP_CATALOG['sam-gov'].plans[0]?.priceLabel ?? 'See plans';
  if (capability.key === 'grants_discovery')
    return INDIVIDUAL_APP_CATALOG.grants.plans[0]?.priceLabel ?? 'See plans';
  const addon = ADD_ON_MARKETPLACE.find(
    (candidate) => !candidate.hiddenFromMarketplace && candidate.features.includes(capability.key),
  );
  if (addon) return `$${addon.priceMonthly}/mo add-on`;
  const includedPlan = Object.values(BASE_PLANS).find((plan) =>
    plan.features.includes(capability.key),
  );
  if (includedPlan) return `Included from $${includedPlan.priceMonthly}/mo`;
  return publicAvailability(capability) === 'enterprise'
    ? 'Custom pricing'
    : 'See plans for availability';
}

function primaryAction(capability: PlatformCapability): { href: string; label: string } {
  if (publicAvailability(capability) === 'enterprise') {
    return {
      href: `/contact?subject=${encodeURIComponent(`${capability.name} Enterprise`)}`,
      label: 'Contact Sales',
    };
  }
  return {
    href: capability.storeHref || capability.marketingHref || capability.appHref || '/store/plans',
    label: 'Explore Product',
  };
}

export function UnifiedSalesMarketplace() {
  const [query, setQuery] = useState('');
  const [family, setFamily] = useState<'all' | StoreFamily>('business');

  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CAPABILITY_CATALOG.filter((capability) => capability.status !== 'internal')
      .filter((capability) => capability.key !== 'course_factory' && capability.key !== 'lms')
      .filter(
        (capability) =>
          family === 'all' || familyMeta[family].categories.includes(capability.category),
      )
      .filter(
        (capability) =>
          !needle ||
          [capability.name, capability.description, ...capability.keywords]
            .join(' ')
            .toLowerCase()
            .includes(needle),
      );
  }, [query, family]);

  return (
    <section
      className="border-y border-cyan-100 bg-gradient-to-b from-white via-cyan-50/50 to-rose-50 py-16 font-medium text-slate-950"
      id="marketplace"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">
            One platform. Three clear buying paths.
          </p>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
            Choose the part of Elevate you need now
          </h2>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-700 sm:text-lg">
            Choose a product, see the live demo, understand the monthly price and start with the
            smallest plan that solves your problem. Every product stays connected as your business
            grows.
          </p>
        </div>

        <div
          data-paris-tour="subscription-families"
          className="mx-auto mt-8 grid max-w-5xl gap-3 md:grid-cols-3"
        >
          {(Object.keys(familyMeta) as StoreFamily[]).map((key) => {
            const selected = family === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={selected}
                onClick={() => setFamily(key)}
                className={`rounded-2xl border p-5 text-left transition ${selected ? 'border-brand-red-400 bg-white text-slate-950 shadow-lg' : 'border-slate-200 bg-white text-slate-950 shadow-sm hover:border-orange-300 hover:shadow-md'}`}
              >
                <span className="block text-lg font-black">{familyMeta[key].label}</span>
                <span
                  className={`mt-2 block text-sm leading-6 ${selected ? 'text-slate-600' : 'text-slate-600'}`}
                >
                  {familyMeta[key].description}
                </span>
              </button>
            );
          })}
        </div>

        <div
          data-paris-tour="product-search"
          className="mx-auto mt-7 grid max-w-5xl gap-3 sm:grid-cols-[1fr_auto]"
        >
          <label className="block">
            <span className="sr-only">Search platform capabilities</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search website builder, CRM, PARIS, testing, apprenticeship..."
              className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-base font-bold text-slate-950 outline-none ring-brand-red-500 placeholder:text-slate-600 focus:ring-2"
            />
          </label>
          <button
            type="button"
            aria-pressed={family === 'all'}
            onClick={() => setFamily('all')}
            className={`rounded-xl px-5 py-3 text-sm font-black ${family === 'all' ? 'bg-brand-red-600 text-white' : 'border border-slate-300 bg-white/10 text-white hover:bg-white/20'}`}
          >
            View All
          </button>
        </div>

        {family !== 'all' ? (
          <div className="mx-auto mt-6 max-w-5xl rounded-xl border border-cyan-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            Showing {familyMeta[family].label}. Use search or View All when you already know the
            capability you need.
          </div>
        ) : null}

        <div
          data-paris-tour="product-cards"
          className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3"
        >
          {items.map((capability) => {
            const isUnifiedLearningPlatform = capability.key === 'course_builder';
            const capabilityName = isUnifiedLearningPlatform
              ? 'Course Creation & Learning Platform'
              : capability.name;
            const capabilityDescription = isUnifiedLearningPlatform
              ? 'Build course structures, generate evidence-grounded lessons and assessments with AI, create instructor-led media, publish to the learner LMS, issue certificates and track student progress from one connected system.'
              : capability.description;
            const availability = publicAvailability(capability);
            const action = primaryAction(capability);
            return (
              <article
                key={capability.key}
                className="flex min-h-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5"
              >
                <ProductPreview capability={capability} name={capabilityName} />
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-black uppercase tracking-wide text-rose-700">
                      {categoryMeta[capability.category].label}
                    </span>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-900">
                      {availabilityLabel(availability)}
                    </span>
                  </div>
                  <h3 className="mt-4 text-xl font-black text-slate-950">{capabilityName}</h3>
                  <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-slate-700">
                    {capabilityDescription}
                  </p>
                  <p className="mt-4 text-sm font-black text-slate-950">{priceFor(capability)}</p>
                  {availability === 'beta' ? (
                    <p className="mt-2 text-xs font-semibold text-amber-200">
                      Beta availability may change while the capability is being finalized.
                    </p>
                  ) : null}
                  <div data-paris-tour="product-actions" className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={action.href}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-brand-red-500"
                    >
                      {action.label}
                    </Link>
                    <Link
                      href={
                        interactiveDemoHref(capability) ||
                        `/store/demo/capability/${String(capability.key)}`
                      }
                      className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-950 hover:border-brand-red-400 hover:bg-slate-50"
                    >
                      {interactiveDemoHref(capability) ? 'Open Live Demo' : 'View Guided Tour'}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center font-semibold text-slate-700">
            No matching capability in this buying path. Try View All or a broader search.
          </div>
        ) : null}
        <div
          data-paris-tour="start-plan"
          className="mt-12 grid gap-4 rounded-3xl border border-orange-200 bg-white p-7 shadow-lg md:grid-cols-[1fr_auto] md:items-center"
        >
          <div>
            <h3 className="text-2xl font-black text-slate-950">Not sure what to choose?</h3>
            <p className="mt-2 font-semibold text-slate-700">
              Use guided setup or start the 14-day trial. Your workspace can preserve the
              capabilities selected during onboarding.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="#guided-setup"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-50"
            >
              Use Guided Setup
            </Link>
            <Link
              href="/store/trial"
              className="rounded-xl bg-brand-red-700 px-5 py-3 font-black text-white hover:bg-brand-red-800"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
