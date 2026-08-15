import Link from 'next/link';
import { BarChart3, Briefcase, CheckSquare, FileText, HeartHandshake, Shield, Users } from 'lucide-react';

const actions = [
  {
    title: 'Workforce Dashboard',
    description: 'View live enrollment, completion, placement, program, and at-risk metrics.',
    href: '/workforce/dashboard',
    icon: BarChart3,
  },
  {
    title: 'Participants',
    description: 'Manage participant records, enrollment status, service delivery, and follow-up.',
    href: '/workforce/participants',
    icon: Users,
  },
  {
    title: 'Placements',
    description: 'Review verified and pending employment placement records.',
    href: '/workforce/placements',
    icon: Briefcase,
  },
  {
    title: 'WIOA Export',
    description: 'Prepare workforce reporting data from the canonical participant records.',
    href: '/workforce/wioa-export',
    icon: FileText,
  },
  {
    title: 'Eligibility',
    description: 'Review workforce-program eligibility using the active eligibility workflow.',
    href: '/workforce/eligibility',
    icon: Shield,
  },
  {
    title: 'Follow-Ups',
    description: 'Track participant follow-up work and required interventions.',
    href: '/workforce/follow-ups',
    icon: CheckSquare,
  },
  {
    title: 'Supportive Services',
    description: 'Manage participant supportive-service activity from the canonical workforce records.',
    href: '/workforce/supportive-services',
    icon: HeartHandshake,
  },
] as const;

export default function WorkforcePortal() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-violet-700">Workforce Portal</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-950">Workforce Development Operations</h1>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            Use the canonical workforce tools for participants, outcomes, placements, compliance evidence,
            reporting, eligibility, and supportive services. Operational metrics are calculated from live
            records on the Workforce Dashboard rather than hard-coded on this landing page.
          </p>
          <Link
            href="/workforce/dashboard"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-violet-700 px-5 py-3 font-bold text-white hover:bg-violet-800"
          >
            <BarChart3 className="h-5 w-5" /> Open Live Dashboard
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {actions.map(({ title, description, href, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-violet-300 hover:shadow-md"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700 group-hover:bg-violet-100">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
