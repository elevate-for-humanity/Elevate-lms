import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ROUTES } from '@/lib/navigation/routes';

export const metadata: Metadata = {
  title: 'Scholarships & Funding | Elevate for Humanity',
  description: 'Review funding and scholarship options for Elevate for Humanity training programs.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/scholarships' },
};

export default function ScholarshipsPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="relative min-h-[360px] overflow-hidden bg-slate-950 sm:min-h-[440px]">
        <Image
          src="/images/pages/hp-wioa-real.webp"
          alt="Workforce funding and career training support conversation"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/75 to-slate-950/30" />
        <div className="relative mx-auto flex min-h-[360px] max-w-6xl items-end px-4 py-10 text-white sm:min-h-[440px] sm:py-14">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.15em] text-white">Funding</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Scholarships & Training Funding
            </h1>
            <p className="mt-5 max-w-2xl text-base font-medium leading-7 text-slate-100 sm:text-lg">
              Funding availability depends on the program, participant eligibility, and funding source. Elevate helps applicants review WIOA, Workforce Ready Grant, employer-supported, scholarship, and self-pay options without guaranteeing approval.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={ROUTES.eligibility} className="inline-flex min-h-12 items-center rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800">
                Check Eligibility
              </Link>
              <Link href={ROUTES.apply} className="inline-flex min-h-12 items-center rounded-xl border-2 border-white bg-white/10 px-6 py-3 font-black text-white hover:bg-white/20">
                Apply for Training
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-brand-red-700">Funding pathways</p>
            <h2 className="mt-2 text-3xl font-black text-slate-950">Start with the funding source that fits your situation</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Eligibility is determined by the applicable workforce agency, grant rules, program status, or scholarship source. These options are not automatic awards.
            </p>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {[
              ['WIOA / WorkOne', 'Some approved training programs may qualify for WIOA funding for eligible participants.', ROUTES.fundingWIOA],
              ['Workforce Ready Grant', 'Qualifying Indiana residents may be eligible for Workforce Ready Grant funding for approved programs.', '/funding/wrg'],
              ['Scholarship Review', 'Applicants who need additional assistance can ask admissions whether any current scholarship or partner-supported funding is available.', ROUTES.contact],
              ['Self-Pay & Payment Options', 'Programs that are not funded, or applicants who are not eligible for public funding, may use approved self-pay options where available.', ROUTES.funding],
            ].map(([title, body, href]) => (
              <article key={title} className="rounded-2xl border border-slate-300 bg-white p-6 shadow-sm">
                <h3 className="text-xl font-black text-slate-950">{title}</h3>
                <p className="mt-3 font-medium leading-7 text-slate-700">{body}</p>
                <Link href={href} className="mt-5 inline-flex font-black text-brand-blue-800 hover:underline">
                  Learn more →
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 px-4 py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row">
          <Link href={ROUTES.eligibility} className="rounded-xl bg-brand-red-700 px-6 py-3 text-center font-black text-white hover:bg-brand-red-800">
            Check Eligibility
          </Link>
          <Link href={ROUTES.apply} className="rounded-xl border-2 border-slate-900 bg-white px-6 py-3 text-center font-black text-slate-950 hover:bg-slate-100">
            Apply
          </Link>
          <Link href={ROUTES.contact} className="rounded-xl border-2 border-slate-900 bg-white px-6 py-3 text-center font-black text-slate-950 hover:bg-slate-100">
            Contact Admissions
          </Link>
        </div>
      </section>
    </main>
  );
}
