import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import ProgramHeroBanner from '@/components/ProgramHeroBanner';

export const metadata: Metadata = {
  title: 'Workforce Infrastructure Platform | Elevate for Humanity',
  description:
    'Multi-tenant workforce infrastructure for training providers, workforce boards, employers, and government agencies. WIOA-aligned, DOL-compliant, audit-ready.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/platform',
  },
};

const capabilities = [
  {
    image: '/images/pages/platform-page-2.jpg',
    alt: 'Multi-tenant provider management dashboard',
    label: 'Multi-Tenant Architecture',
    desc: 'Each provider, employer, and agency operates in an isolated data environment. Role-based access enforced at the row level — no cross-tenant data exposure.',
  },
  {
    image: '/images/pages/platform-page-3.jpg',
    alt: 'WIOA and workforce funding compliance tools',
    label: 'Funding Compliance',
    desc: 'WIOA Title I, Workforce Ready Grant, JRI, and DOL Registered Apprenticeship standards built into the data model. Compliance documentation maintained per program.',
  },
  {
    image: '/images/pages/platform-page-4.jpg',
    alt: 'Credential pathway and verification management',
    label: 'Credential Authority Separation',
    desc: 'Platform stores credential records and verification links. Certifications issued exclusively by their respective national or state authorities — EPA, PTCB, CompTIA, NCCER, Indiana SDOH.',
  },
  {
    image: '/images/pages/platform-page-5.jpg',
    alt: 'Audit-ready reporting and analytics dashboard',
    label: 'Audit-Ready Reporting',
    desc: 'Attendance, FERPA, DOL/DWD, and PIRL-aligned reports. Every admin action logged. Immutable audit trail on all operations involving learner data or funding records.',
  },
  {
    image: '/images/pages/platform-page-6.jpg',
    alt: 'Employer pipeline and graduate placement tracking',
    label: 'Employer Pipeline',
    desc: 'Verified graduate pipeline with credential records, placement tracking, and WOTC documentation. Employers post hiring needs and access pre-screened candidates directly.',
  },
  {
    image: '/images/pages/platform-page-7.jpg',
    alt: 'Apprenticeship hours and OJT management',
    label: 'Apprenticeship & OJT',
    desc: 'DOL Registered Apprenticeship sponsor infrastructure. Hours logging, RTI tracking, wage progression, and employer agreement management in one system.',
  },
];

const audiences = [
  {
    image: '/images/pages/platform-page-8.jpg',
    alt: 'Training provider onboarding and program management',
    title: 'Training Providers',
    desc: 'Deliver workforce programs under the Elevate hub with built-in compliance infrastructure, credential pathway management, and employer connections. MOU-based onboarding.',
    href: '/platform/providers',
    cta: 'Provider requirements',
  },
  {
    image: '/images/pages/platform-page-9.jpg',
    alt: 'Workforce board and agency reporting tools',
    title: 'Workforce Boards & Agencies',
    desc: 'WIOA-aligned dashboards, multi-provider outcome reporting, and state agency integration. Built for organizations that answer to funders and auditors.',
    href: '/platform/workforce-boards',
    cta: 'Agency overview',
  },
  {
    image: '/images/pages/platform-page-10.jpg',
    alt: 'Employer hiring portal and apprenticeship management',
    title: 'Employers',
    desc: 'Access a verified pipeline of credentialed graduates. Manage apprenticeship agreements, track OJT hours, and document WOTC eligibility — all in one place.',
    href: '/employer',
    cta: 'Employer portal',
  },
  {
    image: '/images/pages/platform-page-11.jpg',
    alt: 'Platform licensing for workforce organizations',
    title: 'License the Platform',
    desc: 'Organizations running their own workforce programs can license the full infrastructure stack — enrollment, compliance, credentialing, reporting, and employer pipeline.',
    href: '/store/licensing',
    cta: 'Licensing options',
  },
];

const complianceItems = [
  'FERPA-aware student data handling with row-level security',
  'Role-based access: admin, staff, instructor, partner, learner, case manager',
  'WIOA / WRG / JRI compliance-ready reporting',
  'Immutable audit logs on all operations',
  'Credential authority separation — platform stores records, authorities issue credentials',
  'Secure provider onboarding and MOU management',
  'Multi-tenant architecture — provider data isolated by default',
  'PIRL-aligned participant records for DOL reporting',
];

const pipeline = [
  { n: '01', label: 'Intake & Eligibility', desc: 'WIOA screening, enrollment, funding verification' },
  { n: '02', label: 'Training Delivery', desc: 'LMS, apprenticeships, in-person, hybrid' },
  { n: '03', label: 'Compliance & Reporting', desc: 'Attendance, FERPA, DOL/DWD audit-ready' },
  { n: '04', label: 'Employer Placement', desc: 'Pipeline matching, partner hiring, career services' },
  { n: '05', label: 'Outcome Tracking', desc: 'Credentials, employment, wage gains, retention' },
];

