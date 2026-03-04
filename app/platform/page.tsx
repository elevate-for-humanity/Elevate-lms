
import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';

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
  { step: '1', label: 'Intake & Eligibility', desc: 'WIOA screening, enrollment, funding verification', image: '/images/pages/homepage-why-elevate.jpg' },
  { step: '2', label: 'Training Delivery', desc: 'LMS, apprenticeships, in-person, hybrid programs', image: '/images/pages/comp-cta-training.jpg' },
  { step: '3', label: 'Compliance & Reporting', desc: 'Attendance, FERPA, DOL/DWD audit-ready reports', image: '/images/pages/comp-cta-career.jpg' },
  { step: '4', label: 'Employer Placement', desc: 'Pipeline matching, partner hiring, career services', image: '/images/pages/homepage-why-elevate.jpg' },
  { step: '5', label: 'Outcome Tracking', desc: 'Credentials, employment, wage gains, retention', image: '/images/pages/comp-cta-career.jpg' },
];

const audiences = [
  { title: 'Training Providers', desc: 'Deliver industry-aligned programs with built-in compliance and credential issuance.', href: '/platform/training-providers', image: '/images/pages/homepage-why-elevate.jpg' },
  { title: 'Employers', desc: 'Access trained candidates, manage apprenticeships, track workforce pipelines.', href: '/platform/employer-portal', image: '/images/pages/homepage-why-elevate.jpg' },
  { title: 'Workforce Boards', desc: 'WIOA reporting, outcome dashboards, multi-provider oversight.', href: '/platform/workforce-boards', image: '/images/pages/homepage-why-elevate.jpg' },
  { title: 'Partners & Nonprofits', desc: 'Plug into shared infrastructure for funded training delivery.', href: '/platform/partners', image: '/images/pages/homepage-why-elevate.jpg' },
];

const modules = [
  { title: 'Partners', desc: 'Training providers, employers, workforce boards, and community organizations operating on the platform.', href: '/platform/partners', image: '/images/pages/homepage-why-elevate.jpg' },
  { title: 'Managed Platform', desc: 'We operate it, you use it. Hosting, compliance reporting, updates, and support — zero engineering burden.', href: '/platform/managed', image: '/images/pages/comp-cta-training.jpg' },
  { title: 'Enterprise Access', desc: 'Enterprise source-use deployments for organizations with dedicated technical teams.', href: '/platform/enterprise', image: '/images/pages/comp-cta-training.jpg' },
  { title: 'Workforce Boards', desc: 'WIOA-aligned dashboards, multi-provider reporting, and state agency integration.', href: '/platform/workforce-boards', image: '/images/pages/homepage-why-elevate.jpg' },
  { title: 'Licensing', desc: "License models, qualification criteria, and what's included in each tier.", href: '/platform/licensing', image: '/images/pages/comp-cta-career.jpg' },
  { title: 'Licensing Models', desc: 'Detailed breakdown of all four license types: Program Holder, Independent, Apprenticeship, and À La Carte.', href: '/platform/overview', image: '/images/pages/homepage-why-elevate.jpg' },
  { title: 'Program Holders', desc: 'MOU-based network for training providers operating under the Elevate umbrella.', href: '/platform/program-holders', image: '/images/pages/homepage-why-elevate.jpg' },
  { title: 'Sponsors', desc: 'Sponsor licensing for organizations funding workforce programs at scale.', href: '/platform/sponsors', image: '/images/pages/comp-cta-career.jpg' },
  { title: 'Workforce Analytics', desc: 'Enrollment, completion, credential, and employment outcome data across all programs.', href: '/platform/workforce-analytics', image: '/images/pages/comp-cta-career.jpg' },
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
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform' }]} />
        </div>
      </div>

      {/* ===== VIDEO HERO ===== */}
      <section className="relative h-[60vh] min-h-[400px] max-h-[720px] overflow-hidden">
        <ProgramHeroBanner videoSrc="/videos/lms-learning.mp4" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent z-10 flex items-center">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <p className="text-sm uppercase tracking-wider text-white/70 mb-3">Elevate for Humanity</p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-4 max-w-3xl">
              Workforce Operating System
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-2xl mb-8">
              Intake, training delivery, compliance, employer placement, and outcome reporting — one connected system.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/licensing-partnerships"
                className="inline-flex items-center justify-center gap-2 bg-brand-red-600 text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-brand-red-700 transition"
              >
                License the Platform
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/store/demos"
                className="inline-flex items-center justify-center gap-2 border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white/10 transition"
              >
                See Platform Tour
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PIPELINE DIAGRAM ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-4">
            How the System Works
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-3xl mx-auto mb-14">
            Every stage of the workforce pipeline — from first contact to employment outcome — runs through one connected system.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {pipelineSteps.map((s, i) => (
              <div key={s.step} className="relative">
                <div className="bg-white rounded-xl overflow-hidden border border-slate-200 h-full">
                  <div className="relative h-28">
                    <Image
                      src={s.image}
                      alt={s.label}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 20vw"
                    />
                    <div className="absolute top-3 left-3 w-8 h-8 bg-brand-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {s.step}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-slate-900 text-sm mb-1">{s.label}</h3>
                    <p className="text-slate-600 text-xs">{s.desc}</p>
                  </div>
                </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-4">
            Who It Serves
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-3xl mx-auto mb-12">
            Different roles, one connected system. Each audience gets the tools they need without duplicating infrastructure.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((a) => (
              <div key={a.title} className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:border-brand-red-300 hover:shadow-lg transition-all">
                <div className="relative h-44">
                  <Image
                    src={a.image}
                    alt={a.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-lg font-bold text-white">{a.title}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-slate-600 text-sm mb-4">{a.desc}</p>
                  <Link
                    href={a.href}
                    className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-red-700 transition"
                  >
                    Learn More <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PLATFORM MODULES ===== */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 text-center mb-4">
            Platform Modules
          </h2>
          <p className="text-lg text-slate-600 text-center max-w-3xl mx-auto mb-12">
            Each module is part of the Workforce Operating System. They share data, users, and compliance infrastructure.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {modules.map((m) => (
              <div key={m.title} className="group bg-white rounded-xl overflow-hidden border border-slate-200 hover:shadow-lg transition-all">
                <div className="relative h-40">
                  <Image
                    src={m.image}
                    alt={m.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-4">
                    <h3 className="text-lg font-bold text-white">{m.title}</h3>
                  </div>
                </div>
                <div className="p-5">
                  <p className="text-slate-600 text-sm mb-4">{m.desc}</p>
                  <Link
                    href={m.href}
                    className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-brand-red-700 transition"
                  >
                    Explore <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
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
      <section className="relative py-20 overflow-hidden">
        <Image
          src="/images/pages/platform-page-2.jpg"
          alt="Workforce training in action"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-brand-red-600/90" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Ready to Operate on the Platform?
          </h2>
          <p className="text-lg text-white/90 mb-10 max-w-2xl mx-auto">
            Whether you need managed hosting, enterprise deployment, or a partnership — start a conversation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/licensing-partnerships"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-red-600 font-bold rounded-lg hover:bg-slate-100 transition-colors text-lg"
            >
              License the Platform <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/store/demos"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-lg"
            >
              See Platform Tour
            </Link>
            <Link
              href="/platform/partners"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors text-lg"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
