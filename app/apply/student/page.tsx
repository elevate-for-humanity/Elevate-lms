import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import ApplyPathGuide from '@/components/apply/ApplyPathGuide';
import StudentApplicationForm from './StudentApplicationForm';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { resolveSlug } from '@/lib/program-registry';
import { getProgramBySlug } from '@/data/programs/catalog';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { hero as heroTokens } from '@/lib/page-design-tokens';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'Apply for Career Training',
  description:
    'Apply for workforce training in healthcare, skilled trades, CDL, barbering, and technology. Funding may be available for eligible Indiana residents through WIOA and state grants.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/apply/student',
  },
  openGraph: {
    title: 'Apply for Career Training',
    description:
      'Apply for workforce training and career development programs. Funding may be available for eligible participants. Most students begin training within 2–4 weeks.',
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
  twitter: {
    card: 'summary_large_image',
    title: 'Apply for Career Training',
    description: 'Apply for workforce training programs. Most students begin within 2–4 weeks.',
    images: ['/images/pages/comp-home-highlight-health.webp'],
  },
};

// Featured program slugs — order controls display sequence.
// Add a slug here to feature it; remove to unfeature. Data comes from data/programs/catalog.ts.
const FEATURED_SLUGS = [
  'cna',
  'medical-assistant',
  'hvac-technician',
  'cdl-training',
  'barber-apprenticeship',
  'phlebotomy',
  'it-help-desk',
  'bookkeeping',
];

const PROGRAMS = FEATURED_SLUGS.flatMap((slug) => {
  const p = getProgramBySlug(slug);
  if (!p) return [];
  return [{
    title: p.title,
    duration: p.durationWeeks ? `${p.durationWeeks} weeks` : 'Varies',
    credential: p.credentials?.[0]?.name ?? p.credentialIssued ?? '',
    href: `/programs/${p.slug}`,
    image: p.heroImage,
  }];
});

const STEPS = [
  {
    n: '1',
    title: 'Submit This Application',
    desc: 'Takes about 5 minutes. Tell us your goals and which program interests you.',
  },
  {
    n: '2',
    title: 'Attend Orientation',
    desc: 'A short session where we walk through programs, funding options, and next steps.',
  },
  {
    n: '3',
    title: 'Funding Determination',
    desc: 'We connect you with WorkOne or FSSA to check WIOA, WRG, and other funding eligibility.',
  },
  {
    n: '4',
    title: 'Enroll & Start Training',
    desc: 'Once funding is confirmed, you get placed in a cohort. Most students start within 2–4 weeks.',
  },
  {
    n: '5',
    title: 'Earn Your Credential',
    desc: 'Complete training, pass your certification exam, and receive your industry credential.',
  },
  {
    n: '6',
    title: 'Get Placed in a Job',
    desc: 'Career services connects you with employer partners actively hiring in your field.',
  },
];

const TRUST = [
  { stat: '$0', label: 'Cost for most eligible students' },
  { stat: '2–4 wks', label: 'Average time from apply to start' },
  { stat: '90%+', label: 'Credential pass rate' },
  { stat: '6 fields', label: 'Healthcare, trades, CDL, tech, and more' },
];

const FUNDING = [
  {
    label: 'WIOA',
    desc: 'Federal funding for adults, dislocated workers, and youth. Covers tuition, books, and support services.',
  },
  {
    label: 'Workforce Ready Grant',
    desc: 'Indiana state grant for high-demand certificate programs. No repayment required.',
  },
  {
    label: 'FSSA IMPACT',
    desc: 'For SNAP and TANF recipients. Covers training and wraparound support services.',
  },
  {
    label: 'Job Ready Indy',
    desc: 'For justice-involved individuals. Covers training and support services.',
  },
  {
    label: 'Self-Pay / BNPL',
    desc: 'Flexible payment plans for students who do not qualify for grant funding.',
  },
];

