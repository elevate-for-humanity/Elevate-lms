import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BadgeDollarSign, BriefcaseBusiness, GraduationCap, Landmark } from 'lucide-react';

const FUNDING_SOURCES = [
  {
    name: 'WIOA',
    desc: 'Workforce funding may be available for eligible participants in approved training programs.',
    icon: Landmark,
  },
  {
    name: 'Workforce Ready Grant',
    desc: 'Indiana funding may support qualifying high-demand credentials for eligible participants.',
    icon: GraduationCap,
  },
  {
    name: 'Employer & OJT Support',
    desc: 'Eligible employer-based training arrangements may include wage reimbursement or work-based learning support.',
    icon: BriefcaseBusiness,
  },
  {
    name: 'Self-Pay Options',
    desc: 'Payment options may be available when public funding does not apply.',
    icon: BadgeDollarSign,
  },
] as const;

export function HomeFunding() {
  return (
    <section className="border-t border-slate-100 bg-white px-4 py-16 sm:py-20" aria-labelledby="funding-heading">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative min-h-[360px] overflow-hidden rounded-3xl sm:min-h-[460px]">
            <Image
              src="/images/pages/funding-hero.webp"
              alt="Funding advisor helping a student review training options"
              fill
              className="object-cover object-center"
              sizes="(max-width: 1024px) 100vw, 45vw"
              loading="lazy"
            />
            <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-white/95 p-5 shadow-xl backdrop-blur-sm">
              <p className="text-lg font-black text-slate-950">Start with eligibility, not assumptions.</p>
              <p className="mt-1 text-base leading-7 text-slate-700">Funding depends on the participant, program, region, authorization, and available funding.</p>
            </div>
          </div>

          <div>
            <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.14em] text-brand-red-700">Funding Navigation</p>
            <h2 id="funding-heading" className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Understand your options before you enroll.
            </h2>
            <p className="mt-4 text-lg leading-8 text-slate-700">
              Elevate helps applicants identify potential workforce funding pathways and understand the next steps required by the responsible agency or funding source.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {FUNDING_SOURCES.map(({ name, desc, icon: Icon }) => (
                <div key={name} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <Icon className="h-6 w-6 text-brand-red-700" aria-hidden="true" />
                  <h3 className="mt-3 text-lg font-black text-slate-950">{name}</h3>
                  <p className="mt-2 text-base leading-7 text-slate-700">{desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/check-eligibility" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-4 text-base font-extrabold text-white hover:bg-brand-red-700">
                Check Eligibility <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/funding" className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 px-7 py-4 text-base font-extrabold text-slate-900 hover:bg-slate-50">
                View Funding Options
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
