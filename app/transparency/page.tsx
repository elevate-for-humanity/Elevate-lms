export const dynamic = 'force-dynamic';
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, ArrowRight, ExternalLink } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Transparency | ${PLATFORM_DEFAULTS.orgName}`,
  description: 'Our commitment to transparency — outcomes, financials, and impact data.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/transparency',
  },
};

const STATS = [
  { label: 'Programs Available', value: '10+' },
  { label: 'Placement Goal', value: '85%' },
  { label: 'Training Cost', value: '$0*' },
  { label: 'Funding Sources', value: '5+' },
  { label: 'Indiana Locations', value: '3+' },
  { label: 'Learner Support', value: '24/7' },
];

const FINANCIALS = [
  { category: 'Program Delivery', pct: 75, description: 'Training, instruction, and student support' },
  { category: 'Career Services', pct: 15, description: 'Job placement and career counseling' },
  { category: 'Administration', pct: 10, description: 'Operations and overhead' },
];

const ACCREDITATIONS = [
  'WIOA Eligible Training Provider',
  'Indiana Career Connect Partner',
  '501(c)(3) Nonprofit Organization',
  'EPA Section 608 Approved Testing Site',
  'DOL Registered Apprenticeship Sponsor (RAPIDS: 2025-IN-132301)',
  'Indiana DWD Eligible Training Provider (ETPL)',
];

const OUTCOME_TRACKING = [
  'Enrollment and completion rates tracked in real-time',
  'Job placement verified through employer confirmation',
  'Salary data collected at 30, 90, and 180 days post-placement',
  'Long-term retention tracked at 6 and 12 months',
];

const THIRD_PARTY = [
  'Annual independent financial audit',
  'WIOA performance reporting to state agencies',
  'Student satisfaction surveys',
  'Employer feedback collection',
];

export default function TransparencyPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Transparency' }]} />
        </div>
      </div>

      {/* Hero image */}
      <section className="relative h-64 sm:h-80 overflow-hidden">
        {/* IMAGE-CONTRACT: placeholder-review required (blurDataURL or approved fallback) */}
        <Image
          src="/images/pages/transparency-page-1.webp"
          alt={`${PLATFORM_DEFAULTS.orgName} transparency`}
          fill
          className="object-cover"
          priority
          sizes="100vw" placeholder="empty"
        />
        <div className="absolute inset-0 bg-slate-900/60 flex items-end">
          <div className="max-w-4xl mx-auto px-6 pb-10 w-full">
            <p className="text-white/70 text-xs font-bold uppercase tracking-widest mb-2">Accountability</p>
            <h1 className="text-4xl font-extrabold text-white leading-tight">Transparency</h1>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="border-b border-slate-200 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-3 sm:grid-cols-6 divide-x divide-slate-200">
            {STATS.map(({ label, value }) => (
              <div key={label} className="px-4 py-6 text-center">
                <p className="text-2xl font-extrabold text-slate-900">{value}</p>
                <p className="text-xs text-slate-500 mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-center text-xs text-slate-400 pb-3">* For eligible participants through WIOA, WRG, or Job Ready Indy funding</p>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-14 space-y-14">

        {/* How we use funds */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-8">How We Use Funds</h2>
          <div className="space-y-5">
            {FINANCIALS.map(({ category, pct, description }) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-semibold text-slate-900 text-sm">{category}</span>
                    <span className="text-slate-500 text-sm ml-2">— {description}</span>
                  </div>
                  <span className="text-brand-blue-700 font-bold text-sm tabular-nums">{pct}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand-blue-600 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-4">The majority of funds go directly to program delivery and student services.</p>
        </section>

        {/* Accreditations */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Accreditations &amp; Registrations</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {ACCREDITATIONS.map((item) => (
              <div key={item} className="flex items-start gap-3 bg-slate-50 rounded-lg px-4 py-3">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-2 shrink-0" />
                <span className="text-sm text-slate-700">{item}</span>
              </div>
            ))}
          </div>
        </section>

        {/* How we measure success */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">How We Measure Success</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wide">Outcome Tracking</h3>
              <ul className="space-y-3">
                {OUTCOME_TRACKING.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="font-bold text-slate-900 text-sm mb-4 uppercase tracking-wide">Third-Party Verification</h3>
              <ul className="space-y-3">
                {THIRD_PARTY.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-blue-500 mt-2 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-4">
            <Link href="/impact/methodology" className="inline-flex items-center gap-2 text-sm text-brand-blue-600 font-medium hover:underline">
              Read our full impact methodology <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* Annual reports */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Annual Reports</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { year: '2023', desc: 'Complete overview of programs, outcomes, and financials.' },
              { year: '2022', desc: 'Growth and impact in the second year of operations.' },
              { year: 'Form 990', desc: 'IRS Form 990 nonprofit tax return.' },
            ].map(({ year, desc }) => (
              <div key={year} className="border border-slate-200 rounded-xl p-5">
                <FileText className="w-8 h-8 text-brand-blue-600 mb-3" />
                <h3 className="font-semibold text-slate-900 mb-1">{year === 'Form 990' ? year : `${year} Annual Report`}</h3>
                <p className="text-slate-500 text-sm mb-3">{desc}</p>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Available on Request</span>
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* CTA */}
      <section className="bg-slate-900 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-1">Questions About Our Data?</h2>
            <p className="text-slate-400 text-sm">We're happy to provide additional information about our outcomes and operations.</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link href="/contact" className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-100 transition text-sm">
              Contact Us <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/outcomes" className="inline-flex items-center gap-2 px-5 py-2.5 border border-white/20 text-slate-900 font-semibold rounded-lg hover:bg-white/10 transition text-sm">
              Live Outcomes <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
