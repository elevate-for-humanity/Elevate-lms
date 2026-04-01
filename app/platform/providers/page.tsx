import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Award, CheckCircle, Shield, FileText, Users, AlertTriangle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Provider Requirements | Elevate Workforce Hub',
  description:
    'Requirements and governance controls for organizations delivering training programs inside the Elevate Workforce Development Hub.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform/providers',
  },
};

const eligibilityRequirements = [
  'Registered legal entity (LLC, nonprofit, corporation, or government agency) in good standing',
  'Demonstrated experience delivering workforce training or occupational education',
  'Capacity to serve the target population — including barriered individuals where applicable',
  'No active debarment from federal or state workforce funding programs',
  'Designated point of contact for compliance and program management',
  'Willingness to execute a Memorandum of Understanding (MOU) with Elevate',
];

const programRequirements = [
  {
    title: 'Credential Authority',
    desc: 'Every program must identify the issuing credential authority before activation. Elevate does not issue credentials it does not legally control. Acceptable authorities include EPA, PTCB, CompTIA, NCCER, Indiana SDOH, ACT WorkKeys, OSHA Training Institute, and equivalent bodies.',
  },
  {
    title: 'Learning Pathway',
    desc: 'Programs must define a structured learning pathway: objectives, instructional hours, assessment methods, and the specific credential or competency outcome. Pathways are reviewed by Elevate before the program is listed.',
  },
  {
    title: 'Curriculum Standards',
    desc: 'Curriculum must align with the credential authority\'s published standards or, where no authority exists, with recognized industry competency frameworks. Elevate reserves the right to request curriculum documentation during review.',
  },
  {
    title: 'Instructor Qualifications',
    desc: 'Instructors must hold the credential they are teaching toward, or demonstrate equivalent industry experience. Instructor credentials are verified during program approval and must remain current.',
  },
  {
    title: 'Compliance Documentation',
    desc: 'Programs operating under WIOA, Workforce Ready Grant, Job Ready Indy, or DOL Registered Apprenticeship funding must maintain documentation required by those programs. Elevate provides templates and reporting infrastructure; providers are responsible for accuracy.',
  },
];

const onboardingSteps = [
  {
    step: '1',
    title: 'Submit Provider Application',
    desc: 'Complete the provider application with organizational information, program descriptions, credential authority relationships, and instructor qualifications.',
  },
  {
    step: '2',
    title: 'Verification Review',
    desc: 'Elevate reviews legal standing, experience, and capacity. This typically takes 5–10 business days. You may be asked for supporting documentation.',
  },
  {
    step: '3',
    title: 'Program Approval',
    desc: 'Each program is reviewed individually against curriculum, credential, and compliance standards. Programs are approved or returned with specific feedback.',
  },
  {
    step: '4',
    title: 'MOU Execution',
    desc: 'Approved providers execute a Memorandum of Understanding that defines roles, responsibilities, data handling, and compliance obligations.',
  },
  {
    step: '5',
    title: 'Platform Onboarding',
    desc: 'Provider account is activated. Staff receive role-based access. Programs are listed in the hub. Learner enrollment can begin.',
  },
  {
    step: '6',
    title: 'Ongoing Performance Review',
    desc: 'Active programs are reviewed quarterly on enrollment, completion, credential attainment, and employment outcomes. Programs that fall below minimum thresholds are placed on a performance improvement plan.',
  },
];

const credentialSeparationRules = [
  'Elevate stores credential records and verification links — it does not issue credentials it does not legally control.',
  'Each program page must clearly identify the issuing credential authority by name.',
  'Marketing materials may not imply Elevate issues third-party certifications.',
  'Credential verification links must point to the issuing authority\'s official verification system.',
  'Providers may not represent a credential as "Elevate-issued" unless Elevate is the legal issuing authority.',
];

const performanceThresholds = [
  { metric: 'Program completion rate', minimum: '70%' },
  { metric: 'Credential attainment rate (of completers)', minimum: '80%' },
  { metric: 'Employment or advancement within 6 months', minimum: '65%' },
  { metric: 'Learner satisfaction (post-program survey)', minimum: '3.5 / 5.0' },
];

