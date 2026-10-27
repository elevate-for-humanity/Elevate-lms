'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
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

const previewImages: Record<CapabilityCategory, { src: string; alt: string }> = {
  business: { src: '/images/pages/store-digital-detail1.webp', alt: 'Business analytics displayed on a tablet' },
  ai: { src: '/images/pages/store-addons-analytics-hero.webp', alt: 'Analytics workspace on a laptop' },
  education: { src: '/images/pages/store-compliance-wioa-detail.webp', alt: 'Learners collaborating in a classroom' },
  workforce: { src: '/images/pages/store-recommendations.webp', alt: 'Skilled trades professionals in a workshop' },
  compliance: { src: '/images/pages/store-checkout-cancel-hero.webp', alt: 'Organized office workspace and documents' },
  apps: { src: '/images/pages/store-licenses-checkout-hero.webp', alt: 'Digital content displayed on a tablet' },
  enterprise: { src: '/images/pages/store-addons-analytics-hero.webp', alt: 'Business reporting on a laptop' },
};

// Distinct repository photographs illustrate each offer; these are not UI screenshots.
const offerImages: Record<string, { src: string; alt: string }> = {
  website_builder: { src: '/images/pages/store-trial-detail.jpg', alt: 'Developer building a website at a desktop workspace' },
  crm: { src: '/images/pages/store-guide-1.webp', alt: 'Business professionals collaborating at a laptop' },
  booking: { src: '/images/pages/booking-page-1.webp', alt: 'Professional meeting with a client' },
  forms: { src: '/images/pages/store-compliance-wcag-hero.jpg', alt: 'Person reviewing and completing documents' },
  email_marketing: { src: '/images/pages/admin-email-marketing-d2.webp', alt: 'Marketing team planning a campaign together' },
  sms: { src: '/images/pages/store-cart-hero.jpg', alt: 'Person using a mobile device' },
  invoicing: { src: '/images/pages/store-compliance-hero.jpg', alt: 'Business calculations beside a notebook' },
  seo_autopilot: { src: '/images/pages/store-digital-detail1.webp', alt: 'Website performance charts displayed on a tablet' },
  marketing_autopilot: { src: '/images/pages/admin-email-analytics-detail.webp', alt: 'Team reviewing a marketing presentation' },
  ai_paris: { src: '/images/pages/store-guides-capital-hero.jpg', alt: 'Business advisor at a desk' },
  ai_ellie: { src: '/images/pages/store-courses-hero.jpg', alt: 'Learners working together with study materials' },
  ai_lizzy: { src: '/images/pages/store-checkout-cancel-hero.webp', alt: 'Organized office workspace with documents and equipment' },
  ai_zora: { src: '/images/pages/store-guides-licensing-hero.jpg', alt: 'Professional reviewing a checklist' },
  ai_orchestrator: { src: '/images/pages/store-addons-hero.jpg', alt: 'Software code displayed on a screen' },
  course_builder: { src: '/images/pages/admin-email-automation-new-d2.webp', alt: 'Instructor leading a collaborative lesson' },
  course_factory: { src: '/images/pages/store-trial-hero.jpg', alt: 'Software development code on a screen' },
  lms: { src: '/images/pages/store-compliance-wioa-detail.webp', alt: 'Learners collaborating in a classroom' },
  student_management: { src: '/images/pages/store-success-hero.webp', alt: 'Education team working together' },
  workforce: { src: '/images/pages/store-recommendations.webp', alt: 'Skilled trades professionals in a workshop' },
  apprenticeship: { src: '/images/pages/barber-hands-on-bright.webp', alt: 'Supervised hands-on barber training' },
};

function interactiveDemoHref(capability: PlatformCapability): string | null {
  return capability.demoHref?.trim() || null;
}

function ProductPreview({ capability, name }: { capability: PlatformCapability; name: string }) {
  const image = offerImages[capability.key] ?? previewImages[capability.category];
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
      <Image src={image.src} alt={image.alt} fill loading="lazy"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition duration-300 group-hover:scale-105" />
      <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-slate-950 shadow-sm">
        {categoryMeta[capability.category].label}
      </span>
      <span className="sr-only">Explore {name}</span>
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
      className="border-y border-cyan-100 bg-gradient-to-b from-white via-cyan-50/50 to-rose-50 py-8 font-sans font-medium text-slate-950 sm:py-16"
      id="marketplace"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-brand-red-700">
            One platform. Three clear buying paths.
          </p>
          <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950 sm:mt-5 sm:text-5xl">
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
                className={`rounded-xl border p-4 text-left transition sm:rounded-2xl sm:p-5 ${selected ? 'border-brand-red-400 bg-white text-slate-950 shadow-lg' : 'border-slate-200 bg-white text-slate-950 shadow-sm hover:border-orange-300 hover:shadow-md'}`}
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
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg shadow-slate-900/5 sm:min-h-[390px]"
              >
                <ProductPreview capability={capability} name={capabilityName} />
                <div className="flex flex-1 flex-col p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-4">
                    <span className="text-xs font-black uppercase tracking-wide text-rose-700">
                      {categoryMeta[capability.category].label}
                    </span>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-900">
                      {availabilityLabel(availability)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:mt-4 sm:text-2xl">{capabilityName}</h3>
                  <p className="mt-2 flex-1 text-sm font-medium leading-6 text-slate-700">
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
                      className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl bg-brand-red-700 px-4 py-3 text-sm font-black text-white hover:bg-brand-red-800 sm:flex-none"
                    >
                      {action.label}
                    </Link>
                    {interactiveDemoHref(capability) ? (
                      <Link
                        href={interactiveDemoHref(capability)!}
                        className="inline-flex min-h-12 flex-1 items-center justify-center rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-950 hover:border-brand-red-400 hover:bg-slate-50 sm:flex-none"
                      >
                        Open Live Demo
                      </Link>
                    ) : null}
                    <Link
                      href={`/store/proof#feature-${capability.key}`}
                      className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-900 hover:bg-emerald-100"
                    >
                      <ShieldCheck className="h-4 w-4" /> View source-backed proof
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
