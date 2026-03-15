import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Shield, Building2, Award, CheckCircle, Lock } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';

export const metadata: Metadata = {
  title: 'Workforce Development Hub | Elevate for Humanity',
  description:
    'Elevate operates a Workforce Development Hub that hosts training programs delivered by Elevate and approved partner institutions, connects learners to credential authorities, and provides employers and workforce agencies with a verified pipeline of credentialed talent.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform',
  },
};

const pipelineSteps = [
  { step: '1', label: 'Intake & Eligibility', desc: 'WIOA screening, enrollment, funding verification' },
  { step: '2', label: 'Training Delivery', desc: 'LMS, apprenticeships, in-person, hybrid programs' },
  { step: '3', label: 'Compliance & Reporting', desc: 'Attendance, FERPA, DOL/DWD audit-ready reports' },
  { step: '4', label: 'Employer Placement', desc: 'Pipeline matching, partner hiring, career services' },
  { step: '5', label: 'Outcome Tracking', desc: 'Credentials, employment, wage gains, retention' },
];

const providerControls = [
  {
    icon: Building2,
    title: 'Provider Verification',
    desc: 'Organizations applying to deliver programs inside the hub must demonstrate legal standing, relevant experience, and capacity to serve the target population. Verification is completed before any program is listed or any learner is enrolled.',
  },
  {
    icon: Award,
    title: 'Program Approval',
    desc: 'Each program must identify the credential authority, define the learning pathway, and meet minimum standards for curriculum, instruction, and assessment. Programs are reviewed before activation and subject to ongoing performance review.',
  },
  {
    icon: CheckCircle,
    title: 'Credential Authority Validation',
    desc: 'The platform stores credential records and verification links. Certifications are issued exclusively by their respective national or state authorities — EPA, PTCB, CompTIA, NCCER, Indiana SDOH, and others. Elevate does not issue credentials it does not legally control.',
  },
  {
    icon: Shield,
    title: 'Workforce Funding Compliance',
    desc: 'Programs operating on the hub must comply with applicable workforce funding requirements including WIOA Title I, Workforce Ready Grant, JRI, and DOL Registered Apprenticeship standards. Compliance documentation is maintained per program.',
  },
];

const audiences = [
  {
    title: 'Training Providers',
    desc: 'Deliver workforce programs under the Elevate hub with built-in compliance infrastructure, credential pathway management, and employer connections.',
    href: '/platform/providers',
    cta: 'Provider requirements →',
  },
  {
    title: 'Employers',
    desc: 'Access a verified pipeline of credentialed graduates. Post hiring needs, manage apprenticeship agreements, and track workforce outcomes.',
    href: '/employer',
    cta: 'Employer portal →',
  },
  {
    title: 'Workforce Agencies',
    desc: 'WIOA-aligned dashboards, multi-provider outcome reporting, and state agency integration. Built for organizations that answer to funders and auditors.',
    href: '/platform/workforce-boards',
    cta: 'Agency overview →',
  },
  {
    title: 'Program Holders',
    desc: 'MOU-based network for training providers operating under the Elevate umbrella. Shared infrastructure, separate program identity.',
    href: '/program-holder',
    cta: 'Program holder info →',
  },
];

const governancePrinciples = [
  'FERPA-aware student data handling with row-level security',
  'Role-based access: admin, staff, instructor, partner, learner',
  'WIOA / WRG / JRI compliance-ready reporting',
  'Audit logs and activity tracking on all operations',
  'Credential authority separation — platform stores records, authorities issue credentials',
  'Secure provider onboarding and MOU management',
  'Multi-tenant architecture — provider data is isolated by default',
];

