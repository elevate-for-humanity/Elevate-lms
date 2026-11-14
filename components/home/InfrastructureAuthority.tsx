import Link from 'next/link';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { ShieldCheck, BarChart3, LockKeyhole, FileCheck2, Users, BadgeCheck } from 'lucide-react';

const CAPABILITIES = [
  {
    icon: ShieldCheck,
    title: 'Program-Specific Funding Controls',
    desc: 'Public WIOA, ETPL, and Workforce Ready Grant statements are limited to program records with verified evidence and do not guarantee participant authorization.',
  },
  {
    icon: BarChart3,
    title: 'Recorded Outcome Evidence',
    desc: 'Enrollment, completion, credential, intervention, employment, and wage-related records can be retained when the applicable workflow is used.',
  },
  {
    icon: LockKeyhole,
    title: 'Education Data Access Controls',
    desc: 'Authentication, role-based access, tenant scoping, row-level security, consent records, and audit events support protected learner-data administration.',
  },
  {
    icon: FileCheck2,
    title: 'Audit & Reporting Infrastructure',
    desc: 'PIRL mapping/export, compliance-report, apprenticeship, credential, and administrative evidence can be reviewed by authorized roles.',
  },
  {
    icon: Users,
    title: 'Role-Scoped Portals',
    desc: 'Learner, apprentice, employer, partner, workforce, instructor, and administrative experiences are governed through authenticated role and data boundaries.',
  },
  {
    icon: BadgeCheck,
    title: 'Registered Apprenticeship Sponsor Evidence',
    desc: 'The organization maintains U.S. Department of Labor sponsor registration evidence. Individual occupations and participants remain governed by their applicable registered standards.',
  },
];

export default function InfrastructureAuthority() {
  return (
    <section className="border-t border-slate-100 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal direction="left">
            <div>
              <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Workforce infrastructure</p>
              <h2 className="mb-6 text-3xl font-extrabold leading-tight text-slate-900 sm:text-4xl">
                Training delivery backed by inspectable workforce records.
              </h2>
              <p className="mb-8 text-lg text-slate-600">
                Elevate combines public program information with authenticated training, apprenticeship, employer, agency, credential, and reporting workflows. Claims are constrained by the evidence and controls implemented for the exact program or feature.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row">
                <Link href="/platform" className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-8 py-4 font-bold text-white transition-all hover:bg-slate-800">Platform Overview</Link>
                <Link href="/store/compliance" className="inline-flex items-center justify-center rounded-xl border-2 border-slate-300 px-8 py-4 font-semibold text-slate-700 transition-all hover:bg-slate-50">Compliance Controls</Link>
              </div>

              <div className="mt-12 border-t border-slate-200 pt-8">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Evidence model</p>
                <p className="text-sm leading-relaxed text-slate-600">
                  Organization-level sponsor or provider evidence does not automatically make every program funded, approved, certified, or compliant. Program-level regulatory records control those public statements.
                </p>
              </div>
            </div>
          </ScrollReveal>

          <div className="grid gap-4 sm:grid-cols-2">
            {CAPABILITIES.map((cap, index) => {
              const Icon = cap.icon;
              return (
                <ScrollReveal key={cap.title} delay={index * 80} direction="right">
                  <div className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:border-slate-300 hover:shadow-md">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors group-hover:bg-brand-blue-50">
                      <Icon className="h-5 w-5 text-slate-600 transition-colors group-hover:text-brand-blue-600" />
                    </div>
                    <h3 className="mb-1 font-bold text-slate-900">{cap.title}</h3>
                    <p className="text-sm leading-relaxed text-slate-500">{cap.desc}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
