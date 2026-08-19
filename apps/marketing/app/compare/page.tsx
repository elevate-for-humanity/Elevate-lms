import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Building2, GraduationCap, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Compare Platform Options',
  description: 'Compare Elevate platform options for individual practitioners, training organizations, and enterprise workforce operations.',
};

const options = [
  {
    name: 'Individual',
    description: 'For an individual practitioner evaluating core learning and course-delivery workflows.',
    icon: GraduationCap,
    features: ['Core learning workflows', 'Course delivery and progress records', 'Participant records', 'Standard support channels'],
  },
  {
    name: 'Organization',
    description: 'For training organizations coordinating learners, staff, programs, and operational workflows.',
    icon: Building2,
    features: ['Organization workspaces', 'Role-based staff access', 'Expanded reporting workflows', 'Configured automation and integrations'],
  },
  {
    name: 'Enterprise',
    description: 'For larger workforce, education, or multi-program operations requiring contract-scoped capacity and controls.',
    icon: ShieldCheck,
    features: ['Capacity sized to contracted requirements', 'Multi-role and multi-program operations', 'Integration and deployment options', 'Security, audit, and release controls'],
  },
];

const comparisonRows = [
  ['Learning management', 'Included', 'Included', 'Included'],
  ['Course and assessment workflows', 'Included', 'Included', 'Included'],
  ['Role-based staff administration', 'Limited', 'Included', 'Included'],
  ['Employer / partner workflows', 'As configured', 'As configured', 'As configured'],
  ['Apprenticeship workflows', 'As configured', 'As configured', 'As configured'],
  ['Custom integrations', 'Not standard', 'Optional', 'Contract scoped'],
  ['SSO / advanced identity', 'Not standard', 'Optional', 'Contract scoped'],
  ['Capacity', 'Plan scoped', 'Plan scoped', 'Contract scoped'],
  ['Availability commitment', 'Service terms', 'Service terms', 'Contract terms'],
];

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <section className="bg-slate-950 py-20 text-white">
        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-orange-400">Platform options</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Compare the operating model, not unsupported promises.</h1>
          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Choose an option based on the workflows, controls, integrations, and capacity your organization actually requires. Final limits, support terms, and service commitments are governed by the applicable plan or contract.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/demo" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-950">Request a Demo <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/contact" className="inline-flex items-center justify-center rounded-xl border border-white/30 px-6 py-3 font-bold text-white">Discuss Requirements</Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <article key={option.name} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-100"><Icon className="h-6 w-6 text-brand-blue-700" /></div>
                <h2 className="mt-5 text-2xl font-black text-slate-950">{option.name}</h2>
                <p className="mt-2 min-h-20 leading-7 text-slate-600">{option.description}</p>
                <ul className="mt-6 space-y-3">
                  {option.features.map((feature) => <li key={feature} className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />{feature}</li>)}
                </ul>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-black text-slate-950">Capability comparison</h2>
          <p className="mx-auto mt-3 max-w-3xl text-center leading-7 text-slate-600">This table describes product scope. It does not create an uptime, storage, learner-count, response-time, or support guarantee outside the applicable plan or signed agreement.</p>
          <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[760px] border-collapse bg-white text-left">
              <thead className="bg-slate-900 text-white"><tr><th className="p-4">Capability</th><th className="p-4">Individual</th><th className="p-4">Organization</th><th className="p-4">Enterprise</th></tr></thead>
              <tbody>{comparisonRows.map(([label, individual, organization, enterprise]) => <tr key={label} className="border-t border-slate-200"><th className="p-4 font-bold text-slate-900">{label}</th><td className="p-4 text-slate-700">{individual}</td><td className="p-4 text-slate-700">{organization}</td><td className="p-4 text-slate-700">{enterprise}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h2 className="text-3xl font-black text-slate-950">Need a procurement-ready scope?</h2>
          <p className="mx-auto mt-3 max-w-2xl leading-7 text-slate-600">Map required roles, integrations, data controls, capacity, deployment responsibilities, and acceptance criteria before a purchase decision.</p>
          <Link href="/contact" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-7 py-3 font-bold text-white hover:bg-brand-blue-800">Discuss Enterprise Scope <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
