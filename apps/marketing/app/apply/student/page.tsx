import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ApplyPathGuide from '@/components/apply/ApplyPathGuide';
import StudentApplicationForm from './StudentApplicationForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveSlug } from '@/lib/program-registry';
import { getProgramBySlug } from '@/lib/programs/static-registry';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { hero as heroTokens } from '@/lib/page-design-tokens';
import { getAdminUrl } from '@/lib/config/admin-url';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Apply for Career Training | Elevate for Humanity',
  description:
    'Submit a student application for Elevate career training. Review the exact program requirements, tuition, credentials, and any program-specific funding options before enrollment.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student',
  },
  openGraph: {
    title: 'Apply for Career Training | Elevate for Humanity',
    description:
      'Apply for career training and review the program-specific requirements, tuition, credential pathway, and funding process that apply to your selection.',
    url: 'https://www.elevateforhumanity.org/apply/student',
    siteName: PLATFORM_DEFAULTS.orgName,
    images: [
      {
        url: '/images/pages/comp-home-highlight-health.webp',
        width: 1200,
        height: 630,
        alt: 'Apply for career training',
      },
    ],
    type: 'website',
  },
};

const FEATURED_SLUGS = [
  'cna',
  'medical-assistant',
  'hvac-technician',
  'cdl-training',
  'barber-apprenticeship',
  'phlebotomy',
  'it-help-desk',
  'bookkeeping',
] as const;

const PROGRAMS = FEATURED_SLUGS.flatMap((slug) => {
  const program = getProgramBySlug(slug);
  if (!program) return [];
  return [
    {
      slug: program.slug,
      title: program.title,
      duration: program.durationWeeks ? `${program.durationWeeks} weeks` : 'See program page',
      credential: program.credentials?.[0]?.name || 'See program page',
      href: `/programs/${program.slug}`,
      image: program.heroImage,
      fundingStatement: program.fundingStatement,
    },
  ];
});

const STEPS = [
  {
    n: '1',
    title: 'Submit Your Application',
    desc: 'Tell us which program you are considering and provide the information needed for admissions review.',
  },
  {
    n: '2',
    title: 'Review the Exact Program',
    desc: 'Confirm the current tuition, schedule, admission requirements, credential or licensing objective, and required documents for that program.',
  },
  {
    n: '3',
    title: 'Complete Funding Review if Requested',
    desc: 'If you want third-party funding, WorkOne or the responsible funding agency determines your eligibility, the approved program, covered costs, and authorized amount.',
  },
  {
    n: '4',
    title: 'Complete Required Onboarding',
    desc: 'Complete the orientation, agreements, document uploads, payment or funding authorization, and any other enrollment requirements that apply.',
  },
  {
    n: '5',
    title: 'Begin Training After Enrollment Is Active',
    desc: 'Course access begins after the required enrollment controls are complete and your enrollment is activated.',
  },
  {
    n: '6',
    title: 'Use Career Support',
    desc: 'Career services may provide resume, interview, referral, and job-search assistance. Employment, wages, and hiring decisions are not guaranteed.',
  },
] as const;

const TRUST = [
  { stat: 'Program-specific', label: 'Tuition, schedule, credentials, and requirements' },
  { stat: 'Written approval', label: 'Required before third-party funding is treated as confirmed' },
  { stat: 'Verified records', label: 'Enrollment and completion depend on actual learner records' },
  { stat: 'Career support', label: 'Job-search assistance without employment guarantees' },
] as const;

const FUNDING = [
  {
    label: 'WIOA',
    desc: 'May be considered for eligible participants and eligible programs. WorkOne or the responsible workforce agency controls eligibility, authorization, and covered costs.',
  },
  {
    label: 'Workforce Ready Grant',
    desc: 'May apply only to programs and participants that meet current Indiana eligibility and program-list requirements. Do not assume every Elevate program qualifies.',
  },
  {
    label: 'Other Agency or Employer Funding',
    desc: 'Vocational rehabilitation, employer sponsorship, or other assistance may apply when the responsible organization approves the participant and program in writing.',
  },
  {
    label: 'Self-Pay',
    desc: 'Self-pay is available for programs with published tuition. Use the exact program page and checkout or enrollment agreement for the controlling price and payment terms.',
  },
] as const;

