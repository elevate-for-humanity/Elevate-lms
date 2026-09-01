import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, ShieldCheck } from 'lucide-react';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { TEAM } from '@/data/team';

const PROGRAM = {
  slug: 'financial-literacy',
  title: 'Elevate Financial Empowerment Program',
  description:
    'A practical financial literacy course that helps participants take control of their finances and build a stronger financial future.',
  category: 'business',
} as const;

const canonical = `${PLATFORM_DEFAULTS.siteUrl}/programs/financial-literacy`;

export const metadata: Metadata = {
  title: 'Elevate Financial Empowerment Program | Elevate for Humanity',
  description: PROGRAM.description,
  alternates: { canonical },
  openGraph: {
    title: 'Elevate Financial Empowerment Program | Elevate for Humanity',
    description: PROGRAM.description,
    url: canonical,
    siteName: PLATFORM_DEFAULTS.orgName,
    type: 'website',
  },
};

const topics = [
  'Budgeting and personalized spending plans',
  'Banking, account selection, fees, and financial services',
  'Saving, emergency funds, and financial goal setting',
  'Credit reports, credit scores, and responsible borrowing',
  'Debt management and practical repayment strategies',
  'Consumer rights, fraud prevention, and financial protection',
  'Taxes, pay statements, benefits, and financial records',
  'Insurance fundamentals and managing financial risk',
  'Basic investing and understanding how money can grow',
  'Long-term wealth building and financial wellness planning',
];

const instructor = TEAM.find((member) => member.name === 'Dr. Carlina Wilkes');

export default function FinancialLiteracyPage() {
  return (
    <main className="min-h-screen bg-white">
      <ProgramStructuredData
        program={{
          id: PROGRAM.slug,
          name: PROGRAM.title,
          slug: PROGRAM.slug,
          description: PROGRAM.description,
          category: PROGRAM.category,
          funding_eligible: false,
        }}
      />

      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Programs', href: '/programs' }, { label: PROGRAM.title }]} />
        </div>
      </div>

      <section className="relative overflow-hidden bg-slate-950 px-4 py-16 text-white sm:py-20">
        <Image
          src="/images/business/office-admin.webp"
          alt="Financial literacy and business skills training"
          fill
          priority
          className="object-cover opacity-20"
          sizes="100vw"
        />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-sm font-extrabold uppercase tracking-widest text-orange-300">
            Business & Financial Skills
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-6xl">
            Elevate Financial Empowerment Program
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">{PROGRAM.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/apply/student?program=financial-literacy"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-4 font-extrabold text-white hover:bg-brand-red-700"
            >
              Apply for Training <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-500 px-7 py-4 font-extrabold text-white hover:border-white"
            >
              Ask About Tuition
            </Link>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-slate-50 px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-extrabold uppercase tracking-widest text-brand-red-700">
            Learn it. Plan it. Apply it. Build your future.
          </p>
          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Practical knowledge for lasting financial wellness
          </h2>
          <div className="mt-6 max-w-4xl space-y-5 text-lg leading-8 text-slate-700">
            <p>
              The Elevate Financial Empowerment Program is a practical financial literacy course
              designed to help participants take control of their finances and build a stronger
              financial future. Participants learn essential skills in budgeting, banking, saving,
              credit and credit scores, debt management, consumer protection, taxes, insurance,
              basic investing, and long-term wealth building.
            </p>
            <p>
              Through hands-on activities, participants develop personalized financial goals and
              practical strategies they can apply immediately. The course emphasizes not only
              understanding money, but learning how to manage it, protect it, save it, and grow it.
            </p>
            <p>
              Participants leave with a clearer understanding of their financial position and a
              personalized plan for moving toward financial stability, independence, and long-term
              financial wellness.
            </p>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-brand-red-700" aria-hidden="true" />
              <h2 className="text-3xl font-black text-slate-950">What You’ll Learn</h2>
            </div>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              {topics.map((topic) => (
                <li key={topic} className="flex gap-3 rounded-xl border border-slate-200 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
                  <span className="leading-7 text-slate-700">{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <ShieldCheck className="h-8 w-8 text-slate-700" aria-hidden="true" />
            <h2 className="mt-4 text-2xl font-black text-slate-950">Current funding disclosure</h2>
            <p className="mt-3 leading-7 text-slate-700">
              Elevate is not publishing Financial Literacy as a verified WIOA or Workforce Ready
              Grant program in its current public funding registry.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Treat this as a self-pay program unless a responsible agency provides written,
              program-specific authorization that applies to your enrollment.
            </p>
          </aside>
        </div>
      </section>

      {instructor && (
        <section className="border-t border-slate-200 bg-slate-950 px-4 py-14 text-white sm:py-16">
          <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.55fr_1fr] lg:items-center">
            <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-3xl border border-white/15 shadow-2xl">
              <Image
                src={instructor.headshotSrc || '/images/carlina-wilkes.jpg'}
                alt="Dr. Carlina Wilkes, Financial Empowerment Program Instructor"
                fill
                className="object-cover object-top"
                sizes="(max-width: 1024px) 100vw, 36vw"
              />
            </div>
            <div>
              <p className="text-sm font-extrabold uppercase tracking-widest text-orange-300">
                Meet Your Instructor
              </p>
              <h2 className="mt-3 text-3xl font-black sm:text-4xl">Dr. Carlina Wilkes</h2>
              <p className="mt-2 text-xl font-bold text-white">
                Financial Empowerment Program Instructor
              </p>
              <p className="mt-1 text-base font-semibold text-slate-300">
                Executive Director of Financial Operations &amp; Organizational Compliance
              </p>
              <p className="mt-6 text-lg leading-8 text-slate-200">{instructor.bio}</p>
              <Link
                href="/about/team/carlina-wilkes"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-extrabold text-slate-950 hover:bg-slate-100"
              >
                Read Dr. Wilkes&apos;s Bio <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
