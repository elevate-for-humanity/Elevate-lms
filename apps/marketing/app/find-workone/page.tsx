import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ExternalLink, MapPin } from 'lucide-react';
import { CredentialAuthorityFootnote } from '@/components/compliance/CredentialAuthorityFootnote';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WorkOneIndianaMap } from '@/components/workone/WorkOneIndianaMap';
import { WORKONE_REGIONS } from '@/data/workone/indiana-regions';

export const metadata: Metadata = {
  title: 'Find a WorkOne Center in Indiana | Elevate for Humanity',
  description:
    'Find an Indiana WorkOne region and use the official state locator to contact a career center about WIOA or Workforce Ready Grant eligibility.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/find-workone' },
};

export default function FindWorkOnePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Find WorkOne' }]} />
        </div>
      </div>

      <section className="bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-300">Indiana workforce services</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold tracking-tight sm:text-5xl">Find the WorkOne center that serves your county.</h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-200">
            WorkOne—not Elevate—determines participant eligibility, available funding, covered costs, and whether a specific training program may be authorized. Start with your region, then confirm your assigned office through Indiana DWD.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a href="https://www.in.gov/dwd/workone/workone-locations/" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">
              Official Indiana locator <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
            <Link href="/funding/wioa" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/30 px-6 py-3 font-bold text-white hover:bg-white/10">
              Understand WIOA funding <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 sm:py-16" aria-labelledby="region-heading">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <h2 id="region-heading" className="text-3xl font-extrabold tracking-tight">Browse WorkOne regions</h2>
            <p className="mt-3 leading-7 text-slate-700">Choose a region for known center details. Because state locations and hours can change, verify the office with the official DWD locator before traveling.</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {WORKONE_REGIONS.map((region) => (
              <Link key={region.slug} href={`/find-workone/${region.slug}`} className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-brand-blue-400 hover:bg-white hover:shadow-md">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-brand-red-600" aria-hidden="true" />
                  <div>
                    <h3 className="font-bold text-slate-950 group-hover:text-brand-blue-800">{region.name}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{region.counties.join(', ')}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-blue-700">View centers <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <WorkOneIndianaMap showAllRegionsLink={false} />
      <CredentialAuthorityFootnote />
    </main>
  );
}