export default function ProvidersPage() {
  return (
    <div className="bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Provider Requirements' }]} />
        </div>
      </div>

      {/* ─── HEADER ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-3">Workforce Development Hub</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
            Provider Requirements & Governance
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed max-w-3xl mb-8">
            Organizations delivering training programs inside the Elevate hub operate under a formal governance framework. These requirements protect learners, credential authorities, and workforce funders. They apply to all providers — including Elevate itself.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/partners/join" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition text-sm">
              Apply to Become a Provider <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-slate-600 text-slate-300 px-6 py-3 rounded-lg font-bold hover:border-slate-400 hover:text-white transition text-sm">
              Ask a Question
            </Link>
          </div>
        </div>
      </section>

      {/* ─── FOUR CONTROLS ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Operational Controls</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Four controls applied to every provider</h2>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              These are not aspirational standards. They are operational requirements enforced before any program is activated and monitored throughout the provider relationship.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Building2,
                title: 'Provider Verification',
                desc: 'Legal standing, relevant experience, and capacity to serve the target population are verified before any program is listed or any learner is enrolled. Verification is repeated if organizational structure changes.',
              },
              {
                icon: Award,
                title: 'Program Approval',
                desc: 'Each program is reviewed individually. Approval requires a defined credential authority, a structured learning pathway, qualified instructors, and curriculum aligned to recognized standards. Approval is per-program, not per-organization.',
              },
              {
                icon: CheckCircle,
                title: 'Credential Authority Validation',
                desc: 'The credential authority for each program must be identified and validated before activation. The platform stores records and verification links. Certifications are issued by their respective authorities — not by Elevate or the provider unless they are the legal issuing body.',
              },
              {
                icon: Shield,
                title: 'Workforce Funding Compliance',
                desc: 'Programs operating under WIOA, Workforce Ready Grant, Job Ready Indy, or DOL Registered Apprenticeship must comply with those programs\' documentation and reporting requirements. Non-compliance results in program suspension pending remediation.',
              },
            ].map((control) => (
              <div key={control.title} className="bg-white rounded-xl border border-slate-200 p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <control.icon className="w-5 h-5 text-brand-red-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 mb-2">{control.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{control.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── ELIGIBILITY ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Eligibility</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Organization eligibility requirements</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              All of the following must be true before a provider application will be reviewed.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <ul className="space-y-3">
              {eligibilityRequirements.map((req) => (
                <li key={req} className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-brand-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm">{req}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── PROGRAM REQUIREMENTS ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Program Standards</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">What every program must define</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Approval is per-program. Each program submitted by an approved provider is reviewed independently against these standards.
            </p>
          </div>
          <div className="space-y-4">
            {programRequirements.map((req) => (
              <div key={req.title} className="border border-slate-200 rounded-xl p-5">
                <h3 className="font-bold text-slate-900 mb-2 text-sm">{req.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{req.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CREDENTIAL SEPARATION ─── */}
      <section className="py-16 sm:py-20 bg-amber-50 border-y border-amber-200">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-start gap-4 mb-8">
            <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-1" />
            <div>
              <p className="text-amber-700 font-bold text-xs uppercase tracking-widest mb-2">Credential Authority Separation</p>
              <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Rules that apply to all providers without exception</h2>
              <p className="text-slate-600 text-sm leading-relaxed">
                These rules protect the integrity of the credential system and the legal standing of the credential authorities. Violations result in immediate program suspension.
              </p>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-amber-200 p-6">
            <ul className="space-y-3">
              {credentialSeparationRules.map((rule) => (
                <li key={rule} className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 text-sm">{rule}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ─── ONBOARDING STEPS ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Onboarding Process</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">How provider onboarding works</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              From application to first enrolled learner, the process typically takes 2–4 weeks depending on documentation readiness.
            </p>
          </div>
          <div className="space-y-4">
            {onboardingSteps.map((step) => (
              <div key={step.step} className="flex gap-5">
                <div className="w-8 h-8 bg-brand-blue-700 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-0.5">
                  {step.step}
                </div>
                <div className="border-b border-slate-100 pb-4 flex-1">
                  <h3 className="font-bold text-slate-900 mb-1 text-sm">{step.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PERFORMANCE THRESHOLDS ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Ongoing Performance</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Minimum performance thresholds</h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Active programs are reviewed quarterly. Programs that fall below these thresholds are placed on a performance improvement plan. Programs that do not recover within one review cycle are suspended.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white border-b border-slate-200">
                  <th className="text-left px-5 py-3 font-bold text-slate-700">Metric</th>
                  <th className="text-left px-5 py-3 font-bold text-slate-700">Minimum</th>
                </tr>
              </thead>
              <tbody>
                {performanceThresholds.map((row, i) => (
                  <tr key={row.metric} className={i < performanceThresholds.length - 1 ? 'border-b border-slate-100' : ''}>
                    <td className="px-5 py-3 text-slate-700">{row.metric}</td>
                    <td className="px-5 py-3 font-semibold text-slate-900">{row.minimum}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-slate-500 text-xs mt-3 leading-relaxed">
            Thresholds apply to programs with 10 or more enrolled learners in the review period. Programs in their first cohort are reviewed at 12 months.
          </p>
        </div>
      </section>

      {/* ─── WHAT PROVIDERS GET ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-6">
          <div className="mb-8">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">What Providers Receive</p>
            <h2 className="text-2xl font-extrabold text-slate-900 mb-3">Platform access included for approved providers</h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: Users, title: 'Learner Management', desc: 'Enrollment, attendance, progress tracking, and cohort management for all enrolled learners.' },
              { icon: FileText, title: 'Compliance Reporting', desc: 'WIOA, WRG, Job Ready Indy, and DOL reporting templates. Audit-ready documentation maintained automatically.' },
              { icon: Award, title: 'Credential Pathway Tools', desc: 'Exam scheduling coordination, credential record storage, and verification link management.' },
              { icon: Building2, title: 'Employer Pipeline Access', desc: 'Connect graduates to the Elevate employer network. Post hiring needs and track placement outcomes.' },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-xl border border-slate-200 p-5">
                <div className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-4">Ready to apply?</h2>
          <p className="text-slate-500 text-sm max-w-xl mx-auto mb-8 leading-relaxed">
            If your organization meets the eligibility requirements and has programs that align with the hub&apos;s standards, start the provider application. Questions before applying are welcome.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/partners/join" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition text-sm">
              Start Provider Application <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border border-slate-600 text-slate-300 px-6 py-3 rounded-lg font-bold hover:border-slate-400 hover:text-white transition text-sm">
              Contact Us First
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
