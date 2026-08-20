import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, Award, ShieldCheck, FileCheck2, Users, GraduationCap } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Training Providers & Program Holders | Elevate Workforce Hub',
  description:
    'Canonical provider partnership, program-governance, credential-authority, data-access, and onboarding requirements for the Elevate workforce platform.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/providers' },
};

const requirements = [
  'A verifiable legal organization and responsible point of contact.',
  'A defined program, delivery model, curriculum, instructional-hour structure, and learner-support plan.',
  'Documented instructor or supervisor qualifications appropriate to the program being delivered.',
  'A clearly identified credential or competency authority where a third-party credential is represented.',
  'Agreement to role, data, privacy, reporting, attendance, audit, and document responsibilities before activation.',
  'Program-level regulatory evidence before ETPL, WIOA, Workforce Ready Grant, apprenticeship, or other approval language is displayed publicly.',
];

const controls = [
  {
    icon: GraduationCap,
    title: 'Course & Learner Workflows',
    description: 'Authorized providers can work with program, course, learner, attendance, progress, and completion records through role-scoped application surfaces.',
  },
  {
    icon: Award,
    title: 'Credential Authority Separation',
    description: 'The platform records credential pathways and issued certificate evidence. It does not give a provider authority to issue a third-party certification merely because that credential appears in a program.',
  },
  {
    icon: ShieldCheck,
    title: 'Program-Specific Funding Evidence',
    description: 'Funding and regulatory statements are controlled by verified program records. Provider participation does not automatically make every program publicly funded or approved.',
  },
  {
    icon: FileCheck2,
    title: 'Compliance Evidence',
    description: 'Documents, attendance, progress, apprenticeship records, credentials, regulatory evidence, exceptions, and audit events can be retained for authorized review.',
  },
  {
    icon: Users,
    title: 'Role & Tenant Boundaries',
    description: 'Provider access is governed through authentication, role checks, tenant or organization relationships, and Supabase row-level security where applicable.',
  },
  {
    icon: Building2,
    title: 'Employer & Worksite Relationships',
    description: 'Provider, employer, host-shop, placement, and apprenticeship relationships are maintained as explicit records instead of being inferred from a marketing page.',
  },
];

const steps = [
  ['1', 'Apply', 'Submit the appropriate provider or program-holder application with organizational and program information.'],
  ['2', 'Verify', 'Review legal identity, responsible contacts, qualifications, credential authority, and required program evidence.'],
  ['3', 'Approve Program', 'Evaluate each proposed program individually; an organization approval does not automatically approve every program.'],
  ['4', 'Execute Agreement', 'Complete the applicable MOU, data, operational, payment, and responsibility agreements before production activation.'],
  ['5', 'Provision Access', 'Create the authorized organization, staff roles, programs, and required workflow relationships in the platform.'],
  ['6', 'Operate & Review', 'Use canonical records for learners, attendance, progress, credentials, reporting, exceptions, and continuing program review.'],
] as const;

export default function ProvidersPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="border-b bg-white">
        <div className="mx-auto max-w-6xl px-4 py-3"><Breadcrumbs items={[{ label: 'Platform', href: '/platform' }, { label: 'Providers' }]} /></div>
      </div>

      <section className="bg-slate-950 px-4 py-20 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-blue-300">Canonical provider pathway</p>
          <h1 className="mt-4 max-w-4xl text-4xl font-black sm:text-5xl">Training Providers &amp; Program Holders</h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-slate-200">
            Provider participation is governed through verified organizational relationships, program-level approval, credential-authority separation, explicit agreements, role-scoped access, and evidence-backed regulatory claims.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/apply/program-holder" className="inline-flex items-center gap-2 rounded-xl bg-brand-red-600 px-7 py-3.5 font-bold text-white hover:bg-brand-red-700">Apply as Program Holder <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact?subject=Training+Provider" className="rounded-xl border border-white/30 px-7 py-3.5 font-bold text-white hover:bg-white/10">Provider Inquiry</Link>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-slate-950">Minimum provider requirements</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {requirements.map((requirement) => (
              <div key={requirement} className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm leading-relaxed text-slate-700">{requirement}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-slate-950">Platform controls available to approved providers</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {controls.map(({ icon: Icon, title, description }) => (
              <div key={title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50"><Icon className="h-5 w-5 text-blue-700" /></div>
                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-3xl font-black text-slate-950">Controlled onboarding lifecycle</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {steps.map(([step, title, description]) => (
              <div key={step} className="rounded-2xl border border-slate-200 p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-950 font-black text-white">{step}</div>
                <h3 className="mt-4 font-bold text-slate-950">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-brand-red-700 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-black">Provider acceptance is evidence-based</h2>
          <p className="mx-auto mt-4 max-w-3xl text-red-100">No timeline, funding access, credential authority, enrollment volume, revenue, outcome, or regulatory approval is guaranteed by becoming a provider. Those items depend on the approved program, agreement, evidence, responsible authority, and actual operating records.</p>
          <Link href="/licenses/enterprise-review" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-bold text-brand-red-700 hover:bg-red-50">Review Enterprise Controls <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </div>
  );
}
