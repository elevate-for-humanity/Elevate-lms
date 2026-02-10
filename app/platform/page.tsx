import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  Building2,
  GraduationCap,
  Briefcase,
  Shield,
  BarChart3,
  Users,
  Server,
  CheckCircle,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Workforce Operating System | Elevate for Humanity',
  description:
    'The Elevate Workforce OS handles intake, training delivery, compliance, employer placement, and outcome reporting in one system.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform',
  },
};

/* ------------------------------------------------------------------ */
/*  DATA                                                               */
/* ------------------------------------------------------------------ */

const pipelineSteps = [
  { step: '1', label: 'Intake & Eligibility', desc: 'WIOA screening, enrollment, funding verification' },
  { step: '2', label: 'Training Delivery', desc: 'LMS, apprenticeships, in-person, hybrid programs' },
  { step: '3', label: 'Compliance & Reporting', desc: 'Attendance, FERPA, DOL/DWD audit-ready reports' },
  { step: '4', label: 'Employer Placement', desc: 'Pipeline matching, partner hiring, career services' },
  { step: '5', label: 'Outcome Tracking', desc: 'Credentials, employment, wage gains, retention' },
];

const audiences = [
  { icon: GraduationCap, title: 'Training Providers', desc: 'Deliver accredited programs with built-in compliance and credential issuance.', href: '/platform/training-providers' },
  { icon: Briefcase, title: 'Employers', desc: 'Access trained candidates, manage apprenticeships, track workforce pipelines.', href: '/platform/employer-portal' },
  { icon: Building2, title: 'Workforce Boards', desc: 'WIOA reporting, outcome dashboards, multi-provider oversight.', href: '/platform/workforce-boards' },
  { icon: Users, title: 'Partners & Nonprofits', desc: 'Plug into shared infrastructure for funded training delivery.', href: '/platform/partners' },
];

const modules = [
  {
    title: 'Partners',
    desc: 'Training providers, employers, workforce boards, and community organizations operating on the platform.',
    href: '/platform/partners',
  },
  {
    title: 'Managed Platform',
    desc: 'We operate it, you use it. Hosting, compliance reporting, updates, and support — zero engineering burden.',
    href: '/platform/managed',
  },
  {
    title: 'Enterprise Access',
    desc: 'Restricted source-use deployments for qualified enterprises with dedicated technical teams.',
    href: '/platform/enterprise',
  },
  {
    title: 'Workforce Boards',
    desc: 'WIOA-aligned dashboards, multi-provider reporting, and state agency integration.',
    href: '/platform/workforce-boards',
  },
  {
    title: 'Licensing',
    desc: 'License models, qualification criteria, and what\'s included in each tier.',
    href: '/platform/licensing',
  },
  {
    title: 'Licensing Models Overview',
    desc: 'Detailed breakdown of all four license types: Program Holder, Independent, Apprenticeship, and À La Carte.',
    href: '/platform/overview',
  },
  {
    title: 'Program Holders',
    desc: 'MOU-based network for training providers operating under the Elevate umbrella.',
    href: '/platform/program-holders',
  },
  {
    title: 'Sponsors',
    desc: 'Sponsor licensing for organizations funding workforce programs at scale.',
    href: '/platform/sponsors',
  },
  {
    title: 'Workforce Analytics',
    desc: 'Enrollment, completion, credential, and employment outcome data across all programs.',
    href: '/platform/workforce-analytics',
  },
];

const governancePrinciples = [
  'FERPA-aware student data handling',
  'Row Level Security across all tenant data',
  'Role-based access: admin, staff, instructor, partner, student',
  'WIOA / WRG / JRI compliance-ready reporting',
  'Audit logs and activity tracking on all operations',
  'Secure invite and onboarding flows',
];

/* ------------------------------------------------------------------ */
/*  PAGE                                                               */
/* ------------------------------------------------------------------ */