export default async function StudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const initialProgram = resolveSlug(params?.program || '') || '';

  return (
    <main className="min-h-screen bg-white text-slate-950">
      <div className={heroTokens.imageWrap}>
        <Image
          src="/images/pages/apply-page-4.jpg"
          alt={`Student applying for career training with ${PLATFORM_DEFAULTS.orgName}`}
          fill
          sizes="100vw"
          className="object-cover"
          loading="eager"
          fetchPriority="high"
        />
      </div>

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Student' }]} />
        </div>
      </div>

      <section className="border-b border-slate-200 px-4 py-10">
        <div className="mx-auto max-w-5xl">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red-700">
            Student Application — Indianapolis, Indiana
          </p>
          <h1 className="mb-3 text-3xl font-extrabold leading-tight text-slate-950 sm:text-4xl">
            Apply after reviewing the exact program you want.
          </h1>
          <p className="mb-6 max-w-3xl text-base leading-7 text-slate-700 sm:text-lg">
            Submit your application, then complete the admission, funding, payment, document, and onboarding steps that apply to your selected program. Third-party funding is never guaranteed by submitting this form.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#application-form"
              className="inline-flex min-h-12 items-center rounded-xl bg-brand-red-600 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-700"
            >
              Start Application
            </a>
            <Link
              href="/eligibility/quiz"
              className="inline-flex min-h-12 items-center rounded-xl border-2 border-slate-300 px-7 py-3 text-sm font-bold text-slate-950 transition-colors hover:border-brand-blue-600"
            >
              Preliminary Eligibility Check
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-slate-950 px-4 py-10 text-white" aria-label="Application safeguards">
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST.map((item) => (
            <div key={item.stat}>
              <p className="mb-1 text-lg font-extrabold text-white">{item.stat}</p>
              <p className="text-sm leading-6 text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-b border-slate-200 px-4 py-14">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red-700">Featured Programs</p>
            <h2 className="mb-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">Review Before You Select</h2>
            <p className="max-w-3xl text-sm leading-6 text-slate-700">
              Program requirements are not interchangeable. Open the program record to verify its current duration, credential objective, tuition, delivery model, and funding disclosure.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PROGRAMS.map((program) => (
              <Link
                key={program.slug}
                href={program.href}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
                  <Image
                    src={program.image}
                    alt={program.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="mb-2 text-sm font-bold text-slate-950">{program.title}</h3>
                  <p className="text-xs leading-5 text-slate-700">
                    <span className="font-bold text-slate-950">Duration:</span> {program.duration}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-700">
                    <span className="font-bold text-slate-950">Credential:</span> {program.credential}
                  </p>
                  <p className="mt-3 text-xs leading-5 text-slate-600">{program.fundingStatement}</p>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link
              href="/programs"
              className="inline-flex min-h-12 items-center rounded-xl border-2 border-slate-300 px-7 py-3 text-sm font-bold text-slate-950 transition-colors hover:border-brand-red-600"
            >
              View All Programs
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red-700">The Process</p>
            <h2 className="text-2xl font-extrabold text-slate-950 sm:text-3xl">What Happens After You Apply</h2>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-slate-700">
              The exact sequence can vary by program and funding source. These are the controls every applicant should expect to verify.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {STEPS.map((step) => (
              <article key={step.n} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-brand-red-600 text-sm font-extrabold text-white">
                  {step.n}
                </div>
                <h3 className="mb-2 text-sm font-bold text-slate-950">{step.title}</h3>
                <p className="text-sm leading-6 text-slate-700">{step.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 px-4 py-14">
        <div className="mx-auto grid max-w-5xl gap-10 sm:grid-cols-2 sm:items-start">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red-700">Funding & Cost</p>
            <h2 className="mb-4 text-2xl font-extrabold text-slate-950">Funding must be verified for the participant and program.</h2>
            <p className="mb-4 text-sm leading-6 text-slate-700">
              Some applicants may qualify for workforce, vocational-rehabilitation, employer, or other third-party assistance. The responsible funder—not Elevate—determines eligibility, available funds, covered costs, and the authorized amount.
            </p>
            <p className="mb-6 text-sm leading-6 text-slate-700">
              Do not treat an application, eligibility quiz, provider relationship, or website funding label as a voucher or payment authorization.
            </p>
            <Link
              href="/funding"
              className="inline-flex min-h-12 items-center rounded-xl bg-brand-red-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-red-700"
            >
              Review Funding Options
            </Link>
          </div>
          <div className="space-y-3">
            {FUNDING.map((funding) => (
              <article key={funding.label} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-1 text-sm font-bold text-slate-950">{funding.label}</h3>
                <p className="text-sm leading-6 text-slate-700">{funding.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-emerald-200 bg-emerald-50 px-4 py-14" aria-labelledby="foundation-support-title">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="mb-2 text-xs font-black uppercase tracking-widest text-emerald-800">Support Beyond Tuition</p>
              <h2 id="foundation-support-title" className="text-2xl font-extrabold text-slate-950 sm:text-3xl">
                Rise Forward Foundation may help connect eligible participants to additional support.
              </h2>
              <p className="mt-4 text-sm leading-6 text-slate-700">
                Selfish Inc. d/b/a Rise Forward Foundation works alongside Elevate as a nonprofit community-support partner. Available support is separate from tuition funding and depends on the Foundation's programs, resources, and participant eligibility.
              </p>
              <Link href="/rise-forward-foundation" className="mt-6 inline-flex min-h-11 items-center rounded-xl bg-emerald-800 px-5 py-3 text-sm font-black text-white hover:bg-emerald-900">
                Learn About Rise Forward Foundation
              </Link>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <article className="rounded-2xl border border-emerald-200 bg-white p-5">
                <h3 className="text-sm font-black text-slate-950">Training costs</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">Public or third-party funding must be separately approved by the responsible funder for the participant and program.</p>
              </article>
              <article className="rounded-2xl border border-emerald-200 bg-white p-5">
                <h3 className="text-sm font-black text-slate-950">Wraparound resources</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">Eligible participants may be referred for available community resources, financial-capability support, or other barrier-reduction services.</p>
              </article>
              <article className="rounded-2xl border border-emerald-200 bg-white p-5">
                <h3 className="text-sm font-black text-slate-950">No automatic benefit</h3>
                <p className="mt-2 text-sm leading-6 text-slate-700">Submitting this application does not guarantee a voucher, reimbursement, books, equipment, counseling, or another specific charitable benefit.</p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section id="application-form" className="px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <p className="mb-2 text-xs font-bold uppercase tracking-widest text-brand-red-700">Apply Now</p>
            <h2 className="mb-2 text-2xl font-extrabold text-slate-950 sm:text-3xl">Submit Your Student Application</h2>
            <p className="max-w-2xl text-sm leading-6 text-slate-700">
              Provide complete and accurate information. Admissions will use the contact information you submit to communicate your next required steps. For assistance, call{' '}
              <a
                href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9+]/g, '')}`}
                className="font-bold text-brand-red-700 hover:underline"
              >
                {PLATFORM_DEFAULTS.supportPhone}
              </a>.
            </p>
          </div>
          <ApplyPathGuide variant="student" />
          <StudentApplicationForm initialProgram={initialProgram} />
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-3 text-sm text-slate-600">Applying in another role?</p>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
            <Link href="/apply/employer" className="text-sm font-semibold text-brand-blue-800 hover:underline">
              Employer Partnership
            </Link>
            <Link href="/apply/program-holder" className="text-sm font-semibold text-brand-blue-800 hover:underline">
              Become a Program Holder
            </Link>
            <Link href="/for-providers" className="text-sm font-semibold text-brand-blue-800 hover:underline">
              Training Provider
            </Link>
            <a href={getAdminUrl('/staff-portal')} className="text-sm font-semibold text-brand-blue-800 hover:underline">
              Staff Portal
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
