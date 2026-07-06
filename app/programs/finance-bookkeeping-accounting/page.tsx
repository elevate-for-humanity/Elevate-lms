export const dynamic = 'force-dynamic';
import type { Metadata } from 'next';
import Link from 'next/link';
import FundingInfoBlock from '@/components/programs/FundingInfoBlock';
import { CleanPageHero } from '@/components/programs/CleanPageHero';

export const metadata: Metadata = {
  title: 'Finance, Bookkeeping & Accounting Credential Pathway | ETPL Approved | Indianapolis',
  description:
    'Tiered credential pathway in tax preparation, bookkeeping, payroll, and accounting. IRS PTIN, QuickBooks Certified User, WorkKeys NCRC, and Enrolled Agent preparation. Funded for eligible participants.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/programs/finance-bookkeeping-accounting' },
};

const CREDENTIALS = [
  { name: 'IRS PTIN', issuer: 'Internal Revenue Service', description: 'Required by law to prepare federal tax returns for compensation.' },
  { name: 'QuickBooks Certified User', issuer: 'Certiport / Pearson VUE', description: 'Proctored on-site. Validates proficiency in QuickBooks Online accounting software.' },
  { name: 'ACT WorkKeys / NCRC', issuer: 'ACT, Inc.', description: 'Workforce readiness validation — applied math, workplace documents, business writing.' },
  { name: 'AFSP (Annual Filing Season Program)', issuer: 'Internal Revenue Service', description: 'Voluntary IRS program demonstrating continuing education compliance.' },
  { name: 'IRS VITA Tax Law Certification', issuer: 'IRS VITA Program', description: 'Tax law competency validation under the Volunteer Income Tax Assistance Program.' },
  { name: 'Enrolled Agent Prep (Advanced)', issuer: 'IRS (SEE Exam)', description: 'Prepares for the Special Enrollment Examination to represent taxpayers before the IRS.' },
];

const FAQS = [
  { question: 'How long is the program?', answer: 'The pathway has three tiers. Tier 1 (Tax Preparer) is 6–10 weeks. Tier 2 (Bookkeeper) is 5–10 weeks. Tier 3 (Enrolled Agent Prep) is self-paced. You can complete one tier or all three.' },
  { question: 'Is this program WIOA-funded?', answer: 'Yes. This pathway is ETPL-approved (Program ID #10004627) and eligible for WIOA Individual Training Accounts and Workforce Ready Grant funding. Contact your local WorkOne office to apply.' },
  { question: 'Do I need accounting experience?', answer: 'No. Tier 1 starts from the fundamentals. Each tier builds on the previous one. Prior experience is not required for entry.' },
  { question: 'Where are exams proctored?', answer: 'Certiport (QuickBooks) and ACT WorkKeys exams are proctored on-site at Elevate. IRS exams are administered per IRS guidelines.' },
  { question: 'What jobs can I get after Tier 1?', answer: 'Seasonal tax preparation positions, bookkeeping assistant roles, and administrative accounting support. Many graduates work during tax season while completing Tier 2.' },
];

export default function FinanceBookkeepingAccountingPage() {
  return (
    <main className="min-h-screen bg-white">
      <CleanPageHero
        src="/images/pages/finance-accounting.webp"
        alt="Finance and accounting credential pathway"
        title="Finance, Bookkeeping & Accounting"
        subtitle="Tiered credential pathway. Tax preparation, bookkeeping, payroll, and accounting. ETPL approved."
        priority
      />

      {/* Stats Strip */}
      <section className="bg-slate-900 py-6 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <p className="text-2xl font-bold text-white">6–20 Weeks</p>
            <p className="text-slate-400 text-sm">Duration</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">15–20</p>
            <p className="text-slate-400 text-sm">Hours / Week</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">Hybrid</p>
            <p className="text-slate-400 text-sm">Delivery</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">6</p>
            <p className="text-slate-400 text-sm">Credentials</p>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Program Overview</h2>
          <p className="text-slate-700 text-base leading-relaxed mb-3">
            A tiered credential pathway preparing participants for entry-level and growth-track roles in tax preparation, bookkeeping, payroll support, and small business financial services. All credentials are issued by their respective certifying bodies — not by Elevate.
          </p>
          <p className="text-slate-700 text-base leading-relaxed">
            Three tiers take you from seasonal tax preparer (Tier 1) to full-charge bookkeeper (Tier 2) to Enrolled Agent preparation (Tier 3). WIOA and Workforce Ready Grant funding available for eligible participants. Exams are proctored on-site at our authorized testing center.
          </p>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How It Works</h2>
          <ol className="space-y-6">
            {[
              { step: 1, title: 'Apply', desc: 'Submit your application. No prior accounting experience required for Tier 1.' },
              { step: 2, title: 'Enroll', desc: 'Confirm WIOA/WRG funding eligibility (ETPL #10004627) or choose self-pay.' },
              { step: 3, title: 'Train', desc: 'Classroom instruction, IRS certification prep, QuickBooks labs, and applied bookkeeping. Exams proctored on-site.' },
              { step: 4, title: 'Credential', desc: 'Earn IRS PTIN, QuickBooks Certified User, WorkKeys NCRC, and additional tier-specific credentials.' },
              { step: 5, title: 'Employment', desc: 'Transition to tax preparation positions, bookkeeping roles, or paid internships at partner firms.' },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex-shrink-0 w-8 h-8 bg-brand-red-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {item.step}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-slate-600 text-sm mt-0.5">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Credentials */}
      <section className="py-14 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Credentials You Earn</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {CREDENTIALS.map((cred) => (
              <div key={cred.name} className="rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 text-sm mb-1">{cred.name}</h3>
                <p className="text-xs text-brand-blue-600 font-medium mb-2">{cred.issuer}</p>
                <p className="text-sm text-slate-600">{cred.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funding & Payment */}
      <section className="py-14 px-6 bg-slate-50 border-y border-slate-100">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Funding &amp; Payment</h2>
          <FundingInfoBlock
            programName="Finance, Bookkeeping & Accounting"
            fundingSources={['WIOA', 'Workforce Ready Grant']}
            selfPayPrice={1800}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6 bg-slate-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Start this credential pathway today.
          </h2>
          <p className="text-slate-300 text-base mb-8 max-w-xl mx-auto">
            ETPL-approved. WIOA-funded for eligible participants. Exams proctored on-site.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/apply?program=finance-bookkeeping-accounting"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-bold px-8 py-3.5 rounded-xl transition-colors"
            >
              Apply Now
            </Link>
            <a
              href="https://www.indianacareerconnect.com"
              target="_blank"
              rel="noopener noreferrer"
              className="border border-slate-600 text-white font-bold px-8 py-3.5 rounded-xl hover:bg-slate-800 transition-colors"
            >
              Check Eligibility
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Frequently Asked Questions</h2>
          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details key={faq.question} className="group rounded-xl border border-slate-200 overflow-hidden">
                <summary className="cursor-pointer px-5 py-4 font-semibold text-slate-900 text-sm flex items-center justify-between">
                  {faq.question}
                  <span className="text-slate-400 group-open:rotate-45 transition-transform text-lg">+</span>
                </summary>
                <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                  {faq.answer}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
