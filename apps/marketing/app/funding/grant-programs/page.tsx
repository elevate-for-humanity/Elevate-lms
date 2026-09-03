import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
  getPublicFundingLabels,
} from '@/lib/programs/funding-registry';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Workforce-Funding Program Records | Elevate for Humanity',
  description:
    'Review program-specific workforce-funding records. Funding eligibility and awards remain participant-, program-, agency-, and authorization-specific.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/grant-programs' },
};

export default function GrantProgramsPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'Program Records' }]} />
        </div>
      </div>

      <section className="bg-slate-950 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs uppercase tracking-widest font-bold">Program-level funding records</p>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-3">Verified workforce-funding program records</h1>
          <p className="text-slate-300 text-lg max-w-3xl leading-relaxed mt-5">
            This page does not infer funding from provider status or from legacy program flags. Public
            WIOA, ETPL, and Workforce Ready Grant labels are generated only from Elevate&apos;s canonical
            verified funding registry.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-7 py-3.5 rounded-lg font-bold">Start Application</Link>
            <Link href="/funding/how-it-works" className="border border-white/30 hover:bg-white/10 text-white px-7 py-3.5 rounded-lg font-bold">How Funding Works</Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900">Current registry</h2>
          <p className="text-slate-600 max-w-3xl mt-3 mb-8">
            A program appearing here means Elevate has allowed the corresponding public funding label
            based on its current program record. It does not mean every participant qualifies, every
            cost is covered, funds are available, or an award has been issued.
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <article key={program.slug} className="border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900">{program.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mt-2">{program.description}</p>
                <div className="flex flex-wrap gap-2 mt-4">
                  {getPublicFundingLabels(program.slug).map((label) => (
                    <span key={label} className="bg-slate-100 text-slate-700 text-xs font-bold px-3 py-1 rounded-full">{label}</span>
                  ))}
                </div>
                <p className="text-xs text-slate-500 leading-relaxed mt-4">{program.sourceNote}</p>
                <Link href={`/programs/${program.slug}`} className="inline-flex text-brand-red-700 font-bold text-sm mt-5 hover:underline">Review full program →</Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-50 border-y border-slate-200 py-12 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
          {[
            ['Provider status', 'Provider participation or listing does not automatically establish funding eligibility for every program.'],
            ['Participant status', 'A participant must satisfy the applicable eligibility rules of the funding source.'],
            ['Authorization', 'Elevate should not treat the enrollment as funded until the responsible source provides documented authorization or award evidence.'],
          ].map(([title, text]) => (
            <div key={title} className="bg-white border border-slate-200 rounded-xl p-5">
              <h2 className="font-bold text-slate-900">{title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-2">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
