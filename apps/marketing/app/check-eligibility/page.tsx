import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import EligibilityScreener from '@/components/funding/EligibilityScreenerClient';
import { VERIFIED_WORKFORCE_FUNDED_PROGRAMS } from '@/lib/programs/funding-registry';

export const metadata: Metadata = {
  title: 'Prepare for Workforce Funding Review | Elevate for Humanity',
  description:
    'Prepare for a WorkOne or agency funding review. This page does not determine eligibility or issue WIOA, Workforce Ready Grant, JRI, or other funding approval.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/check-eligibility' },
};

export default function CheckEligibilityPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="bg-slate-950 px-6 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-400">
            Funding preparation
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-extrabold sm:text-5xl">
            Prepare for a workforce-funding review
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Use this page to understand the next steps before applying. Elevate does not determine
            WIOA, Workforce Ready Grant, JRI, vocational-rehabilitation, or other third-party funding
            eligibility and does not issue a funding award.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-5 text-blue-950">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-bold">What this website can and cannot do</h2>
              <p className="mt-2 text-sm leading-6">
                The website can explain possible pathways, collect an application, and record
                documents. The responsible agency must determine participant eligibility, confirm
                the exact program, decide which costs are allowable, and provide the written
                authorization or award evidence required for funded enrollment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-2xl font-extrabold text-slate-900">Current program-level records</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            These records are allowed to display workforce-funding labels in Elevate's canonical
            registry. A program appearing here does not establish an individual participant's
            eligibility, authorized amount, covered costs, or available funds.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2">
            {VERIFIED_WORKFORCE_FUNDED_PROGRAMS.map((program) => (
              <article key={program.slug} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900">{program.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{program.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {program.wioaEligible && (
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">
                      WIOA consideration
                    </span>
                  )}
                  {program.wrgEligible && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                      WRG consideration
                    </span>
                  )}
                </div>
                <Link href={`/programs/${program.slug}`} className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue-700 hover:underline">
                  Review program <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-extrabold text-slate-900">Funding preparation checklist</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              This checklist routes you to the student application. It intentionally does not return
              a qualified/not-qualified result.
            </p>
          </div>
          <EligibilityScreener />
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-extrabold text-slate-900">Need the agency step first?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">
            Register with Indiana Career Connect and contact the appropriate WorkOne office or other
            responsible funding source. Bring the resulting written authorization back to the
            enrollment process when funding is approved.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-slate-900 px-6 py-3 font-bold text-white hover:bg-slate-800"
            >
              Indiana Career Connect
            </a>
            <Link href="/apply/student" className="rounded-lg border border-slate-300 px-6 py-3 font-bold text-slate-800 hover:bg-slate-50">
              Student Application
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
