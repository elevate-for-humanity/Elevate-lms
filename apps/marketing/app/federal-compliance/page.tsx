import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Federal Compliance & Program Controls',
  description: 'Federal and workforce-program compliance controls, responsibilities, disclosures, and supporting policy links for Elevate for Humanity.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/federal-compliance' },
};

const controlAreas = [
  {
    title: 'WIOA and workforce funding',
    text: 'Funding eligibility is program-specific and participant-specific. Public pages must not represent every Elevate program as WIOA, ETPL, or Workforce Ready Grant approved. The platform maintains program records, funding evidence, applications, participant records, services, outcome fields, PIRL mappings, export records, and reporting history so authorized staff can document the applicable workforce process.',
  },
  {
    title: 'Registered apprenticeship',
    text: 'Registered apprenticeship administration is separated from general course delivery. Sponsor, occupation, employer, apprentice, OJL/RTI, wage, competency, attendance, and completion evidence must map to the applicable registered standards. Host employers operate within the sponsor structure and are not represented as separately registered sponsors unless independent evidence exists.',
  },
  {
    title: 'Education and participant records',
    text: 'Access to participant and learner information is controlled through authentication, role-based authorization, database policies, and audit logging. Disclosure rules depend on the record, participant relationship, governing agreement, funding source, and applicable law. The platform does not treat a technical control by itself as proof of legal compliance.',
  },
  {
    title: 'Accessibility and accommodations',
    text: 'Elevate maintains an accessibility program and works toward WCAG Level AA conformance for public and authenticated digital experiences. Accessibility is treated as an ongoing testing and remediation obligation, not as a blanket certification. Accommodation requests are handled through the applicable program and contact process.',
  },
  {
    title: 'Equal opportunity and nondiscrimination',
    text: 'Elevate maintains nondiscrimination and equal-opportunity policies for programs and services. The exact notice, complaint route, protected categories, and agency process may depend on the governing workforce program, employment relationship, education activity, or other applicable law.',
  },
  {
    title: 'Security and auditability',
    text: 'The platform uses authenticated access, authorization controls, row-level database policies, event and administrative logging, secure network transport, managed infrastructure, and production release checks. These are operational controls; they are not represented as third-party certifications unless a current independent certification record is available.',
  },
] as const;

export default function FederalCompliancePage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Legal', href: '/legal' }, { label: 'Federal Compliance' }]} />
        </div>
      </div>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Governance & Controls</p>
          <h1 className="mt-3 text-4xl font-black">Federal Compliance & Program Controls</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            {PLATFORM_DEFAULTS.orgName} documents the controls used to support workforce, apprenticeship, privacy, accessibility, security, and equal-opportunity obligations. Approval and compliance statements are limited to the exact program, record, or authority supported by evidence.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          This page is a control summary, not a legal opinion or blanket certification. Requirements can differ by program, funding source, regulator, credential authority, contract, location, and participant.
        </div>

        <div className="mt-10 space-y-6">
          {controlAreas.map((area) => (
            <section key={area.title} className="rounded-2xl border border-slate-200 p-6">
              <h2 className="text-2xl font-black text-slate-950">{area.title}</h2>
              <p className="mt-3 leading-7 text-slate-700">{area.text}</p>
            </section>
          ))}
        </div>

        <section className="mt-10 rounded-2xl bg-slate-50 p-6">
          <h2 className="text-2xl font-black">Related evidence and policies</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Link href="/privacy" className="rounded-lg border border-slate-200 bg-white p-4 font-bold hover:bg-slate-100">Privacy Policy</Link>
            <Link href="/accessibility" className="rounded-lg border border-slate-200 bg-white p-4 font-bold hover:bg-slate-100">Accessibility Statement</Link>
            <Link href="/security-and-data-protection" className="rounded-lg border border-slate-200 bg-white p-4 font-bold hover:bg-slate-100">Security & Data Protection</Link>
            <Link href="/equal-opportunity" className="rounded-lg border border-slate-200 bg-white p-4 font-bold hover:bg-slate-100">Equal Opportunity</Link>
            <Link href="/approvals" className="rounded-lg border border-slate-200 bg-white p-4 font-bold hover:bg-slate-100">Approvals & Evidence</Link>
            <Link href="/legal" className="rounded-lg border border-slate-200 bg-white p-4 font-bold hover:bg-slate-100">Legal Document Index</Link>
          </div>
        </section>

        <div className="mt-10 text-center">
          <Link href="/contact" className="inline-flex rounded-lg bg-brand-blue-700 px-6 py-3 font-bold text-white hover:bg-brand-blue-800">Contact us about a compliance requirement</Link>
        </div>
      </section>
    </main>
  );
}
