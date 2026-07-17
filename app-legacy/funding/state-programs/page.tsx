import type { Metadata } from 'next';
import Link from 'next/link';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Indiana State Workforce Funding',
  description:
    'Indiana state funding programs for workforce training — Workforce Ready Grant, Next Level Jobs, and more. Check eligibility and apply.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding/state-programs' },
};

const PROGRAMS = [
  {
    name: 'Workforce Ready Grant (WRG)',
    tag: 'Indiana DWD',
    who: 'Indiana residents 25+ (or 21–24 with diploma/GED) who are employed or recently unemployed.',
    covers:
      '100% of tuition for approved high-demand programs on the INDemand Jobs list. No repayment.',
    href: '/funding/wrg',
  },
  {
    name: 'Next Level Jobs — Employer Training Grant',
    tag: 'Indiana DWD',
    who: 'Indiana employers hiring and training workers in high-demand sectors.',
    covers:
      'Up to $5,000 per employee for approved training programs. Paid directly to the employer.',
    href: '/contact',
  },
  {
    name: 'Job Ready Indy (JRI)',
    tag: 'Marion County',
    who: 'Marion County residents who are unemployed or underemployed and meet income guidelines.',
    covers: 'Full tuition for approved high-demand programs. No repayment required.',
    href: '/partners/jri',
  },
  {
    name: 'SNAP Employment & Training (SNAP E&T)',
    tag: 'Indiana FSSA',
    who: 'Current SNAP recipients in Indiana.',
    covers: 'Full tuition and supportive services. Elevate is an approved SNAP E&T provider.',
    href: '/snap-et-partner',
  },
];

export default function StateProgramsPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="bg-slate-900 text-white py-16 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            State Funding
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-4">
            Indiana State Workforce Funding
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Indiana offers multiple state-funded programs that cover tuition for high-demand
            workforce training. Many students qualify for more than one source.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <Link
              href="/check-eligibility"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Check My Eligibility
            </Link>
            <Link
              href="/funding"
              className="border-2 border-white/40 text-slate-900 font-bold px-7 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm"
            >
              All Funding Sources
            </Link>
          </div>
        </div>
      </section>

      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {PROGRAMS.map((p) => (
            <div key={p.name} className="border border-slate-200 rounded-xl p-6">
              <div className="flex items-start justify-between gap-4 mb-3">
                <h2 className="text-lg font-extrabold text-slate-900">{p.name}</h2>
                <span className="shrink-0 bg-slate-100 text-slate-600 text-xs font-bold px-3 py-1 rounded-full">
                  {p.tag}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Who qualifies
                  </p>
                  <p className="text-sm text-slate-700">{p.who}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    What it covers
                  </p>
                  <p className="text-sm text-slate-700">{p.covers}</p>
                </div>
              </div>
              <Link href={p.href} className="text-brand-red-600 hover:underline text-sm font-bold">
                Learn more →
              </Link>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 py-12 px-6 border-t border-slate-100">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-xl font-extrabold text-slate-900 mb-3">
            Not sure which program fits?
          </h2>
          <p className="text-slate-600 text-sm mb-6">
            Our enrollment team reviews every funding source you may qualify for — at no cost to
            you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/check-eligibility"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Check Eligibility
            </Link>
            <Link
              href="/contact"
              className="border border-slate-300 text-slate-700 hover:bg-white font-bold px-7 py-3.5 rounded-lg transition-colors text-sm"
            >
              Talk to an Advisor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
