'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CAPABILITY_CATALOG, type CapabilityCategory, type PlatformCapability } from '@/lib/platform/capability-catalog';
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

const familyMeta: Record<StoreFamily, { label: string; description: string; categories: CapabilityCategory[] }> = {
  business: {
    label: 'Business Platform',
    description: 'Website, CRM, communications, AI assistants and focused business apps.',
    categories: ['business', 'ai', 'apps'],
  },
  learning: {
    label: 'Education & Workforce',
    description: 'Course creation, learner operations, workforce, apprenticeship, employers and testing.',
    categories: ['education', 'workforce'],
  },
  enterprise: {
    label: 'Enterprise & Governance',
    description: 'Managed compliance, orchestration and platform engineering capabilities.',
    categories: ['compliance', 'enterprise'],
  },
};

const CAPABILITY_IMAGES: Record<string, string> = {
  website_builder: '/images/pages/comp-layout-hero.webp', crm: '/images/pages/admin-campaigns-hero.webp', booking: '/images/pages/booking-page-1.webp',
  forms: '/images/pages/admin-applications-hero.webp', email_marketing: '/images/pages/admin-email-marketing-d2.webp', sms: '/images/pages/admin-live-chat-detail.webp',
  invoicing: '/images/pages/banking-page-1.webp', seo_autopilot: '/images/pages/admin-analytics-hero.webp', marketing_autopilot: '/images/pages/admin-email-campaigns-new-detail.webp',
  ai_paris: '/images/pages/ai-tutor-page-1.webp', ai_ellie: '/images/pages/adult-learner.webp', ai_lizzy: '/images/pages/admin-ai-studio-hero.webp',
  ai_zora: '/images/pages/admin-compliance-audit-hero.webp', ai_orchestrator: '/images/pages/admin-ai-console-hero.webp', course_builder: '/images/pages/comp-pathway-classroom.webp',
  course_factory: '/images/pages/admin-courses-partners-hero.webp', lms: '/images/heroes/lms-analytics.webp', student_management: '/images/pages/admin-applicants-detail.webp',
  testing_center: '/images/pages/competency-test-hero.webp', workforce: '/images/pages/admin-wioa-hero.webp', apprenticeship: '/images/pages/apprenticeship-structure.webp',
  employer_portal: '/images/pages/admin-employers-hero.webp', compliance: '/images/pages/compliance-page-1.webp', sam_gov_manager: '/images/pages/agencies-page-1.webp',
  grants_discovery: '/images/pages/admin-grants-workflow-detail.webp', dev_studio: '/images/pages/admin-dev-studio-detail.webp',
};

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
  if (capability.key === 'website_builder') return INDIVIDUAL_APP_CATALOG['website-builder'].plans[0]?.priceLabel ?? 'See plans';
  if (capability.key === 'sam_gov_manager') return INDIVIDUAL_APP_CATALOG['sam-gov'].plans[0]?.priceLabel ?? 'See plans';
  if (capability.key === 'grants_discovery') return INDIVIDUAL_APP_CATALOG.grants.plans[0]?.priceLabel ?? 'See plans';
  const addon = ADD_ON_MARKETPLACE.find((candidate) => !candidate.hiddenFromMarketplace && candidate.features.includes(capability.key));
  if (addon) return `$${addon.priceMonthly}/mo add-on`;
  const includedPlan = Object.values(BASE_PLANS).find((plan) => plan.features.includes(capability.key));
  if (includedPlan) return `Included from $${includedPlan.priceMonthly}/mo`;
  return publicAvailability(capability) === 'enterprise' ? 'Custom pricing' : 'See plans for availability';
}

