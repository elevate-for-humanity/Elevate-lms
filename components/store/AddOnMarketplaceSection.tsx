'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, Plus, ArrowRight, Zap, Trophy } from 'lucide-react';
import { ADD_ON_MARKETPLACE } from '@/lib/store/platform-pricing';

interface Props {
  selectedSlugs: string[];
  onToggle: (slug: string) => void;
}

// One-time purchase add-ons (lifetime access, no recurring fees)
const ONE_TIME_ADDONS = [
  {
    slug: 'community-hub',
    name: 'Community Hub',
    description: 'Add a complete community platform to your LMS. Discussions, groups, leaderboards, events, and gamification.',
    price: 1997,
    href: '/store/add-ons/community-hub',
    features: ['Discussion Forums', 'Member Groups & Cohorts', 'Leaderboards & Rankings', 'Points & Badge System', 'Events Calendar', 'Direct Messaging'],
    popular: true,
  },
  {
    slug: 'analytics-pro',
    name: 'Analytics Pro',
    description: 'Advanced reporting and predictive analytics for student outcomes. Real-time dashboards, custom reports, and cohort analysis.',
    price: 1497,
    href: '/store/add-ons/analytics-pro',
    features: ['Real-time dashboards', 'Custom reports', 'Cohort analysis', 'Predictive analytics'],
    popular: false,
  },
  {
    slug: 'compliance-automation',
    name: 'Compliance Automation',
    description: 'Automated compliance tracking and reporting for WIOA, grants, FERPA, and accreditation requirements.',
    price: 1297,
    href: '/store/add-ons/compliance-automation',
    features: ['WIOA tracking', 'Grant compliance', 'FERPA automation', 'Accreditation reports'],
    popular: false,
  },
  {
    slug: 'agency-template-autofill',
    name: 'Agency Template Autofill',
    description: 'Auto-populate grant applications and agency forms from your existing enrollment and compliance data.',
    price: 997,
    href: '/store/add-ons/agency-template-autofill',
    features: ['Auto-fill forms', 'Grant applications', 'Agency templates', 'Data integration'],
    popular: false,
  },
  {
    slug: 'proposal-writing-assistant',
    name: 'Proposal Writing Assistant',
    description: 'AI-powered grant proposal drafting using your program data, outcomes, and compliance records.',
    price: 1497,
    href: '/store/add-ons/proposal-writing-assistant',
    features: ['AI proposal drafting', 'Program data integration', 'Compliance records', 'Grant templates'],
    popular: false,
  },
  {
    slug: 'workforce-grant-operations-hub',
    name: 'Workforce Grant Operations Hub',
    description: 'Centralized grant lifecycle management — tracking, reporting, and renewal workflows.',
    price: 1997,
    href: '/store/add-ons/workforce-grant-operations-hub',
    features: ['Grant tracking', 'Reporting workflows', 'Renewal management', 'Funding sources'],
    popular: false,
  },
];

export function AddOnMarketplaceSection({ selectedSlugs, onToggle }: Props) {
  return (
    <>
      {/* Subscription Add-Ons */}
      <section className="py-16 px-4 bg-slate-50" id="subscription-addons">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">Subscription Add-Ons</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            Monthly modules you can add to your base plan. A barber can start at $29/month. A workforce training provider can grow to $250–500/month by adding LMS, workforce, apprenticeship, employer portal, and AI modules.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ADD_ON_MARKETPLACE.map((addon) => {
              const selected = selectedSlugs.includes(addon.slug);
              return (
                <div
                  key={addon.slug}
                  className={`rounded-xl border p-6 flex flex-col bg-white ${
                    selected ? 'border-brand-blue-500 ring-2 ring-brand-blue-200' : 'border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <h3 className="font-bold text-slate-900">{addon.name}</h3>
                    <span className="text-lg font-bold text-brand-blue-600 whitespace-nowrap">
                      ${addon.priceMonthly}/mo
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-4">{addon.description}</p>
                  {addon.usageNote && (
                    <p className="text-xs text-slate-500 mb-3">{addon.usageNote}</p>
                  )}
                  <ul className="space-y-2 mb-6 flex-1">
                    {addon.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                        {b}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => onToggle(addon.slug)}
                    className={`w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 ${
                      selected
                        ? 'bg-brand-blue-600 text-white'
                        : 'border border-slate-300 text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    {selected ? 'Included at checkout' : 'Add to checkout'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* One-Time Purchase Add-Ons */}
      <section className="py-16 px-4 bg-white border-t border-slate-200" id="onetime-addons">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-2">One-Time Purchase Add-Ons</h2>
          <p className="text-slate-600 text-center mb-10 max-w-2xl mx-auto">
            Lifetime access, no recurring fees. One-time payment for permanent access to powerful features.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ONE_TIME_ADDONS.map((addon) => (
              <div
                key={addon.slug}
                className={`rounded-xl border p-6 flex flex-col bg-white ${
                  addon.popular ? 'border-brand-blue-500 ring-2 ring-brand-blue-200' : 'border-slate-200'
                }`}
              >
                {addon.popular && (
                  <span className="self-start bg-brand-red-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
                    MOST POPULAR
                  </span>
                )}
                <div className="flex justify-between items-start gap-2 mb-2">
                  <h3 className="font-bold text-slate-900">{addon.name}</h3>
                  <span className="text-lg font-bold text-brand-blue-600 whitespace-nowrap">
                    ${addon.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{addon.description}</p>
                <p className="text-xs text-slate-500 mb-3">One-time payment · Lifetime access</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {addon.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                      <Check className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`${addon.href}?checkout=true`}
                  className="w-full py-2.5 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 bg-brand-blue-600 text-white hover:bg-brand-blue-700"
                >
                  Purchase Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link
              href="/store/add-ons"
              className="inline-flex items-center gap-2 text-brand-blue-600 font-semibold hover:underline"
            >
              View all add-ons
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

/** Self-contained marketplace with local selection state */
export function AddOnMarketplaceStandalone({
  initialSlugs = [],
  onSelectionChange,
}: {
  initialSlugs?: string[];
  onSelectionChange?: (slugs: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(initialSlugs);

  const toggle = (slug: string) => {
    setSelected((prev) => {
      const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug];
      onSelectionChange?.(next);
      return next;
    });
  };

  return <AddOnMarketplaceSection selectedSlugs={selected} onToggle={toggle} />;
}
