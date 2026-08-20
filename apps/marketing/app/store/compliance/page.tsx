export const dynamic = 'force-static';

import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ShieldCheck, Database, Accessibility, FileCheck2, LockKeyhole, ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: `Compliance Controls & Evidence | ${PLATFORM_DEFAULTS.orgName} Store`,
  description:
    'Review implemented workforce reporting, privacy, access-control, accessibility, audit, and credential-verification controls with explicit acceptance boundaries.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/store/compliance' },
};

const controls = [
  {
    icon: Database,
    title: 'Workforce Reporting Infrastructure',
    description:
      'Participant, service, employment-outcome, performance, PIRL mapping/export, and report-run data structures support workforce reporting workflows when source data is recorded.',
    href: '/store/compliance/wioa',
    cta: 'Review reporting controls',
  },
  {
    icon: LockKeyhole,
    title: 'Education Data Access Controls',
    description:
      'Authentication, role-based access, tenant scoping, row-level security, consent records, and audit events are used to protect supported learner and program workflows. These controls support FERPA-aligned administration; they are not a blanket legal certification.',
    href: '/privacy',
    cta: 'Review privacy practices',
  },
  {
    icon: Accessibility,
    title: 'Accessibility Program',
    description:
      'The platform includes accessibility-focused components and release checks. Conformance must be demonstrated by automated and manual testing against the production experience; this page does not assert an unverified WCAG certification.',
    href: '/accessibility',
    cta: 'Review accessibility statement',
  },
  {
    icon: FileCheck2,
    title: 'Audit & Evidence Records',
    description:
      'Applications, enrollments, attendance, apprenticeship hours, learner risk events, interventions, credentials, regulatory evidence, and selected administrative actions can retain auditable records in the canonical database.',
    href: '/licenses/enterprise-review',
    cta: 'Open enterprise review',
  },
];

const boundaries = [
  'No SOC 2, PCI DSS, HIPAA, GDPR, Section 508, COPPA, or similar certification is represented unless a current attestation or authoritative evidence is available for the exact scope claimed.',
  'Funding and WIOA statements are program-specific; participant eligibility and authorization remain decisions of the responsible agency.',
  'Accessibility is treated as a tested release requirement, not as a marketing badge that substitutes for production testing.',
  'Reporting tools do not make incomplete or inaccurate source data compliant by themselves.',
  'Security controls must be verified against the deployed application, Supabase policies, and role boundaries before enterprise acceptance.',
];

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[220px] overflow-hidden md:h-[300px]">
        <Image src="/images/pages/admin-compliance-hero.webp" alt="Compliance and audit review" fill sizes="100vw" className="object-cover" priority />
        <div className="absolute inset-0 bg-slate-950/65" />
        <div className="absolute inset-0 flex items-center">
          <div className="mx-auto w-full max-w-7xl px-4 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-200">Enterprise review</p>
            <h1 className="mt-3 max-w-4xl text-4xl font-black md:text-5xl">Compliance Controls &amp; Evidence</h1>
            <p className="mt-4 max-w-3xl text-lg text-slate-200">Inspect implemented controls, evidence sources, and acceptance boundaries instead of relying on unsupported compliance badges.</p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-4">
        <Breadcrumbs items={[{ label: 'Store', href: '/store' }, { label: 'Compliance' }]} />
      </div>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4">
          <div className="mb-12 text-center">
            <ShieldCheck className="mx-auto h-12 w-12 text-blue-700" />
            <h2 className="mt-4 text-3xl font-black text-slate-950">Implemented control areas</h2>
            <p className="mx-auto mt-3 max-w-3xl text-slate-600">Each area below describes a system capability that can be inspected. Legal or certification conclusions depend on the governing requirements and evidence for the specific deployment.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {controls.map(({ icon: Icon, title, description, href, cta }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-slate-50 p-7">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100"><Icon className="h-6 w-6 text-blue-700" /></div>
                <h3 className="text-xl font-bold text-slate-950">{title}</h3>
                <p className="mt-3 leading-relaxed text-slate-600">{description}</p>
                <Link href={href} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:underline">{cta}<ArrowRight className="h-4 w-4" /></Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-3xl font-black text-slate-950">Acceptance boundaries</h2>
          <p className="mt-3 text-slate-600">These boundaries prevent a buyer, learner, agency, or administrator from mistaking an implemented control for a certification or guaranteed legal outcome.</p>
          <ul className="mt-8 space-y-4">
            {boundaries.map((boundary) => (
              <li key={boundary} className="flex gap-3 rounded-xl border border-slate-200 bg-white p-5 text-slate-700">
                <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-blue-700" />
                <span>{boundary}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-3xl font-black text-slate-950">Review the actual evidence package</h2>
          <p className="mx-auto mt-4 max-w-3xl text-slate-600">Enterprise acceptance should inspect architecture, access control, data flows, audit records, regulatory evidence, credential integrity, accessibility tests, and production health together.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/licenses/enterprise-review" className="rounded-xl bg-slate-950 px-8 py-4 font-bold text-white hover:bg-slate-800">Enterprise Review</Link>
            <Link href="/contact" className="rounded-xl border border-slate-300 px-8 py-4 font-bold text-slate-900 hover:bg-slate-50">Request Evidence Review</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