export default function PlatformPage() {
  return (
    <div className="bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Platform' }]} />
        </div>
      </div>

      {/* HERO */}
      <section className="relative h-[55vh] sm:h-[60vh] md:h-[65vh] min-h-[360px] overflow-hidden">
        <ProgramHeroBanner
          videoSrc="/videos/elevate-overview-with-narration.mp4"
          posterImage="/images/pages/platform-page-1.jpg"
          voiceoverSrc="/audio/heroes/programs.mp3"
        />
      </section>

      {/* POSITIONING STATEMENT */}
      <section className="py-16 bg-white border-b">
        <div className="max-w-4xl mx-auto px-6">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-4">What This Is</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight mb-6">
            Workforce infrastructure for providers, agencies, and employers — not a course platform.
          </h1>
          <p className="text-slate-600 text-lg leading-relaxed mb-4 max-w-3xl">
            Elevate operates a multi-tenant Workforce Development Hub. Training providers deliver programs under the hub. Credential authorities issue certifications. Employers access a verified graduate pipeline. Workforce agencies run compliance reports. All roles operate from one coordinated system with isolated data and role-based access.
          </p>
          <p className="text-slate-500 text-base leading-relaxed max-w-3xl">
            If you are a workforce board, training provider, government agency, or employer looking for infrastructure built for WIOA, DOL, and state funding compliance — this is what you are looking at.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-brand-red-700 transition text-sm">
              Schedule a Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/store/licensing" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-6 py-3 rounded-lg font-bold hover:bg-slate-50 transition text-sm">
              Licensing Options
            </Link>
          </div>
        </div>
      </section>

      {/* CAPABILITIES */}
      <section className="py-16 sm:py-20 bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Platform Capabilities</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Built for funders, auditors, and regulators</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {capabilities.map((cap) => (
              <div key={cap.label} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="relative w-full" style={{ aspectRatio: '16/10' }}>
                  <Image
                    src={cap.image}
                    alt={cap.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-slate-900 mb-2">{cap.label}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{cap.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="py-16 sm:py-20 bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">End-to-End Pipeline</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-3">Every stage in one system</h2>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              From first contact to verified employment outcome — no handoffs to disconnected tools.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            {pipeline.map((s, i) => (
              <div key={s.n} className="relative">
                <div className="bg-white rounded-xl border border-slate-200 p-5 h-full">
                  <div className="text-3xl font-black text-slate-100 mb-3 leading-none">{s.n}</div>
                  <h3 className="font-bold text-slate-900 text-sm mb-1">{s.label}</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
                </div>
                {i < pipeline.length - 1 && (
                  <div className="hidden sm:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10">
                    <ArrowRight className="w-5 h-5 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHO IT SERVES */}
      <section className="py-16 sm:py-20 bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-12">
            <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-2">Who It Serves</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Find your path into the platform</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {audiences.map((a) => (
              <div key={a.title} className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                  <Image
                    src={a.image}
                    alt={a.alt}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  />
                </div>
                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-bold text-slate-900 mb-2">{a.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed flex-1 mb-4">{a.desc}</p>
                  <Link href={a.href} className="inline-flex items-center gap-1 text-brand-red-600 hover:text-brand-red-700 text-sm font-semibold">
                    {a.cta} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPLIANCE & SECURITY */}
      <section className="py-16 sm:py-20 bg-white border-b">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-3">Compliance & Security</p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
                Designed for organizations that answer to funders and auditors
              </h2>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Every design decision in this platform was made with workforce funding compliance in mind. WIOA, WRG, JRI, and DOL Registered Apprenticeship requirements are not bolted on — they are in the data model.
              </p>
              <ul className="space-y-3">
                {complianceItems.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-red-500 flex-shrink-0 mt-2" />
                    <span className="text-slate-600 text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link href="/compliance" className="text-sm font-semibold text-brand-red-600 hover:text-brand-red-700">
                  Full compliance documentation →
                </Link>
              </div>
            </div>
            <div className="relative min-h-[320px] rounded-xl overflow-hidden" style={{ aspectRatio: '4/3' }}>
              <Image
                src="/images/pages/platform-page-12.jpg"
                alt="Compliance and audit infrastructure"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </div>
      </section>

      {/* PRIMARY CTA */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <p className="text-brand-red-600 font-bold text-xs uppercase tracking-widest mb-4">Get Started</p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
            Ready to operate on the platform?
          </h2>
          <p className="text-slate-600 text-base leading-relaxed mb-8 max-w-xl mx-auto">
            Whether you are a training provider, workforce board, employer, or organization looking to license the infrastructure — the next step is a conversation.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-brand-red-600 text-white px-8 py-3.5 rounded-lg font-bold hover:bg-brand-red-700 transition">
              Schedule a Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/platform/providers" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition">
              Provider Requirements
            </Link>
            <Link href="/store/licensing" className="inline-flex items-center gap-2 border border-slate-300 text-slate-700 px-8 py-3.5 rounded-lg font-bold hover:bg-slate-50 transition">
              Licensing Options
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
