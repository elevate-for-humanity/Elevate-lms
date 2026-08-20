import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import EligibilityScreener from '@/components/funding/EligibilityScreenerClient';
import {
  VERIFIED_WORKFORCE_FUNDED_PROGRAMS,
  getPublicFundingLabels,
} from '@/lib/programs/funding-registry';

export const metadata: Metadata = {
  title: 'Workforce Funding | Elevate for Humanity',
  description:
    'Review Elevate programs with current program-level workforce-funding evidence. Participant eligibility, allowable costs, available funds, and authorization are determined by the responsible agency.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/funding' },
};

export default function FundingPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400">Workforce funding</p>
          <h1 className="mt-3 text-4xl font-extrabold sm:text-5xl">Program-specific funding records</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Elevate publishes workforce-funding labels only for programs represented in the current
            verified registry. A provider relationship, website label, application, or preliminary
            checklist does not create participant eligibility or a funding award.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-bold">Agency authorization controls funded enrollment</h2>
              <p className="mt-2 text-sm leading-6">
                WorkOne or the responsible funding source determines participant eligibility, the
                exact eligible program, allowable costs, available funds, and the written
                authorization required before Elevate records an enrollment as funded.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-extrabold text-slate-900">Current verified program records</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            This section renders directly from the canonical funding registry. No separate hard-coded
            program count or funding list is maintained on this page.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <article key={program.slug} className="rounded-xl border border-slate-200 p-6">
                <h3 className="text-lg font-bold text-slate-900">{program.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{program.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {getPublicFundingLabels(program.slug).map((label) => (
                    <span key={label} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {label}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs leading-5 text-slate-500">{program.sourceNote}</p>
                <Link href={`/programs/${program.slug}`} className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-700 hover:underline">
                  Review program <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-14">
        <div className="mx-auto grid max-w-5xl gap-5 md:grid-cols-3">
          {[
            ['Program evidence', 'Program-level status must be supported by the current canonical registry and underlying evidence.'],
            ['Participant eligibility', 'The responsible agency applies its own eligibility rules to the individual applicant.'],
            ['Written authorization', 'A funded enrollment is not confirmed until the responsible source provides documented authorization or award evidence.'],
          ].map(([title, body]) => (
            <article key={title} className="rounded-xl border border-slate-200 bg-white p-5">
              <h2 className="font-bold text-slate-900">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900">Prepare for the funding review</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              This checklist does not approve funding. It helps identify the agency step required before a funded enrollment can be confirmed.
            </p>
          </div>
          <EligibilityScreener />
        </div>
      </section>

      <section className="bg-slate-950 px-6 py-14 text-center text-white">
        <h2 className="text-2xl font-extrabold">Start with the controlling records</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-300">
          Review the exact program, then complete the WorkOne or responsible-agency process before relying on workforce funding for tuition or other costs.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a href="https://www.indianacareerconnect.com" target="_blank" rel="noopener noreferrer" className="rounded-lg bg-white px-6 py-3 font-bold text-slate-900 hover:bg-slate-100">
            Indiana Career Connect
          </a>
          <Link href="/apply/student" className="rounded-lg bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">
            Student Application
          </Link>
        </div>
      </section>
    </main>
  );
}
