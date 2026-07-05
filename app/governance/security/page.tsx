import { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Security and Data Protection',
  description:
    `Security controls, data protection standards, incident response posture, and operational safeguards used across ${PLATFORM_DEFAULTS.orgName} systems.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/governance/security' },
};

const controls = [
  {
    title: 'Access Control',
    detail:
      'Role-based access with least-privilege enforcement for learner, employer, instructor, and admin workflows.',
  },
  {
    title: 'Data Encryption',
    detail:
      'TLS in transit and managed platform encryption for stored operational data and audit records.',
  },
  {
    title: 'Auditability',
    detail:
      'Operational events are captured for compliance review, incident triage, and accountability workflows.',
  },
  {
    title: 'Incident Response',
    detail:
      'Documented response policy with severity handling, containment steps, and notification pathways.',
  },
  {
    title: 'Vendor Controls',
    detail:
      'Integrated third-party services are evaluated for contractual, privacy, and operational risk alignment.',
  },
  {
    title: 'Continuity and Recovery',
    detail:
      'Recovery planning and backup safeguards support restoration of critical services after disruption.',
  },
];

export default function GovernanceSecurityPage() {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative h-[240px] sm:h-[300px] overflow-hidden">
        <Image
          src="/images/pages/governance-page-1.webp"
          alt="Security and data protection governance"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
      </section>

      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Governance', href: '/governance' },
            { label: 'Security & Data Protection' },
          ]}
        />
      </div>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Security and Data Protection
          </h1>
          <p className="text-slate-700 mt-3 text-lg">
            {PLATFORM_DEFAULTS.orgName} maintains a layered control model to protect participant data,
            preserve system integrity, and support regulatory readiness.
          </p>
        </header>

        <section className="grid sm:grid-cols-2 gap-4 mb-10">
          {controls.map((c) => (
            <article key={c.title} className="rounded-xl border border-slate-200 p-5 bg-white">
              <h2 className="text-lg font-bold text-slate-900 mb-2">{c.title}</h2>
              <p className="text-sm text-slate-700 leading-relaxed">{c.detail}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl border border-slate-200 p-6 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-900 mb-2">Governance Note</h2>
          <p className="text-slate-700 leading-relaxed mb-4">
            This page summarizes security posture for institutional and partner review. Program-specific
            implementations may differ by workflow, role, and regulatory obligations.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/legal" className="px-5 py-2.5 rounded-lg bg-brand-blue-600 text-white hover:bg-brand-blue-700 font-semibold">
              Incident Response Policy
            </Link>
            <Link href="/contact" className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-800 hover:bg-white font-semibold">
              Request Documentation
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
