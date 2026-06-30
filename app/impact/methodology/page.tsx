export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Database, FileCheck, AlertTriangle, RefreshCw } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Impact Methodology | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    `How ${PLATFORM_DEFAULTS.orgName} defines, measures, and reports workforce outcomes — enrollment, completion, credential attainment, and employment placement.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/impact/methodology' },
};

const METRICS = [
  {
    term: 'Enrollment',
    definition:
      'A learner is counted as enrolled when their program_enrollments row reaches status active or later. Learners who apply but do not start are excluded.',
    sourceLabel: 'DB · program_enrollments',
  },
  {
    term: 'Completion',
    definition:
      'A learner is counted as completing when all required module checkpoints are passed and all required lab submissions are instructor-approved. Lesson views alone do not count.',
    sourceLabel: 'DB · program_enrollments (status = completed)',
  },
  {
    term: 'Credential Attainment',
    definition:
      'A credential is counted when a program_completion_certificates row is issued. This requires passing the final exam and all module checkpoints. Certificates are issued automatically upon meeting all requirements.',
    sourceLabel: 'DB · program_completion_certificates',
  },
  {
    term: 'Employment Placement',
    definition:
      'A graduate is counted as placed when they report employment in their trained field within 90 days of credential issuance. Data is collected via follow-up survey. Self-reported — not independently verified unless employer confirmation is obtained.',
    sourceLabel: 'Survey · employment_outcomes',
  },
];

const FORMULAS = [
  {
    label: 'Completion Rate',
    formula: 'Completions ÷ (Enrollments − Early Withdrawals within 14 days) × 100',
    note: 'Early withdrawals within 14 days are excluded per WIOA reporting standards.',
  },
  {
    label: 'Placement Rate',
    formula: 'Graduates Employed within 90 days ÷ (Total Graduates − Exclusions) × 100',
    note: 'Exclusions: graduates continuing education, entering military service, or otherwise unavailable.',
  },
  {
    label: 'Credential Rate',
    formula: 'Credentials Issued ÷ Program Completions × 100',
    note: 'Counts only credentials issued through the LMS certification chain.',
  },
];

const PRINCIPLES = [
  'Outcomes are counted at the individual learner level — not seat-hours or page views.',
  'Completion requires passing all checkpoints, not just finishing lessons.',
  'Credential data is sourced directly from the LMS database, not self-reported.',
  'Employment data is self-reported and may undercount actual placement rates.',
  'Figures are updated hourly from live program data.',
  'Historical figures are not restated when methodology changes — changes are versioned.',
];

export default function ImpactMethodologyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Impact', href: '/impact' },
            { label: 'Methodology' },
          ]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 text-white py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-red-400 text-xs font-bold uppercase tracking-widest mb-3">
            Transparency &amp; Accountability
          </p>
          <h1 className="text-4xl font-extrabold mb-4 leading-tight">Impact Methodology</h1>
          <p className="text-slate-300 text-lg max-w-2xl leading-relaxed">
            How we define, measure, and report workforce outcomes across all {PLATFORM_DEFAULTS.orgName} programs.
          </p>
        </div>
      </section>

      {/* Commitment banner */}
      <section className="border-b border-slate-200 bg-slate-50 py-6 px-4">
        <div className="max-w-4xl mx-auto flex items-start gap-4">
          <FileCheck className="w-6 h-6 text-brand-blue-600 shrink-0 mt-0.5" />
          <p className="text-slate-700 text-sm leading-relaxed">
            {PLATFORM_DEFAULTS.orgName} publishes this methodology so that students, funders, workforce boards, and auditors can independently verify how our reported numbers are calculated. Every metric on our{' '}
            <Link href="/outcomes" className="text-brand-blue-600 underline font-medium">Outcomes page</Link>{' '}
            maps directly to a definition below.
          </p>
        </div>
      </section>

      {/* Metric definitions */}
      <section className="py-14 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Metric Definitions</h2>
          <p className="text-slate-500 text-sm mb-8">Each metric has a single, unambiguous definition tied to a specific database source.</p>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
            {METRICS.map(({ term, definition, sourceLabel }) => (
              <div key={term} className="grid md:grid-cols-[200px_1fr]">
                <div className="bg-slate-50 px-6 py-5 md:border-r border-slate-200">
                  <p className="font-bold text-slate-900 text-sm">{term}</p>
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-slate-400 font-mono">
                    <Database className="w-3 h-3" /> {sourceLabel}
                  </span>
                </div>
                <div className="px-6 py-5">
                  <p className="text-slate-700 text-sm leading-relaxed">{definition}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulas */}
      <section className="py-14 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Calculation Formulas</h2>
          <p className="text-slate-500 text-sm mb-8">Exact formulas used to compute published rates.</p>

          <div className="space-y-4">
            {FORMULAS.map(({ label, formula, note }) => (
              <div key={label} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100">
                  <p className="font-bold text-slate-900 text-sm">{label}</p>
                </div>
                <div className="px-6 py-4">
                  <div className="bg-slate-900 rounded-lg px-4 py-3 mb-3">
                    <p className="font-mono text-sm text-brand-green-400">{formula}</p>
                  </div>
                  <p className="text-xs text-slate-500">{note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Counting principles */}
      <section className="py-14 px-4 border-t border-slate-200">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">Counting Principles</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {PRINCIPLES.map((p) => (
              <div key={p} className="flex items-start gap-3 bg-slate-50 rounded-lg px-4 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 mt-2 shrink-0" />
                <p className="text-slate-700 text-sm leading-relaxed">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limitations */}
      <section className="py-14 px-4 bg-amber-50 border-t border-amber-200">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <h2 className="text-xl font-bold text-amber-900">Known Limitations</h2>
          </div>
          <ul className="space-y-3 text-amber-800 text-sm">
            <li className="flex items-start gap-2"><span className="font-bold shrink-0">•</span> Employment data is self-reported via follow-up survey. Response rates vary and non-respondents are excluded from the denominator, which may inflate placement rates.</li>
            <li className="flex items-start gap-2"><span className="font-bold shrink-0">•</span> Outcomes vary by program, cohort, and local labor market conditions. Aggregate figures should not be applied to individual programs without program-level breakdowns.</li>
            <li className="flex items-start gap-2"><span className="font-bold shrink-0">•</span> Published statistics reflect historical performance and do not guarantee future results.</li>
          </ul>
        </div>
      </section>

      {/* Data sources */}
      <section className="py-14 px-4 border-t border-slate-200">
        <div className="max-w-4xl mx-auto flex items-start gap-4">
          <RefreshCw className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Data Sources &amp; Refresh</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Enrollment, completion, and credential figures are pulled directly from the Elevate LMS database (Supabase) and refreshed hourly. Employment placement figures are collected via a 90-day follow-up survey sent to all credential holders and compiled quarterly.
            </p>
          </div>
        </div>
      </section>

      {/* Footer nav */}
      <section className="py-10 bg-slate-900 text-white px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/impact" className="inline-flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Impact
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/outcomes" className="inline-flex items-center gap-2 text-sm text-white font-semibold hover:text-brand-red-400 transition-colors">
              View Live Outcomes <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="text-sm text-slate-400 hover:text-white transition-colors">
              Questions? Contact us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
