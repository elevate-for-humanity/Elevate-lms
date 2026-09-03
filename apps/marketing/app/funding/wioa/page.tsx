import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, FileCheck2, Landmark, ShieldCheck } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/funding/wioa',
  },
  title: 'WIOA Training Funding | Elevate for Humanity',
  description:
    'Understand the WIOA training-funding process in Indiana, how WorkOne determines eligibility, and how to verify whether a specific Elevate program may be funded.',
};

const MAY_COVER = [
  {
    title: 'Eligible training costs',
    description:
      'An approved Individual Training Account may pay some or all authorized training costs for an eligible participant and an eligible program.',
  },
  {
    title: 'Required books or materials',
    description:
      'Some required training materials may be authorized when permitted by the participant’s local workforce area and individual plan.',
  },
  {
    title: 'Supportive services',
    description:
      'Transportation, childcare, work clothing, or similar support may be available under local policy when necessary for participation. These benefits are not automatic.',
  },
  {
    title: 'Career and employment services',
    description:
      'WorkOne can provide career planning, labor-market information, job-search assistance, and other workforce services based on eligibility and need.',
  },
];

const STEPS = [
  {
    title: 'Connect with WorkOne',
    description:
      'Contact your local WorkOne office and tell your career advisor which occupation and training program you are considering.',
  },
  {
    title: 'Complete eligibility and career planning',
    description:
      'WorkOne—not Elevate—determines participant eligibility, required documentation, funding source, and whether training is appropriate under your individual employment plan.',
  },
  {
    title: 'Verify the specific program',
    description:
      'Funding eligibility applies to specific programs, not automatically to every course offered by a provider. Confirm the program and approved amount with your advisor.',
  },
  {
    title: 'Enroll after written authorization',
    description:
      'Do not rely on a website funding label as approval. Elevate will coordinate enrollment after the responsible workforce agency issues the required authorization or voucher.',
  },
];

export default function WioaPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Funding', href: '/funding' }, { label: 'WIOA' }]} />
        </div>
      </div>

      <section className="relative isolate min-h-[520px] overflow-hidden bg-slate-950">
        <Image
          src="/images/pages/funding-page-4.jpg"
          alt="Adult learner meeting with a workforce training advisor"
          fill
          priority
          quality={90}
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-950/70" aria-hidden="true" />
        <div className="relative mx-auto flex min-h-[520px] max-w-6xl items-center px-4 py-16 sm:px-6">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/25 px-4 py-2 text-sm font-semibold text-white">
              <Landmark className="h-4 w-4" aria-hidden="true" />
              Workforce Innovation and Opportunity Act
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              WIOA training funding starts with eligibility and written authorization.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-100 sm:text-xl">
              WIOA can help eligible job seekers access occupational training, but funding is decided by the responsible WorkOne or workforce agency for the individual participant and the specific program.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apply/student"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white transition hover:bg-brand-red-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Start Application <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
              <Link
                href="/eligibility/quiz"
                className="inline-flex min-h-12 items-center justify-center rounded-xl border-2 border-white bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Check Preliminary Eligibility
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-amber-200 bg-amber-50">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-6 w-6 shrink-0 text-amber-800" aria-hidden="true" />
            <p className="text-sm leading-6 text-amber-950 sm:text-base">
              <strong>Funding is not guaranteed.</strong> Provider or program listing does not by itself guarantee a referral, voucher, or payment. Your local workforce agency determines participant eligibility, program eligibility, available funds, covered costs, and required authorization.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red-700">How WIOA works</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Funding follows the participant and the approved training plan.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-700">
              In Indiana, WorkOne and the local workforce system help eligible participants evaluate career goals and determine whether occupational training is appropriate. When training is approved, the agency identifies the authorized funding source and amount.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-700">
              Elevate can explain program requirements and provide enrollment documentation, but Elevate does not determine WIOA eligibility and cannot promise that a participant or program will be funded.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {MAY_COVER.map((item) => (
              <article key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <CheckCircle2 className="h-6 w-6 text-brand-green-700" aria-hidden="true" />
                <h3 className="mt-4 text-lg font-bold text-slate-950">{item.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">{item.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-950 py-16 text-white sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-300">Required sequence</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Four steps before training is treated as workforce funded
            </h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {STEPS.map((step, index) => (
              <article key={step.title} className="rounded-2xl border border-white/15 bg-white/5 p-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-extrabold text-slate-950">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{step.title}</h3>
                    <p className="mt-2 leading-7 text-slate-200">{step.description}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid gap-8 rounded-3xl border border-slate-200 bg-slate-50 p-7 sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="flex items-center gap-2 text-brand-blue-800">
                <FileCheck2 className="h-5 w-5" aria-hidden="true" />
                <span className="text-sm font-bold uppercase tracking-[0.16em]">Before you enroll</span>
              </div>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-950">Confirm the exact program with your advisor.</h2>
              <p className="mt-4 max-w-3xl leading-7 text-slate-700">
                The state training list contains specific eligible programs. A provider may also offer other self-pay courses that are not funded through WIOA. Use the program directory and your written WorkOne authorization together as the controlling enrollment documents.
              </p>
            </div>
            <Link
              href="/programs"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-950 px-6 py-3 font-bold text-white transition hover:bg-slate-800"
            >
              Review Programs <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 bg-white py-14">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-extrabold text-slate-950">Need help preparing for your WorkOne conversation?</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-700">
            We can provide program information and enrollment documents for your advisor. For funding approval, benefit amounts, or supportive-service decisions, contact the responsible WorkOne or workforce agency directly.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex min-h-12 items-center justify-center rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700"
            >
              Contact Admissions
            </Link>
            <a
              href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9+]/g, '')}`}
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-950 hover:bg-slate-100"
            >
              Call {PLATFORM_DEFAULTS.supportPhone}
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
