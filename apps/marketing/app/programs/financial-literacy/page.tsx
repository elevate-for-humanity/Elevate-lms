import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BookOpen, CheckCircle2, ShieldCheck } from 'lucide-react';

import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ProgramStructuredData } from '@/components/seo/CourseStructuredData';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { getVerifiedProgramFunding } from '@/lib/programs/funding-registry';

const PROGRAM = getVerifiedProgramFunding('financial-literacy')!;
const canonical = `${PLATFORM_DEFAULTS.siteUrl}/programs/financial-literacy`;

export const metadata: Metadata = {
  title: 'Financial Literacy Training | Elevate for Humanity',
  description: PROGRAM.description,
  alternates: { canonical },
  openGraph: {
    title: 'Financial Literacy Training | Elevate for Humanity',
    description: PROGRAM.description,
    url: canonical,
    siteName: PLATFORM_DEFAULTS.orgName,
    type: 'website',
  },
};

const topics = [
  'Building a practical budget and spending plan',
  'Banking accounts, fees, and consumer protections',
  'Credit reports, credit scores, and responsible borrowing',
  'Debt-management and repayment strategies',
  'Emergency savings and longer-term financial goals',
  'Taxes, pay statements, benefits, and financial records',
];

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
          funding_eligible: true,
        }}
      />

      <div className="border-b border-slate-100">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <Breadcrumbs
            items={[{ label: 'Programs', href: '/programs' }, { label: PROGRAM.title }]}
          />
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
            Financial Literacy Training
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-200">{PROGRAM.description}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/apply?program=financial-literacy"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-7 py-4 font-extrabold text-white hover:bg-brand-red-700"
            >
              Apply for Training <ArrowRight className="h-5 w-5" />
            </Link>
            <Link
              href="/check-eligibility"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-500 px-7 py-4 font-extrabold text-white hover:border-white"
            >
              Check Eligibility
            </Link>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_0.75fr]">
          <div>
            <div className="flex items-center gap-3">
              <BookOpen className="h-7 w-7 text-brand-red-700" />
              <h2 className="text-3xl font-black text-slate-950">What You’ll Learn</h2>
            </div>
            <ul className="mt-7 grid gap-4 sm:grid-cols-2">
              {topics.map((topic) => (
                <li key={topic} className="flex gap-3 rounded-xl border border-slate-200 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                  <span className="leading-7 text-slate-700">{topic}</span>
                </li>
              ))}
            </ul>
          </div>

          <aside className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
            <ShieldCheck className="h-8 w-8 text-emerald-700" />
            <h2 className="mt-4 text-2xl font-black text-slate-950">
              Workforce-Funding Consideration
            </h2>
            <p className="mt-3 leading-7 text-slate-700">
              Financial Literacy is one of Elevate’s four confirmed workforce-fundable pathways and
              may be considered through WIOA.
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-700">
              Funding is not automatic or guaranteed. WorkOne or the responsible agency determines
              participant eligibility, covered costs, and written authorization before funded
              enrollment.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
