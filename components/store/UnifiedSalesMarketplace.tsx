'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { CAPABILITY_CATALOG, type CapabilityCategory, type PlatformCapability } from '@/lib/platform/capability-catalog';
import { BASE_PLANS, ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

const categoryMeta: Record<CapabilityCategory, { label: string }> = {
  business: { label: 'Business Growth' }, ai: { label: 'AI Team' }, education: { label: 'Education' },
  workforce: { label: 'Workforce' }, compliance: { label: 'Compliance' }, apps: { label: 'Business Apps' }, enterprise: { label: 'Enterprise' },
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
  const [category, setCategory] = useState<'all' | CapabilityCategory>('all');
  const items = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return CAPABILITY_CATALOG.filter((capability) => capability.status !== 'internal')
      .filter((capability) => capability.key !== 'course_factory' && capability.key !== 'lms')
      .filter((capability) => category === 'all' || capability.category === category)
      .filter((capability) => !needle || [capability.name, capability.description, ...capability.keywords].join(' ').toLowerCase().includes(needle));
  }, [query, category]);

  return (
    <section className="bg-slate-950 py-16 font-medium text-white" id="marketplace">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-300">Start basic. Add capabilities as your business grows.</p>
          <h2 className="mt-5 text-3xl font-black tracking-tight text-white sm:text-5xl">Build your Elevate business stack</h2>
          <p className="mt-4 text-base font-semibold leading-7 text-slate-100 sm:text-lg">Search the platform, see how each capability works, understand its commercial path, and add only what your organization needs.</p>
        </div>
        <div className="mx-auto mt-8 max-w-3xl"><label className="block"><span className="sr-only">Search platform capabilities</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search website builder, CRM, PARIS, testing, apprenticeship..." className="w-full rounded-2xl border border-white/30 bg-white px-5 py-4 text-base font-bold text-slate-950 outline-none ring-brand-red-500 placeholder:text-slate-600 focus:ring-2" /></label></div>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button type="button" aria-pressed={category === 'all'} onClick={() => setCategory('all')} className={`rounded-full px-4 py-2 text-sm font-black ${category === 'all' ? 'bg-brand-red-600 text-white' : 'bg-white/15 text-white hover:bg-white/25'}`}>All</button>
          {(Object.keys(categoryMeta) as CapabilityCategory[]).map((key) => <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(key)} className={`rounded-full px-4 py-2 text-sm font-black ${category === key ? 'bg-brand-red-600 text-white' : 'bg-white/15 text-white hover:bg-white/25'}`}>{categoryMeta[key].label}</button>)}
        </div>

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
              <article key={capability.key} className="flex min-h-[390px] flex-col overflow-hidden rounded-2xl border border-white/20 bg-slate-900 shadow-lg">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">{image ? <Image src={image} alt={`${capabilityName} platform capability`} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover" placeholder="empty" /> : <div className="flex h-full items-center justify-center bg-slate-800 p-8 text-center"><span className="text-2xl font-black text-white">{capabilityName}</span></div>}</div>
                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4"><span className="text-xs font-black uppercase tracking-wide text-slate-100">{categoryMeta[capability.category].label}</span><span className="rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-black uppercase tracking-wide text-white">{availabilityLabel(availability)}</span></div>
                  <h3 className="mt-4 text-xl font-black text-white">{capabilityName}</h3>
                  <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-slate-100">{capabilityDescription}</p>
                  <p className="mt-4 text-sm font-black text-white">{priceFor(capability)}</p>
                  {availability === 'beta' ? <p className="mt-2 text-xs font-semibold text-amber-200">Beta availability may change while the capability is being finalized.</p> : null}
                  <div className="mt-5 flex flex-wrap gap-2"><Link href={action.href} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-red-500">{action.label}</Link><Link href={`/store/demo/capability/${String(capability.key)}`} className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-black text-white hover:bg-white/20">See How It Works</Link></div>
                </div>
              </article>
            );
          })}
        </div>
        {items.length === 0 ? <div className="mt-10 rounded-2xl border border-white/20 bg-white/10 p-8 text-center font-semibold text-slate-100">No matching capability. Try a broader search.</div> : null}
        <div className="mt-12 grid gap-4 rounded-3xl border border-brand-red-500/40 bg-slate-900 p-7 md:grid-cols-[1fr_auto] md:items-center"><div><h3 className="text-2xl font-black text-white">Not sure what to choose?</h3><p className="mt-2 font-semibold text-slate-100">Use guided setup or start the 14-day trial. Your workspace can preserve the capabilities selected during onboarding.</p></div><div className="flex flex-wrap gap-3"><Link href="#guided-setup" className="rounded-xl border border-white/40 px-5 py-3 font-black text-white hover:bg-white/10">Use Guided Setup</Link><Link href="/store/trial" className="rounded-xl bg-white px-5 py-3 font-black text-slate-950 hover:bg-slate-100">Start Free Trial</Link></div></div>
      </div>
    </section>
  );
}
