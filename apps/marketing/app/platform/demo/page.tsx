import type { Metadata } from 'next';
import Link from 'next/link';
import { BadgeCheck, BookOpenCheck, BriefcaseBusiness, Building2, ClipboardCheck, FileArchive, GraduationCap, ShieldCheck, TimerReset, UsersRound } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Platform Demo,
  description: 'A public, synthetic demonstration of Elevate workforce, apprenticeship, compliance, and training workflows.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/demo' },
};

const personas = [
  { role: 'Learner', name: 'Jordan Demo', org: 'Elevate Demo Organization', icon: GraduationCap, focus: 'Enrollment, training, progress, credentials' },
  { role: 'Apprentice', name: 'Taylor Demo', org: 'Demo Host Shop', icon: TimerReset, focus: 'OJT hours, RTI, competencies, verification' },
  { role: 'Employer', name: 'Morgan Demo', org: 'Demo Employer', icon: BriefcaseBusiness, focus: 'Apprentices, hour verification, compliance' },
  { role: 'Workforce Board', name: 'Avery Demo', org: 'Demo Workforce Board', icon: Building2, focus: 'Participants, evidence, aggregate reporting' },
];

const journey = [
  { label: 'Referral & intake', detail: 'Synthetic participant enters an agency or program workflow.', icon: UsersRound },
  { label: 'Digital binder', detail: 'Required documents and evidence are organized by lifecycle stage.', icon: FileArchive },
  { label: 'Training', detail: 'Course progress and related instruction are tracked in the learning environment.', icon: BookOpenCheck },
  { label: 'OJT & competency', detail: 'Hands-on hours and competencies are recorded for verification.', icon: TimerReset },
  { label: 'Employer verification', detail: 'Authorized employer or host-site users review required activity.', icon: ClipboardCheck },
  { label: 'Credential & completion', detail: 'Completion and credential workflows can be reviewed without exposing real participant records.', icon: BadgeCheck },
];

export default function PlatformDemoPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-black text-emerald-200">
            <ShieldCheck className="h-4 w-4" /> Synthetic demonstration data only
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl">See how the platform connects workforce, training, apprenticeship, and compliance operations.</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">This public demo uses invented personas and example activity. It is intentionally separated from production participant records and is not presented as historical outcome data.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/procurement" className="rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950">Procurement center</Link>
            <Link href="/trust" className="rounded-xl border border-slate-600 px-5 py-3 text-sm font-black text-white">Trust center</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-black">Demo personas</h2>
        <p className="mt-3 max-w-3xl leading-7 text-slate-600">The demo is structured around role-based views so buyers can evaluate what different users need to see without using live student, apprentice, employer, or agency data.</p>
        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {personas.map(({ role, name, org, icon: Icon, focus }) => (
            <article key={role} className="rounded-3xl border border-slate-200 bg-white p-6">
              <Icon className="h-7 w-7" />
              <p className="mt-4 text-xs font-black uppercase tracking-wider text-slate-500">{role}</p>
              <h3 className="mt-1 text-xl font-black">{name}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-600">{org}</p>
              <p className="mt-4 text-sm leading-6 text-slate-600">{focus}</p>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
          <h2 className="text-3xl font-black">Guided lifecycle</h2>
          <div className="mt-7 grid gap-4 lg:grid-cols-3">
            {journey.map(({ label, detail, icon: Icon }, index) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <Icon className="h-6 w-6" />
                  <span className="text-xs font-black text-slate-400">0{index + 1}</span>
                </div>
                <h3 className="mt-4 font-black">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl bg-slate-950 p-7 text-white">
            <ShieldCheck className="h-7 w-7" />
            <h2 className="mt-4 text-2xl font-black">What this demo proves</h2>
            <p className="mt-3 leading-7 text-slate-300">It demonstrates the intended workflow and buyer experience. It does not prove production uptime, historical outcomes, certification status, or agency approval. Those belong in the evidence registry and Trust Center.</p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-7">
            <ClipboardCheck className="h-7 w-7" />
            <h2 className="mt-4 text-2xl font-black">Due-diligence path</h2>
            <p className="mt-3 leading-7 text-slate-600">Buyers can move from the demo to regulatory evidence, security information, accessibility, implementation questions, and procurement materials without relying on unsupported performance claims.</p>
            <Link href="/approvals" className="mt-5 inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-black text-white">Review evidence</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
