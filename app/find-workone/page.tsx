import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WorkOneIndianaMap } from '@/components/workone/WorkOneIndianaMap';
import { WORKONE_REGIONS } from '@/data/workone/indiana-regions';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { CredentialAuthorityFootnote } from '@/components/compliance/CredentialAuthorityFootnote';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Find a WorkOne Center in Indiana | WIOA Funding Intake',
  description:
    'Locate your nearest WorkOne career center in Indiana. WIOA, Workforce Ready Grant, and IMPACT funding eligibility starts at WorkOne — not at your training provider.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/find-workone' },
};

export default function FindWorkOnePage() {
  const central = WORKONE_REGIONS.find((r) => r.slug === 'central-indiana');

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs
            items={[
              { label: 'Funding', href: '/funding' },
              { label: 'Find WorkOne' },
            ]}
          />
        </div>
      </div>

      <section className="py-12 px-4 border-b border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-600 text-xs font-bold uppercase tracking-widest mb-3">
            Indiana · WIOA · WorkOne
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-4">
            Find Your WorkOne Center
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-2xl">
            Most no-cost training at {PLATFORM_DEFAULTS.orgName} starts with a WorkOne intake
            appointment. Funding eligibility is determined by your local workforce agency — not by
            the training provider.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/apply"
              className="inline-flex items-center gap-2 bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl text-sm"
            >
              Apply for training <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/funding/wioa"
              className="inline-flex items-center gap-2 border-2 border-slate-200 text-slate-800 font-semibold px-6 py-3 rounded-xl text-sm hover:bg-slate-50"
            >
              How WIOA funding works
            </Link>
          </div>
        </div>
      </section>

      {central && <WorkOneIndianaMap region={central} showAllRegionsLink={false} />}

      <section className="py-14 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-xl font-extrabold text-slate-900 mb-6">WorkOne regions in Indiana</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WORKONE_REGIONS.map((region) => (
              <Link
                key={region.slug}
                href={`/find-workone/${region.slug}`}
                className="block rounded-xl border border-slate-200 bg-white p-5 hover:border-brand-red-300 hover:shadow-md transition-all"
              >
                <h3 className="font-bold text-slate-900 text-sm mb-2">{region.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2">{region.counties.join(' · ')}</p>
                <span className="inline-flex items-center gap-1 text-brand-red-600 text-xs font-semibold mt-3">
                  Centers &amp; map <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CredentialAuthorityFootnote />
    </div>
  );
}
