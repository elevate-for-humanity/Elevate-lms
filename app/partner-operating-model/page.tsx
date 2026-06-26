import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ArrowRight, CheckCircle, Building2, FileText, Users, Shield, BarChart3 } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Partner Operating Model',
  description: `How ${PLATFORM_DEFAULTS.orgName} partners with training providers, employers, workforce agencies, and government entities. Roles, responsibilities, and compliance requirements.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/partner-operating-model' },
};

const partnerTypes = [
  {
    icon: Building2,
    title: 'Training Providers',
    desc: 'Approved training organizations that deliver instruction under Elevate\'s ETPL-listed programs. Must meet curriculum, instructor, and facility standards.',
    requirements: [
      'Signed Training Provider Agreement (MOU)',
      'Instructor credentialing verification',
      'Facility and equipment compliance review',
      'Outcome reporting (completion, placement, wage)',
    ],
    href: '/for-providers',
    cta: 'Become a Training Provider',
  },
  {
    icon: Users,
    title: 'Employers & Apprenticeship Sponsors',
    desc: 'Employers who hire graduates or host registered apprentices. Apprenticeship sponsors must meet DOL RAPIDS requirements.',
    requirements: [
      'Signed Employer Partnership Agreement',
      'DOL RAPIDS registration (apprenticeship sponsors)',
      'Wage and benefit documentation',
      'Apprentice supervision and mentorship plan',
    ],
    href: '/for-employers',
    cta: 'Partner as an Employer',
  },
  {
    icon: FileText,
    title: 'Workforce Agencies',
    desc: 'WorkOne centers, FSSA offices, and other workforce agencies that refer participants and co-fund training through WIOA, WRG, or .',
    requirements: [
      'Signed Memorandum of Understanding (MOU)',
      'Participant referral and eligibility documentation',
      'Co-enrollment and data sharing agreement',
      'Quarterly outcome reporting',
    ],
    href: '/for-agencies',
    cta: 'Partner as an Agency',
  },
  {
    icon: Shield,
    title: 'Government & Compliance Partners',
    desc: 'State agencies, DOL, and oversight bodies that monitor ETPL compliance, WIOA performance, and apprenticeship standards.',
    requirements: [
      'ETPL application and annual renewal',
      'WIOA performance metric reporting',
      'DOL apprenticeship program registration',
      'Audit access and records retention',
    ],
    href: '/federal-compliance',
    cta: 'View Compliance Info',
  },
];

const principles = [
  { title: 'Participant-First', desc: 'Every partnership decision is evaluated against its impact on participant outcomes — completion, certification, and employment.' },
  { title: 'Compliance by Default', desc: 'WIOA, DOL, ETPL, and FSSA requirements are built into every operating agreement. Partners are not responsible for navigating compliance alone.' },
  { title: 'Shared Accountability', desc: 'Outcome data is shared with all partners. Elevate publishes completion, certification, and placement rates publicly.' },
  { title: 'Transparent Financials', desc: 'Funding flows, ITA amounts, and employer contributions are documented and available to authorized partners.' },
];

export default function PartnerOperatingModelPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner Operating Model' }]} />
        </div>
      </div>

      {/* Hero */}
      <section className="bg-slate-900 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-brand-green-400 text-xs font-bold uppercase tracking-widest mb-3">Partner Operating Model</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white mb-5">
            How Elevate Works With Partners
          </h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto mb-8">
            Elevate operates as a workforce intermediary — connecting training providers, employers, workforce agencies, and government entities into a single compliance-ready system.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/partners" className="bg-brand-green-600 hover:bg-brand-green-700 text-white font-bold px-8 py-3.5 rounded-lg transition-colors text-sm">
              Become a Partner
            </Link>
            <Link href="/contact" className="border-2 border-white/40 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Operating Principles */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-green-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Principles</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Operating Principles</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {principles.map((p) => (
              <div key={p.title} className="flex gap-4 p-6 rounded-2xl border border-slate-200">
                <CheckCircle className="w-6 h-6 text-brand-green-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-900 text-sm mb-1">{p.title}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{p.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types */}
      <section className="py-16 px-6 bg-slate-50 border-t border-slate-100">
        <div className="max-w-5xl mx-auto">
          <p className="text-brand-green-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Partner Types</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-10">Partner Roles & Requirements</h2>
          <div className="grid sm:grid-cols-2 gap-8">
            {partnerTypes.map(({ icon: Icon, title, desc, requirements, href, cta }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-green-50 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-brand-green-600" />
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-base">{title}</h3>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{desc}</p>
                <ul className="space-y-2 mb-5">
                  {requirements.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-xs text-slate-700">
                      <CheckCircle className="w-4 h-4 text-brand-green-500 shrink-0 mt-0.5" />
                      {r}
                    </li>
                  ))}
                </ul>
                <Link href={href} className="inline-flex items-center gap-1.5 text-brand-green-700 font-bold text-xs hover:underline">
                  {cta} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data & Reporting */}
      <section className="py-16 px-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto">
          <p className="text-brand-green-600 text-xs font-bold uppercase tracking-widest text-center mb-2">Reporting</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 text-center mb-4">Shared Data & Outcomes</h2>
          <p className="text-slate-600 text-sm text-center max-w-xl mx-auto mb-10">
            All partners receive access to outcome data relevant to their role. Elevate publishes aggregate performance metrics publicly.
          </p>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { icon: BarChart3, title: 'Completion Rates', desc: 'Program completion rates by cohort, funding source, and partner.' },
              { icon: Shield, title: 'Certification Pass Rates', desc: 'First-attempt and overall pass rates by certifying body and program.' },
              { icon: Users, title: 'Employment Placement', desc: '90-day and 1-year employment and wage outcomes for program graduates.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-slate-200 p-6 text-center">
                <Icon className="w-8 h-8 text-brand-green-600 mx-auto mb-3" />
                <p className="font-extrabold text-slate-900 text-base mb-2">{title}</p>
                <p className="text-xs text-slate-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-green-700 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white mb-4">Ready to Partner with Elevate?</h2>
          <p className="text-brand-green-100 text-sm mb-8">
            Review the operating model and contact us to begin the partnership agreement process.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/partners" className="bg-white text-brand-green-700 font-bold px-8 py-3.5 rounded-lg hover:bg-brand-green-50 transition-colors text-sm">
              Become a Partner
            </Link>
            <Link href="/contact" className="border-2 border-white/40 text-slate-900 font-bold px-8 py-3.5 rounded-lg hover:bg-white/10 transition-colors text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