export default async function StudentApplicationPage({
  searchParams,
}: {
  searchParams: Promise<{ program?: string }>;
}) {
  const params = await searchParams;
  const initialProgram = resolveSlug(params?.program || '') || '';

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className={heroTokens.imageWrap}>
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/apply-page-4.jpg"
          alt={`Apply for career training — ${PLATFORM_DEFAULTS.orgName}`}
          fill
          sizes="100vw"
          className="object-cover"
          priority placeholder="empty"
        />
      </div>

      {/* Breadcrumbs */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Apply', href: '/apply' }, { label: 'Student' }]} />
        </div>
      </div>

      {/* Page identity */}
      <section className="border-b border-slate-100 py-10 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
            Student Application — Indianapolis, Indiana
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-3">
            Start Your Career Journey
          </h1>
          <p className="text-slate-600 text-base sm:text-lg max-w-2xl leading-relaxed mb-6">
            Apply in minutes. We match you with the right program and help you access WIOA, WRG,
            and other funding sources — most eligible students pay nothing out of pocket.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="#application-form"
              className="bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Apply Now
            </a>
            <Link
              href="/wioa-eligibility"
              className="border-2 border-slate-300 hover:border-brand-blue-400 text-slate-700 font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              Check Funding Eligibility
            </Link>
          </div>
        </div>
      </section>

      {/* Trust stats */}
      <section className="bg-slate-900 py-10 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
          {TRUST.map((t) => (
            <div key={t.stat} className="text-center">
              <p className="text-3xl font-extrabold text-white mb-1">{t.stat}</p>
              <p className="text-slate-400 text-xs leading-snug">{t.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Programs */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-6xl mx-auto">
          <div className="mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Available Programs
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Choose Your Career Path
            </h2>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              Every program leads to a nationally or state-recognized credential. Most are available
              at no cost through WIOA or state funding.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PROGRAMS.map((p) => (
              <Link
                key={p.title}
                href={p.href}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
              >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-500" placeholder="empty"
                  />
                  <span className="absolute top-2 right-2 bg-brand-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Funding May Apply
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 mb-0.5">
                    <span className="font-semibold text-slate-700">Duration:</span> {p.duration}
                  </p>
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">Credential:</span> {p.credential}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link
              href="/programs"
              className="inline-block border-2 border-slate-300 hover:border-brand-red-400 text-slate-700 font-bold px-7 py-3 rounded-xl transition-colors text-sm"
            >
              View All Programs →
            </Link>
          </div>
        </div>
      </section>

      {/* What happens after you apply */}
      <section className="py-14 px-4 bg-slate-50 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="mb-10 text-center">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              The Process
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              What Happens After You Apply
            </h2>
            <p className="text-slate-600 text-sm mt-2 max-w-xl mx-auto">
              From application to job placement — here is every step.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="bg-white rounded-2xl border border-slate-200 p-6">
                <div className="w-9 h-9 rounded-full bg-brand-red-600 text-white text-sm font-extrabold flex items-center justify-center mb-4">
                  {s.n}
                </div>
                <h3 className="font-bold text-slate-900 text-sm mb-2">{s.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding sources */}
      <section className="py-14 px-4 border-b border-slate-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-10 items-start">
            <div>
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
                Funding & Cost
              </p>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-4">
                Most students pay $0.
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-4">
                Federal and state funding covers tuition, books, and certification exam fees for
                eligible Indiana residents. Eligibility is determined through WorkOne — not Elevate.
              </p>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                If you receive SNAP, TANF, or other FSSA benefits, you may qualify for FSSA IMPACT
                funding. Justice-involved individuals may qualify for Job Ready Indy.
              </p>
              <Link
                href="/funding"
                className="inline-block bg-brand-red-600 hover:bg-brand-red-700 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Explore Funding Options
              </Link>
            </div>
            <div className="space-y-3">
              {FUNDING.map((f) => (
                <div key={f.label} className="bg-slate-50 rounded-xl border border-slate-200 p-4">
                  <p className="font-bold text-slate-900 text-sm mb-1">{f.label}</p>
                  <p className="text-slate-600 text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="application-form" className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">
              Apply Now
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Submit Your Application
            </h2>
            <p className="text-slate-600 text-sm max-w-xl leading-relaxed">
              Takes about 5 minutes. We will follow up within one business day to schedule your
              orientation. Call us at{' '}
              <a
                href={`tel:${PLATFORM_DEFAULTS.supportPhone.replace(/[^0-9]/g, "")}`}
                className="text-brand-red-600 font-semibold hover:underline"
              >
                {PLATFORM_DEFAULTS.supportPhone}
              </a>{' '}
              if you have questions.
            </p>
          </div>
          <ApplyPathGuide variant="student" />
          <StudentApplicationForm initialProgram={initialProgram} />
        </div>
      </section>

      {/* Other application types */}
      <section className="border-t border-slate-200 bg-slate-50 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-slate-500 text-sm mb-3">Not a student?</p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              href="/apply/employer"
              className="text-brand-blue-600 hover:underline font-semibold text-sm"
            >
              Employer Partnership
            </Link>
            <Link
              href="/apply/program-holder"
              className="text-brand-blue-600 hover:underline font-semibold text-sm"
            >
              Become a Program Holder
            </Link>
            <Link
              href="/for-providers"
              className="text-brand-blue-600 hover:underline font-semibold text-sm"
            >
              Training Provider
            </Link>
            <Link
              href="/onboarding/staff"
              className="text-brand-blue-600 hover:underline font-semibold text-sm"
            >
              Staff Application
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
