import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ORG_ENTITIES, GOVERNANCE_FUNCTIONS, ORG_CAPACITY } from '@/lib/governance/org-structure';
import { RAPIDS_SPONSOR_LABEL } from '@/lib/workforce-ids';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Organizational Structure',
  description: `How ${PLATFORM_DEFAULTS.orgName}, 2Exclusive LLC-S, and community programs relate — training provider, apprenticeship sponsor, and nonprofit activities.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/about/organization' },
};

export default function OrganizationPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <Breadcrumbs items={[{ label: 'About', href: '/about' }, { label: 'Organization' }]} />
      </div>

      <section className="bg-slate-900 text-white py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-2">
            Governance
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">How We Are Organized</h1>
          <p className="text-slate-300 text-sm leading-relaxed">
            {PLATFORM_DEFAULTS.orgName} operates as a workforce ecosystem — training provider,
            apprenticeship sponsor, testing center, and funding navigator. This page explains how the
            legal entities relate.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        <div className="grid gap-4">
          {ORG_ENTITIES.map((entity) => (
            <div key={entity.name} className="rounded-xl border border-slate-200 p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-brand-red-600 mb-1">
                {entity.role}
              </p>
              <h2 className="text-lg font-extrabold text-slate-900">{entity.name}</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{entity.description}</p>
            </div>
          ))}
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-4">Governance &amp; Compliance</h2>
          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {GOVERNANCE_FUNCTIONS.map((row) => (
              <div key={row.function} className="px-5 py-4 bg-white">
                <p className="text-sm font-bold text-slate-900">{row.function}</p>
                <p className="text-sm text-slate-600 mt-1">{row.owner}</p>
                <a
                  href={`mailto:${row.contact}`}
                  className="text-xs text-brand-blue-700 font-semibold mt-1 inline-block hover:underline"
                >
                  {row.contact}
                </a>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-5">
          <h2 className="text-lg font-extrabold text-slate-900 mb-2">Operational Capacity</h2>
          <ul className="text-sm text-slate-700 space-y-2">
            <li>
              <span className="font-semibold">Leadership team:</span> {ORG_CAPACITY.leadershipTeam}{' '}
              named roles on the public team page
            </li>
            <li>
              <span className="font-semibold">Headquarters:</span> {ORG_CAPACITY.headquarters}
            </li>
            <li>
              <span className="font-semibold">Delivery:</span> {ORG_CAPACITY.deliveryModel}
            </li>
            <li>
              <span className="font-semibold">Apprenticeship:</span> {RAPIDS_SPONSOR_LABEL}
            </li>
          </ul>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/about/team"
            className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-5 py-2.5 rounded-lg text-sm"
          >
            Leadership Team
          </Link>
          <Link
            href="/compliance/center"
            className="border border-slate-300 text-slate-800 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-slate-50"
          >
            Compliance Center
          </Link>
          <Link
            href="/impact"
            className="border border-slate-300 text-slate-800 font-semibold px-5 py-2.5 rounded-lg text-sm hover:bg-slate-50"
          >
            Outcomes &amp; Impact
          </Link>
        </div>
      </section>
    </div>
  );
}