export default function PlatformPage() {
  return (
    <div className="bg-white">
      <Breadcrumbs items={[{ label: 'Platform' }]} />

      {/* ===== HERO ===== */}
      <section className="relative min-h-[420px] flex items-center bg-slate-900">
        <Image
          src="/images/team-vibrant.jpg"
          alt="Elevate Workforce Operating System"
          fill
          className="object-cover opacity-25"
          priority
        />
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <p className="text-brand-red-400 font-bold text-sm uppercase tracking-widest mb-4">
            Workforce Operating System
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
            One System. Every Stage.
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-white/90 max-w-3xl mx-auto leading-relaxed">
            Intake, training, compliance, placement, and reporting — connected in one platform
            built for workforce funding realities.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/platform/partners"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white bg-brand-red-600 rounded-lg hover:bg-brand-red-700 transition-colors"
            >
              Become a Platform Partner <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/store/demo"
              className="inline-flex items-center justify-center px-8 py-4 text-base font-bold text-white border-2 border-white rounded-lg hover:bg-white/10 transition-colors"
            >
              Request a Platform Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ===== PIPELINE DIAGRAM ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-4">
            How the System Works
          </h2>
          <p className="text-lg text-slate-800 text-center max-w-3xl mx-auto mb-14">
            Every stage of the workforce pipeline — from first contact to employment outcome — runs through one connected system.
          </p>

          {/* Pipeline flow */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {pipelineSteps.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-slate-50 rounded-xl p-5 h-full border border-slate-200">
                  <div className="w-10 h-10 bg-brand-red-600 rounded-lg flex items-center justify-center text-white font-bold text-lg mb-3">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-slate-900 text-base mb-1">{s.label}</h3>
                  <p className="text-slate-800 text-sm">{s.desc}</p>
                </div>
                {/* Arrow connector (hidden on mobile, shown on sm+) */}
                {i < pipelineSteps.length - 1 && (
                  <div className="hidden sm:flex absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-brand-red-600" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHO IT SERVES ===== */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-4">
            Who It Serves
          </h2>
          <p className="text-lg text-slate-800 text-center max-w-3xl mx-auto mb-12">
            Different roles, one connected system. Each audience gets the tools they need without duplicating infrastructure.
          </p>
          <div className="grid sm:grid-cols-2 gap-6">
            {audiences.map((a) => (
              <Link
                key={a.title}
                href={a.href}
                className="group flex items-start gap-5 p-6 bg-white rounded-xl border border-slate-200 hover:border-brand-red-300 hover:shadow-lg transition-all"
              >
                <div className="w-12 h-12 bg-brand-red-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-red-100 transition-colors">
                  <a.icon className="w-6 h-6 text-brand-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-brand-red-600 transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-slate-800 mt-1">{a.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORM MODULES ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-4">
            Platform Modules
          </h2>
          <p className="text-lg text-slate-800 text-center max-w-3xl mx-auto mb-12">
            Each module is part of the Workforce Operating System. They share data, users, and compliance infrastructure.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <Link
                key={m.title}
                href={m.href}
                className="group p-6 bg-slate-50 rounded-xl border border-slate-200 hover:border-brand-red-300 hover:shadow-lg transition-all"
              >
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-brand-red-600 transition-colors">
                  {m.title}
                </h3>
                <p className="text-slate-800 mb-4">{m.desc}</p>
                <span className="text-brand-red-600 font-semibold text-sm group-hover:underline inline-flex items-center gap-1">
                  Learn more <ArrowRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ===== GOVERNANCE & SECURITY ===== */}
      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-4">
            Governance, Funding & Security
          </h2>
          <p className="text-lg text-slate-800 text-center max-w-3xl mx-auto mb-10">
            Built for organizations that answer to funders, auditors, and regulators — not just users.
          </p>
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <ul className="space-y-4">
              {governancePrinciples.map((g) => (
                <li key={g} className="flex items-start gap-3 text-slate-900">
                  <Shield className="w-5 h-5 text-brand-red-600 flex-shrink-0 mt-0.5" />
                  <span className="text-lg">{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-16 sm:py-20 bg-brand-red-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Operate on the Platform?
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Whether you need managed hosting, enterprise deployment, or a partnership — start a conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/store/licenses"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-red-600 font-bold rounded-lg hover:bg-slate-100 transition-colors"
            >
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/store/demo"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
            >
              See Platform Tour
            </Link>
            <Link
              href="/platform/partners"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
