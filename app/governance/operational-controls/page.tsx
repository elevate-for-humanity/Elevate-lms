import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Operational Controls',
  description:
    'Operational controls covering quality assurance, compliance checkpoints, and execution standards for workforce and training delivery.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/governance/operational-controls' },
};

const pillars = [
  {
    title: 'Program Integrity',
    body: 'Structured checkpoints for enrollment quality, attendance tracking, and completion standards.',
  },
  {
    title: 'Funding Controls',
    body: 'Validation of funded pathways, eligibility artifacts, and compliance-ready reporting outputs.',
  },
  {
    title: 'Role Accountability',
    body: 'Clear separation of learner, instructor, employer, and admin responsibilities with auditable actions.',
  },
  {
    title: 'Change Management',
    body: 'Controlled implementation process for operational updates, policy shifts, and platform modifications.',
  },
];

export default function OperationalControlsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Governance', href: '/governance' },
            { label: 'Operational Controls' },
          ]}
        />
      </div>

      <main className="max-w-5xl mx-auto px-6 pb-16">
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">Operational Controls</h1>
          <p className="text-slate-700 mt-3 text-lg">
            Execution standards used to maintain consistency, quality, and compliance across workforce and apprenticeship operations.
          </p>
        </header>

        <section className="grid sm:grid-cols-2 gap-4 mb-10">
          {pillars.map((item) => (
            <article key={item.title} className="rounded-xl border border-slate-200 p-5">
              <h2 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h2>
              <p className="text-sm text-slate-700">{item.body}</p>
            </article>
          ))}
        </section>

        <section className="rounded-xl bg-slate-50 border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-3">Control Scope</h2>
          <ul className="space-y-2 text-slate-700">
            <li>Enrollment intake quality and documentation checks</li>
            <li>Training progress verification and completion review</li>
            <li>Partner-site governance and policy alignment</li>
            <li>Escalation pathways for compliance exceptions</li>
          </ul>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/governance/security" className="px-5 py-2.5 rounded-lg bg-brand-blue-600 text-white hover:bg-brand-blue-700 font-semibold">
              Security Standards
            </Link>
            <Link href="/contact" className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-800 hover:bg-white font-semibold">
              Contact Governance Team
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