export default function PlatformPage() {
  return (
    <div className="bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform' }]} />
        </div>
      </div>

      {/* ─── HERO ─── */}
      <section className="relative h-[50vh] sm:h-[55vh] md:h-[60vh] min-h-[320px] overflow-hidden">
        <ProgramHeroBanner videoSrc="/videos/lms-learning.mp4" />
        <div className="absolute inset-0 z-10 flex items-center">
          <div className="max-w-6xl mx-auto px-6 w-full">
            <p className="text-xs uppercase tracking-widest text-brand-red-400 font-bold mb-3">Workforce Infrastructure</p>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 mb-4 max-w-3xl leading-tight">
              Workforce Development Hub
            </h1>
            <p className="text-lg text-slate-200 max-w-2xl mb-8 leading-relaxed">
              Elevate operates a Workforce Development Hub that hosts training programs delivered by Elevate and approved partner institutions, connects learners to credential authorities, and provides employers and workforce agencies with a verified pipeline of credentialed talent.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/platform/providers" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition">
                Provider Requirements <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/store/licensing" className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition">
                License the Platform
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── OPERATIONAL STATEMENT ─── */}
      <section className="py-14 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-4">What This Platform Is</p>
          <blockquote className="text-xl sm:text-2xl text-white font-medium leading-relaxed mb-6">
            &ldquo;Elevate operates a Workforce Development Hub that hosts training programs delivered by Elevate and approved partner institutions, connects learners to credential authorities, and provides employers and workforce agencies with a verified pipeline of credentialed talent.&rdquo;
          </blockquote>
          <p className="text-slate-500 text-sm max-w-2xl mx-auto leading-relaxed">
            This is not a training website with a portal bolted on. It is shared infrastructure for multiple providers, credential authorities, employers, and workforce agencies — operating from a single coordinated system.
          </p>
        </div>
      </section>

      {/* ─── THREE LAYERS ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">System Architecture</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Three integrated layers</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm leading-relaxed">
              Each layer has a distinct function. Together they form a complete workforce pipeline from first contact to verified employment outcome.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                number: '01',
                label: 'Training Institute',
                color: 'red',
                heading: 'Programs delivered by Elevate and approved partners',
                body: 'Short-term career training in healthcare, skilled trades, CDL, barbering, and technology. Programs run 4–16 weeks. Partner providers operate under approved program agreements with defined curriculum, credential pathways, and compliance requirements.',
                link: '/programs',
                linkText: 'See programs →',
              },
              {
                number: '02',
                label: 'Credential Infrastructure',
                color: 'blue',
                heading: 'Pathway management and verification records',
                body: 'The platform manages exam preparation, progress tracking, and credential verification records. Certifications are issued by their respective national authorities. Elevate coordinates the learning pipeline and testing logistics — it does not issue credentials it does not legally control.',
                link: '/credentials',
                linkText: 'View credentials →',
              },
              {
                number: '03',
                label: 'Workforce Network',
                color: 'green',
                heading: 'Employers, agencies, and partners connected',
                body: 'Employers post hiring needs and access verified graduates. Workforce agencies track outcomes and run compliance reports. Partner providers manage cohorts. All roles operate from the same platform with isolated data and role-based access.',
                link: '/partners',
                linkText: 'Network overview →',
              },
            ].map((layer) => (
              <div
                key={layer.number}
                className={`rounded-2xl border-2 p-6 flex flex-col ${
                  layer.color === 'red'
                    ? 'border-brand-red-200 bg-brand-red-50'
                    : layer.color === 'blue'
                    ? 'border-brand-blue-200 bg-brand-blue-50'
                    : 'border-brand-green-200 bg-brand-green-50'
                }`}
              >
                <div className={`text-4xl font-black mb-3 ${layer.color === 'red' ? 'text-brand-red-200' : layer.color === 'blue' ? 'text-brand-blue-200' : 'text-brand-green-200'}`}>{layer.number}</div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${layer.color === 'red' ? 'text-brand-red-600' : layer.color === 'blue' ? 'text-brand-blue-600' : 'text-brand-green-600'}`}>{layer.label}</p>
                <h3 className="text-base font-bold text-slate-900 mb-3">{layer.heading}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1">{layer.body}</p>
                <Link href={layer.link} className={`mt-4 text-sm font-semibold ${layer.color === 'red' ? 'text-brand-red-600 hover:text-brand-red-700' : layer.color === 'blue' ? 'text-brand-blue-600 hover:text-brand-blue-700' : 'text-brand-green-600 hover:text-brand-green-700'}`}>{layer.linkText}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PROVIDER GOVERNANCE ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Provider Governance</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Four operational controls for every provider</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm leading-relaxed">
              Any organization delivering programs inside the hub must meet these requirements before activation. These controls protect learners, credential authorities, and workforce funders.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6">
            {providerControls.map((control) => (
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
          <div className="mt-8 text-center">
            <Link href="/platform/providers" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition text-sm">
              Full provider requirements and application <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── PIPELINE ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">End-to-End Pipeline</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Every stage in one system</h2>
            <p className="text-slate-600 max-w-2xl mx-auto text-sm leading-relaxed">
              From first contact to verified employment outcome — no handoffs to disconnected tools.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {pipelineSteps.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-white rounded-xl border border-slate-200 p-5 h-full">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-white font-bold text-sm mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{s.label}</h3>
                  <p className="text-slate-600 text-xs leading-relaxed">{s.desc}</p>
                </div>
                {i < pipelineSteps.length - 1 && (
                  <div className="hidden sm:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-brand-red-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO IT SERVES ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Who It Serves</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Different roles, one connected system</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {audiences.map((a) => (
              <div key={a.title} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col">
                <h3 className="font-bold text-slate-900 mb-2">{a.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-4">{a.desc}</p>
                <Link href={a.href} className="text-brand-red-600 hover:text-brand-red-700 text-sm font-semibold">
                  {a.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── GOVERNANCE & SECURITY ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-10">
            <p className="text-brand-red-400 font-bold text-xs uppercase tracking-widest mb-2">Governance & Security</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Built for funders, auditors, and regulators</h2>
            <p className="text-slate-500 text-sm max-w-xl mx-auto leading-relaxed">
              The platform is designed for organizations that operate under workforce funding agreements and must demonstrate compliance to state and federal agencies.
            </p>
          </div>
          <div className="bg-white rounded-xl border border-slate-700 p-8">
            <ul className="space-y-4">
              {governancePrinciples.map((g) => (
                <li key={g} className="flex items-start gap-3">
                  <Lock className="w-4 h-4 text-brand-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-600 text-sm">{g}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 text-center">
            <Link href="/compliance" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">
              Full compliance and security documentation →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
            Ready to operate on the platform?
          </h2>
          <p className="text-red-100 max-w-xl mx-auto mb-8 text-sm leading-relaxed">
            Whether you are a training provider, employer, workforce agency, or organization looking to license the system — start here.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/platform/providers" className="inline-flex items-center gap-2 bg-white text-brand-red-600 px-6 py-3 rounded-lg font-bold hover:bg-red-50 transition text-sm">
              Provider Requirements <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/store/licensing" className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition text-sm">
              License the Platform
            </Link>
            <Link href="/contact" className="inline-flex items-center gap-2 border-2 border-white/40 text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