function primaryAction(capability: PlatformCapability): { href: string; label: string } {
  if (publicAvailability(capability) === 'enterprise') {
    return { href: `/contact?subject=${encodeURIComponent(`${capability.name} Enterprise`)}`, label: 'Contact Sales' };
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
      .filter((capability) => family === 'all' || familyMeta[family].categories.includes(capability.category))
      .filter((capability) => !needle || [capability.name, capability.description, ...capability.keywords].join(' ').toLowerCase().includes(needle));
  }, [query, family]);

  return (
    <section className="border-y border-cyan-100 bg-gradient-to-b from-white via-cyan-50/50 to-rose-50 py-16 font-medium text-slate-950" id="marketplace">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">One platform. Three clear buying paths.</p>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">Choose the part of Elevate you need now</h2>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-700 sm:text-lg">Choose a product, see the live demo, understand the monthly price and start with the smallest plan that solves your problem. Every product stays connected as your business grows.</p>
        </div>

        <div className="mx-auto mt-8 grid max-w-5xl gap-3 md:grid-cols-3">
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
                <span className={`mt-2 block text-sm leading-6 ${selected ? 'text-slate-600' : 'text-slate-600'}`}>{familyMeta[key].description}</span>
              </button>
            );
          })}
        </div>

        <div className="mx-auto mt-7 grid max-w-5xl gap-3 sm:grid-cols-[1fr_auto]">
          <label className="block"><span className="sr-only">Search platform capabilities</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search website builder, CRM, PARIS, testing, apprenticeship..." className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-base font-bold text-slate-950 outline-none ring-brand-red-500 placeholder:text-slate-600 focus:ring-2" /></label>
          <button type="button" aria-pressed={family === 'all'} onClick={() => setFamily('all')} className={`rounded-xl px-5 py-3 text-sm font-black ${family === 'all' ? 'bg-brand-red-600 text-white' : 'border border-slate-300 bg-white/10 text-white hover:bg-white/20'}`}>View All</button>
        </div>

        {family !== 'all' ? (
          <div className="mx-auto mt-6 max-w-5xl rounded-xl border border-cyan-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
            Showing {familyMeta[family].label}. Use search or View All when you already know the capability you need.
          </div>
        ) : null}

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((capability) => {
            const isUnifiedLearningPlatform = capability.key === 'course_builder';
            const capabilityName = isUnifiedLearningPlatform ? 'Course Creation & Learning Platform' : capability.name;
            const capabilityDescription = isUnifiedLearningPlatform
              ? 'Build course structures, generate evidence-grounded lessons and assessments with AI, create instructor-led media, publish to the learner LMS, issue certificates and track student progress from one connected system.'
              : capability.description;
            const image = CAPABILITY_IMAGES[String(capability.key)];
            const availability = publicAvailability(capability);
            const action = primaryAction(capability);
            return (
              <article key={capability.key} className="flex min-h-[390px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100">{image ? <Image src={image} alt={`${capabilityName} platform capability`} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-500 hover:scale-105" placeholder="empty" unoptimized /> : <div className="flex h-full items-center justify-center bg-gradient-to-br from-cyan-100 to-rose-100 p-8 text-center"><span className="text-2xl font-black text-slate-950">{capabilityName}</span></div>}</div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4"><span className="text-xs font-black uppercase tracking-wide text-rose-700">{categoryMeta[capability.category].label}</span><span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-900">{availabilityLabel(availability)}</span></div>
                  <h3 className="mt-4 text-xl font-black text-slate-950">{capabilityName}</h3>
                  <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-slate-700">{capabilityDescription}</p>
                  <p className="mt-4 text-sm font-black text-slate-950">{priceFor(capability)}</p>
                  {availability === 'beta' ? <p className="mt-2 text-xs font-semibold text-amber-200">Beta availability may change while the capability is being finalized.</p> : null}
                  <div className="mt-5 flex flex-wrap gap-2"><Link href={action.href} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-brand-red-500">{action.label}</Link><Link href={`/store/demo/capability/${String(capability.key)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-black text-slate-950 hover:bg-white/20">Watch Live Demo</Link></div>
                </div>
              </article>
            );
          })}
        </div>
        {items.length === 0 ? <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-8 text-center font-semibold text-slate-700">No matching capability in this buying path. Try View All or a broader search.</div> : null}
        <div className="mt-12 grid gap-4 rounded-3xl border border-orange-200 bg-white p-7 shadow-lg md:grid-cols-[1fr_auto] md:items-center"><div><h3 className="text-2xl font-black text-slate-950">Not sure what to choose?</h3><p className="mt-2 font-semibold text-slate-700">Use guided setup or start the 14-day trial. Your workspace can preserve the capabilities selected during onboarding.</p></div><div className="flex flex-wrap gap-3"><Link href="#guided-setup" className="rounded-xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-50">Use Guided Setup</Link><Link href="/store/trial" className="rounded-xl bg-brand-red-700 px-5 py-3 font-black text-white hover:bg-brand-red-800">Start Free Trial</Link></div></div>
      </div>
    </section>
  );
}
