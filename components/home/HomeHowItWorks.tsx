import HomeSectionNarration from './HomeSectionNarration';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

const STEPS = [
  {
    n: '01',
    label: 'Apply',
    detail: 'Start with a short application so we know your program interest and next step.',
    href: '/apply',
  },
  {
    n: '02',
    label: 'Review Funding',
    detail: 'Explore potential workforce funding and eligibility requirements before enrollment.',
    href: '/check-eligibility',
  },
  {
    n: '03',
    label: 'Train',
    detail: 'Complete credential-aligned instruction and required hands-on learning.',
    href: '/programs',
  },
  {
    n: '04',
    label: 'Work & Learn',
    detail:
      'Eligible apprenticeship pathways combine structured training with employer-based learning.',
    href: '/apprenticeships',
  },
  {
    n: '05',
    label: 'Earn Credentials',
    detail:
      'Prepare for the credential, certification, or license requirement connected to your pathway.',
    href: '/credentials',
  },
  {
    n: '06',
    label: 'Move Forward',
    detail:
      'Use career services, employer connections, and work-based learning support as you advance.',
    href: '/employment-support',
  },
] as const;

export function HomeHowItWorks() {
  return (
    <section className="bg-slate-950 px-4 py-8 sm:py-8" aria-labelledby="how-it-works-heading">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 max-w-3xl">
          <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-orange-300">
            The Elevate Pathway
          </p>
          <h2
            id="how-it-works-heading"
            className="text-3xl font-black tracking-tight text-white sm:text-4xl"
          >
            Know what happens next.
          </h2>
          <p className="mt-4 text-lg leading-8 text-slate-200">
            A clear journey from application through training, credentials, and career
            advancement—without making people guess where to go next.
          </p>
        </div>

        <HomeSectionNarration section="journey" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step) => (
            <Link
              key={step.n}
              href={step.href}
              className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 transition hover:-translate-y-1 hover:border-slate-500 hover:shadow-2xl"
            >
              <div className="flex flex-1 flex-col p-4">
                <span className="mb-3 w-fit rounded-full bg-slate-800 px-3 py-1 text-sm font-black text-orange-300">{step.n}</span>
                <h3 className="text-lg font-black text-white">{step.label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">{step.detail}</p>
                <span className="mt-auto pt-3 inline-flex items-center gap-2 text-base font-extrabold text-orange-300">
                  Learn more{' '}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <Link
            href="/how-it-works"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-4 text-base font-extrabold text-slate-950 hover:bg-slate-100"
          >
            See the Full Process <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
