import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Building2, CheckCircle, Globe, Lock, Minus, Server, XCircle } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'License the Platform | Elevate Workforce Infrastructure',
  description: 'Deploy Elevate workforce infrastructure as hosted SaaS, a white-label deployment, or a dedicated contract environment.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/platform/licensing' },
};

type CapabilityValue = boolean | 'partial';
type CapabilityRow = { feature: string; elevate: true; generic: CapabilityValue; moodle: CapabilityValue };

const CAPABILITIES: CapabilityRow[] = [
  { feature: 'WIOA eligibility and funding workflow support', elevate: true, generic: false, moodle: false },
  { feature: 'Apprenticeship hour and competency tracking', elevate: true, generic: false, moodle: false },
  { feature: 'Multi-portal student/employer/staff/partner architecture', elevate: true, generic: false, moodle: 'partial' },
  { feature: 'Compliance and audit reporting', elevate: true, generic: false, moodle: 'partial' },
  { feature: 'Employer talent pipeline and placement tracking', elevate: true, generic: false, moodle: false },
  { feature: 'Course and certificate management', elevate: true, generic: true, moodle: true },
  { feature: 'SCORM support', elevate: true, generic: true, moodle: true },
  { feature: 'White-label branding', elevate: true, generic: true, moodle: 'partial' },
];

const TIERS = [
  {
    icon: Globe,
    title: 'Hosted SaaS',
    subtitle: 'Fastest path to production',
    description: 'A managed branded deployment with hosting, updates, platform operations, and your organization configuration.',
    features: ['Custom branding', 'Managed hosting', 'Platform updates', 'Operational support'],
  },
  {
    icon: Building2,
    title: 'White-Label Deployment',
    subtitle: 'Dedicated organizational experience',
    description: 'A dedicated implementation for organizations that need stronger branding, configuration, and integration control.',
    features: ['Dedicated configuration', 'Custom integrations', 'Branded portals', 'Priority implementation support'],
  },
  {
    icon: Server,
    title: 'Contract Edition',
    subtitle: 'For larger institutional deployments',
    description: 'A scoped deployment for workforce agencies, education providers, and organizations with procurement and reporting requirements.',
    features: ['Implementation documentation', 'Security configuration', 'Reporting controls', 'Dedicated account support'],
  },
];

function CapabilityIcon({ value }: { value: CapabilityValue }) {
  if (value === true) return <CheckCircle className="mx-auto h-5 w-5 text-emerald-600" aria-label="Included" />;
  if (value === 'partial') return <Minus className="mx-auto h-5 w-5 text-amber-600" aria-label="Partial" />;
  return <XCircle className="mx-auto h-5 w-5 text-slate-300" aria-label="Not included" />;
}

export default function LicensingPage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="bg-slate-950 px-6 py-20 text-white lg:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-slate-200">
              <Lock className="h-4 w-4" /> Workforce platform licensing
            </div>
            <h1 className="mt-7 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Workforce infrastructure built around enrollment, compliance, training, apprenticeships, and outcomes.
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              {PLATFORM_DEFAULTS.orgName} uses the same platform operationally. Organizations can deploy the infrastructure without assembling separate LMS, CRM, apprenticeship, compliance, and reporting tools.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/platform/licensing/request" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-950">
                Request licensing brief <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/platform" className="rounded-xl border border-white/25 px-6 py-3 font-bold text-white">Platform overview</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm font-bold uppercase tracking-wider text-brand-blue-700">Why Elevate is different</p>
          <h2 className="mt-2 text-3xl font-black sm:text-4xl">Not a generic course platform with workforce features bolted on.</h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-700">
            The system connects public applications, funding workflows, role-based portals, course delivery, OJT/RTI tracking, credentials, employers, reporting, subscriptions, and automation through one operating model.
          </p>

          <div className="mt-10 overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-4 text-left">Capability</th>
                  <th className="p-4 text-center">Elevate</th>
                  <th className="p-4 text-center">Generic LMS</th>
                  <th className="p-4 text-center">Moodle-style LMS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {CAPABILITIES.map((row) => (
                  <tr key={row.feature}>
                    <td className="p-4 font-medium text-slate-800">{row.feature}</td>
                    <td className="bg-brand-blue-50/40 p-4 text-center"><CapabilityIcon value={row.elevate} /></td>
                    <td className="p-4 text-center"><CapabilityIcon value={row.generic} /></td>
                    <td className="p-4 text-center"><CapabilityIcon value={row.moodle} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-brand-blue-700">Deployment options</p>
            <h2 className="mt-2 text-3xl font-black sm:text-4xl">Choose the operating model that fits your organization.</h2>
          </div>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {TIERS.map((tier) => {
              const Icon = tier.icon;
              return (
                <article key={tier.title} className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100"><Icon className="h-6 w-6" /></div>
                  <h3 className="mt-5 text-2xl font-black">{tier.title}</h3>
                  <p className="mt-1 text-sm font-bold text-brand-blue-700">{tier.subtitle}</p>
                  <p className="mt-4 leading-7 text-slate-700">{tier.description}</p>
                  <ul className="mt-5 space-y-2">
                    {tier.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-700"><CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{feature}</li>)}
                  </ul>
                  <Link href="/platform/licensing/request" className="mt-7 inline-flex items-center gap-2 font-bold text-brand-blue-700">Request details <ArrowRight className="h-4 w-4" /></Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <div className="mx-auto max-w-4xl rounded-3xl bg-slate-950 px-6 py-12 text-white">
          <h2 className="text-3xl font-black">See the platform against your actual workflow.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-slate-300">Bring your enrollment, compliance, program, employer, and reporting requirements. The licensing conversation should show where the platform replaces disconnected systems.</p>
          <Link href="/platform/licensing/request" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-bold text-slate-950">Request licensing brief <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>
    </main>
  );
}
