'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  CAPABILITY_CATALOG,
  type CapabilityCategory,
  type PlatformCapability,
} from '@/lib/platform/capability-catalog';
import { BASE_PLANS, ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing';
import { INDIVIDUAL_APP_CATALOG } from '@/lib/apps/individual-app-plans';

const categoryMeta: Record<CapabilityCategory, { label: string }> = {
  business: { label: 'Business Growth' },
  ai: { label: 'AI Team' },
  education: { label: 'Education' },
  workforce: { label: 'Workforce' },
  compliance: { label: 'Compliance' },
  apps: { label: 'Business Apps' },
  enterprise: { label: 'Enterprise' },
};

/**
 * Distinct, repository-verified imagery for every public capability card.
 * These are existing assets already shipped by Elevate; none are placeholders
 * and no image is reused within this marketplace mapping.
 */
const CAPABILITY_IMAGES: Record<string, string> = {
  website_builder: '/images/pages/comp-layout-hero.webp',
  crm: '/images/pages/admin-campaigns-hero.webp',
  booking: '/images/pages/booking-page-1.webp',
  forms: '/images/pages/admin-applications-hero.webp',
  email_marketing: '/images/pages/admin-email-marketing-d2.webp',
  sms: '/images/pages/admin-live-chat-detail.webp',
  invoicing: '/images/pages/banking-page-1.webp',
  seo_autopilot: '/images/pages/admin-analytics-hero.webp',
  marketing_autopilot: '/images/pages/admin-email-campaigns-new-detail.webp',
  ai_paris: '/images/pages/ai-tutor-page-1.webp',
  ai_ellie: '/images/pages/adult-learner.webp',
  ai_lizzy: '/images/pages/admin-ai-studio-hero.webp',
  ai_zora: '/images/pages/admin-compliance-audit-hero.webp',
  ai_orchestrator: '/images/pages/admin-ai-console-hero.webp',
  course_builder: '/images/pages/comp-pathway-classroom.webp',
  course_factory: '/images/pages/admin-courses-partners-hero.webp',
  lms: '/images/heroes/lms-analytics.webp',
  student_management: '/images/pages/admin-applicants-detail.webp',
  testing_center: '/images/pages/competency-test-hero.webp',
  workforce: '/images/pages/admin-wioa-hero.webp',
  apprenticeship: '/images/pages/apprenticeship-structure.webp',
  employer_portal: '/images/pages/admin-employers-hero.webp',
  compliance: '/images/pages/compliance-page-1.webp',
  sam_gov_manager: '/images/pages/agencies-page-1.webp',
  grants_discovery: '/images/pages/admin-grants-workflow-detail.webp',
  dev_studio: '/images/pages/admin-dev-studio-detail.webp',
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
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-red-300">
            Start basic. Add capabilities as your business grows.
          </p>
          <h2 className="mt-5 text-3xl font-black tracking-tight sm:text-5xl">Build your Elevate business stack</h2>
          <p className="mt-4 text-base leading-7 text-slate-200 sm:text-lg">
            Search the platform, try products, start a trial, and add specialized AI, education,
            workforce and business tools without buying a second system.
          </p>
        </div>

        <div className="mx-auto mt-8 max-w-3xl">
          <label className="block">
            <span className="sr-only">Search platform capabilities</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search website builder, CRM, PARIS, testing, apprenticeship..."
              className="w-full rounded-2xl border border-white/20 bg-white px-5 py-4 text-base font-medium text-slate-950 outline-none ring-brand-red-500 focus:ring-2"
            />
          </label>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => setCategory('all')}
            className={`rounded-full px-4 py-2 text-sm font-bold ${category === 'all' ? 'bg-brand-red-600 text-white' : 'bg-white/10 text-slate-100 hover:bg-white/15'}`}
          >
            All
          </button>
          {(Object.keys(categoryMeta) as CapabilityCategory[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${category === key ? 'bg-brand-red-600 text-white' : 'bg-white/10 text-slate-100 hover:bg-white/15'}`}
            >
              {categoryMeta[key].label}
            </button>
          ))}
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {items.map((capability) => {
            const price = priceFor(capability);
            const image = CAPABILITY_IMAGES[String(capability.key)] || '/images/pages/comp-home-highlight-biz.webp';
            return (
              <article key={capability.key} className="flex min-h-[390px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-lg">
                <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-800">
                  <Image
                    src={image}
                    alt={`${capability.name} platform capability`}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover"
                    placeholder="empty"
                  />
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-bold uppercase tracking-wide text-slate-300">
                      {categoryMeta[capability.category].label}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-200">
                      {capability.status === 'enterprise' ? 'Enterprise' : capability.status === 'repair' ? 'Preview' : 'Available'}
                    </span>
                  </div>

                  <h3 className="mt-4 text-xl font-black text-white">{capability.name}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-slate-200">{capability.description}</p>
                  {price ? <p className="mt-4 text-sm font-black text-white">{price}</p> : null}

                  <div className="mt-5 flex flex-wrap gap-2">
                    <Link
                      href={primaryHref(capability)}
                      className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-red-600 px-4 py-2.5 text-sm font-black text-white hover:bg-brand-red-500"
                    >
                      {capability.status === 'enterprise' ? 'Explore' : 'View / Start'}
                    </Link>
                    {capability.demoHref ? (
                      <Link
                        href={capability.demoHref}
                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/25 px-4 py-2.5 text-sm font-bold text-white hover:bg-white/10"
                      >
                        Demo
                      </Link>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-200">
            No matching capability. Try a broader search.
          </div>
        ) : null}

        <div className="mt-12 grid gap-4 rounded-3xl border border-brand-red-500/30 bg-slate-900 p-7 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <h3 className="text-2xl font-black">Not sure what to choose?</h3>
            <p className="mt-2 text-slate-200">Start with the 14-day trial. Your platform can recommend upgrades based on the tools you actually use.</p>
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
