import type { Metadata } from 'next';
import Link from 'next/link';
import { Accessibility, BadgeCheck, Database, FileCheck2, LifeBuoy, LockKeyhole, Scale, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trust Center',
  description: 'Institutional evidence, approvals, security, accessibility, governance, privacy, and procurement resources for Elevate for Humanity.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/trust' },
};

const areas = [
  {
    title: 'Approvals & regulatory evidence',
    description: 'Program-level public claims are separated by authority, status, jurisdiction, and supporting evidence instead of being presented as blanket approvals.',
    href: '/approvals',
    icon: BadgeCheck,
  },
  {
    title: 'Security & data protection',
    description: 'Review platform security, access controls, data protection practices, and the boundaries of compliance claims.',
    href: '/security-and-data-protection',
    icon: LockKeyhole,
  },
  {
    title: 'Accessibility',
    description: 'Review accessibility commitments and the public accessibility information maintained for the platform and training experience.',
    href: '/accessibility',
    icon: Accessibility,
  },
  {
    title: 'Legal & privacy',
    description: 'Review legal notices, privacy terms, and institutional responsibilities governing use of the public site and platform.',
    href: '/legal',
    icon: Scale,
  },
  {
    title: 'Apprenticeship compliance',
    description: 'Review the registered-apprenticeship structure, OJT documentation, competency verification, and related compliance resources.',
    href: '/compliance/apprenticeship-structure',
    icon: FileCheck2,
  },
  {
    title: 'Support & escalation',
    description: 'Review support channels, business hours, help resources, and ticket intake. Contract-specific escalation and service levels are documented during procurement.',
    href: '/support',
    icon: LifeBuoy,
  },
  {
    title: 'Procurement center',
    description: 'A buyer-oriented view of architecture, implementation, data ownership, auditability, security review, accessibility, and platform demonstration resources.',
    href: '/procurement',
    icon: ShieldCheck,
  },
];

export default function TrustCenterPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="border-b border-slate-800 bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-black uppercase tracking-[0.16em] text-slate-300">Institutional Trust Center</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">Evidence before marketing claims.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Elevate separates verified facts, current operational records, benchmarks, and demonstration data. Material public claims should be traceable to evidence and explicitly approved for publication.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 p-6">
            <Database className="h-7 w-7" />
            <h2 className="mt-4 text-xl font-black">Evidence registry</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Public regulatory claims are controlled by production evidence records rather than legacy marketing flags.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-6">
            <ShieldCheck className="h-7 w-7" />
            <h2 className="mt-4 text-xl font-black">Publication controls</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">A claim must be verified and explicitly allowed for public use before it belongs on buyer-facing surfaces.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 p-6">
            <FileCheck2 className="h-7 w-7" />
            <h2 className="mt-4 text-xl font-black">Due-diligence ready</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">Agency and enterprise reviewers can move from a public statement to the corresponding approval, policy, control, or supporting record.</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {areas.map(({ title, description, href, icon: Icon }) => (
            <Link key={href} href={href} className="group rounded-3xl border border-slate-200 p-6 transition hover:border-slate-400 hover:shadow-sm">
              <Icon className="h-7 w-7" />
              <h2 className="mt-4 text-2xl font-black group-hover:underline">{title}</h2>
              <p className="mt-3 leading-7 text-slate-600">{description}</p>
            </Link>
          ))}
        </div>

        <section className="mt-12 rounded-3xl bg-slate-950 p-7 text-white">
          <h2 className="text-2xl font-black">Outcome reporting</h2>
          <p className="mt-3 max-w-4xl leading-7 text-slate-300">
            Outcome metrics should be published only after a defined measurement period, documented methodology, and evidence review. Benchmarks and demonstrations remain labeled as benchmarks or demonstration data rather than represented as historical outcomes.
          </p>
        </section>
      </section>
    </main>
  );
}
