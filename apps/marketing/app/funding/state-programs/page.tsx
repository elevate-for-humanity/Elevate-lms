import type { Metadata } from 'next';
import Link from 'next/link';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Indiana Workforce Funding Guidance,
  description:
    'Indiana workforce-funding guidance with program- and participant-specific disclosures. Elevate does not guarantee eligibility, awards, reimbursements, or covered costs.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/state-programs' },
};

const SOURCES = [
  {
    name: 'Workforce Ready Grant (WRG)',
    agency: 'Indiana',
    summary:
      'May support qualifying certificate programs for eligible Indiana participants under current state rules and award limits.',
    href: '/funding/wrg',
  },
  {
    name: 'WIOA / WorkOne',
    agency: 'Indiana workforce system',
    summary:
      'Individual Training Account or other WIOA support may be available when the participant, program, provider record, and local authorization requirements are met.',
    href: '/funding/wioa',
  },
  {
    name: 'Employer training assistance',
    agency: 'Program-specific',
    summary:
      'Employer reimbursement or training-assistance programs have separate employer, occupation, training, documentation, and funding requirements.',
    href: '/contact',
  },
  {
    name: 'Other public or supportive-service funding',
    agency: 'Source-specific',
    summary:
      'Other programs may exist for eligible participants, but availability must be confirmed with the responsible agency before Elevate treats an enrollment as funded.',
    href: '/funding',
  },
] as const;

export default function StateProgramsPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 text-white py-16 px-6">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Indiana Funding Guidance
          </p>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-5">Indiana Workforce Funding</h1>
          <p className="text-slate-300 text-lg max-w-3xl leading-relaxed">
            Public workforce funding is not an institution-wide entitlement. Eligibility, approved
            costs, award limits, program status, available funds, and authorization are determined
            under the rules of the applicable funding source.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link href="/apply" className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg">
              Start Application
            </Link>
            <Link href="/funding" className="border border-white/30 hover:bg-white/10 text-white font-bold px-7 py-3.5 rounded-lg">
              All Funding Guidance
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-6">
          {SOURCES.map((source) => (
            <article key={source.name} className="border border-slate-200 rounded-xl p-6">
              <p className="text-xs uppercase tracking-wider font-bold text-slate-500">{source.agency}</p>
              <h2 className="text-lg font-extrabold text-slate-900 mt-2">{source.name}</h2>
              <p className="text-sm text-slate-600 leading-relaxed mt-3">{source.summary}</p>
              <Link href={source.href} className="inline-flex mt-5 text-brand-red-700 hover:underline text-sm font-bold">
                Review requirements →
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="py-14 px-6 bg-slate-50 border-y border-slate-200">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-extrabold text-slate-900">Programs with verified public workforce-funding records</h2>
          <p className="text-slate-600 max-w-3xl mt-3 mb-7">
            This list comes from Elevate&apos;s canonical funding registry. A program&apos;s presence here
            does not by itself establish an individual participant&apos;s eligibility or funding award.
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <Link key={program.slug} href={`/programs/${program.slug}`} className="bg-white rounded-xl border border-slate-200 p-6 hover:border-brand-red-300">
                <h3 className="font-bold text-slate-900">{program.title}</h3>
                <p className="text-sm text-slate-600 mt-2">{program.description}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 px-6">
        <div className="max-w-3xl mx-auto rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950 leading-relaxed">
          <strong>Funding control:</strong> Elevate does not treat tuition, fees, books, supplies,
          exams, wages, reimbursements, or supportive services as covered until the responsible
          funding source has documented the participant&apos;s approved amount and applicable terms.
        </div>
      </section>
    </main>
  );
}
