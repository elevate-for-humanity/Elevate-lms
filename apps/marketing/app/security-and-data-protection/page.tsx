import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Security & Data Protection',
  description: `Security, access-control, data-protection, auditability, and incident-response practices for ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/security-and-data-protection' },
};

const controls = [
  {
    title: 'Identity and access control',
    body: 'Authenticated services use role- and relationship-based authorization. Privileged operations are separated from learner and public access. Authorization must be enforced on the server and in database policies rather than relying only on hidden navigation or client-side checks.',
  },
  {
    title: 'Database protection and tenant boundaries',
    body: 'Production data is protected with database access policies, including row-level security where applicable. Administrative and service-role access is restricted to trusted server-side operations. Cross-tenant and cross-user access is treated as a security defect and is included in hardening and regression work.',
  },
  {
    title: 'Encryption and transport',
    body: 'Public and authenticated production services use encrypted HTTPS transport. Managed infrastructure and service providers apply their platform encryption and key-management controls to hosted data according to the service configuration and contract.',
  },
  {
    title: 'Application and release controls',
    body: 'Source changes are version controlled and production releases are subject to build, integrity, security, route, accessibility, and workflow checks. A successful source commit is not treated as proof that a production release is healthy; deployed services require production verification.',
  },
  {
    title: 'Audit and operational evidence',
    body: 'Administrative, application, apprenticeship, credential, attendance, AI-assisted, and other consequential workflows use database records or audit events appropriate to the feature. Auditability is an engineering control and does not by itself constitute a third-party compliance certification.',
  },
  {
    title: 'Payments and sensitive data',
    body: 'Card payment data is handled by payment processors rather than intentionally storing full payment-card numbers or card security codes in the application database. Sensitive identity and participant records are restricted to the workflows and roles that require them.',
  },
  {
    title: 'Incident and vulnerability handling',
    body: 'Suspected security incidents, access-control failures, exposed secrets, vulnerable dependencies, or data-integrity issues are investigated, contained, remediated, and documented according to the affected system and applicable notification or contractual obligations.',
  },
  {
    title: 'Backups, availability, and recovery',
    body: 'Availability and recovery depend on the managed production services, database configuration, deployment architecture, and operational procedures in use at the time. This page does not publish an uptime, recovery-time, or recovery-point guarantee unless that commitment is included in an executed service agreement.',
  },
] as const;

export default function SecurityDataProtectionPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Security & Data Protection' }]} />
        </div>
      </div>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Security & Data Governance</p>
          <h1 className="mt-3 text-4xl font-black">Security & Data Protection</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            This page documents the security and data-protection controls used across {PLATFORM_DEFAULTS.orgName} public, learning, apprenticeship, administrative, and partner systems.
          </p>
          <p className="mt-5 text-sm font-semibold text-slate-400">Reviewed: August 20, 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          This is a control description, not a SOC 2, ISO 27001, FedRAMP, StateRAMP, penetration-test, or other independent certification claim. A certification or assurance report is represented only when a current supporting record exists.
        </div>

        <div className="mt-10 space-y-6">
          {controls.map((control) => (
            <section key={control.title} className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-2xl font-black">{control.title}</h2>
              <p className="mt-3 leading-7 text-slate-700">{control.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-black">Security questions, incidents, and procurement review</h2>
          <p className="mt-3 leading-7 text-slate-700">Use the contact channel to report a suspected security issue or request security architecture, data-flow, access-control, subprocessor, or procurement information appropriate to an authorized review.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-lg bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">Contact us</Link>
            <Link href="/privacy" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold hover:bg-slate-100">Privacy Policy</Link>
            <Link href="/federal-compliance" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold hover:bg-slate-100">Compliance controls</Link>
            <Link href="/legal" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold hover:bg-slate-100">Legal documents</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
