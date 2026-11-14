import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: `Privacy practices for ${PLATFORM_DEFAULTS.orgName}, including data collection, use, sharing, retention, security, and privacy requests.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/privacy' },
};

const sections = [
  {
    title: 'Information we collect',
    body: 'Depending on the service you use, we may collect identity and contact information, applications and eligibility documents, enrollment and learning records, attendance and apprenticeship records, testing and credential records, employment or outcome information, billing and transaction records, support communications, and technical information such as device, browser, security, and audit-event data.',
  },
  {
    title: 'How we use information',
    body: 'We use information to process applications, administer programs, deliver learning and testing services, document attendance and apprenticeship activity, support credential and outcome records, communicate with participants and partners, operate and secure the platform, prevent misuse, process payments, meet contractual and regulatory obligations, and improve services using operational or aggregated analysis.',
  },
  {
    title: 'Funding and workforce records',
    body: 'When a participant uses or seeks public workforce funding, information may be processed or shared as required with the responsible workforce agency, case manager, program administrator, employer, training partner, or regulator. Funding eligibility and authorization are determined by the responsible program or agency, not by this privacy policy.',
  },
  {
    title: 'Service providers and partners',
    body: 'We use service providers for functions such as hosting, databases, authentication, communications, payments, analytics, file storage, testing, and operational support. Providers receive information only as needed for their role and are subject to their contractual and legal obligations. We may also disclose information when required by law, to protect rights or safety, or in connection with an authorized organizational transaction.',
  },
  {
    title: 'Payments',
    body: 'Payment-card processing is handled through payment processors. We do not intentionally store full payment-card numbers or card security codes in our application database. We may retain transaction identifiers, amounts, payment status, billing records, refunds, and related accounting information.',
  },
  {
    title: 'Cookies, analytics, and technical data',
    body: 'The website and platform may use cookies, local storage, logs, and first-party or service-provider analytics that are necessary for authentication, security, preferences, performance, troubleshooting, and understanding service usage. Browser controls may allow you to limit some storage, although disabling required storage can affect platform functions.',
  },
  {
    title: 'Retention',
    body: 'We retain records for the period reasonably necessary to provide services, preserve credential and audit evidence, satisfy contracts, resolve disputes, and meet applicable workforce, apprenticeship, tax, testing, education, or other recordkeeping requirements. Retention periods therefore vary by record type and governing program. We do not publish a universal fixed retention period where the applicable requirement may differ.',
  },
  {
    title: 'Security',
    body: 'We use administrative and technical safeguards including authenticated access, role-based authorization, database access policies, logging, encrypted network transport, and managed infrastructure controls. No online system can guarantee absolute security. Suspected incidents are investigated and handled according to applicable obligations and operational procedures.',
  },
  {
    title: 'Education records and participant rights',
    body: 'Where education-record, workforce-program, apprenticeship, or other privacy rules apply, access and disclosure are handled according to the participant relationship, governing agreement, funding source, and applicable law. Requests to access, correct, export, restrict, or delete information are evaluated against identity-verification, legal-retention, audit, credential, and program requirements.',
  },
  {
    title: 'Children and youth programs',
    body: 'Some workforce or youth programs may serve minors. Information for minors is handled within the applicable program, consent, school, workforce, parent or guardian, and legal framework. The general public website is not intended to solicit personal information from children outside an authorized program process.',
  },
  {
    title: 'Changes to this policy',
    body: 'We may update this policy when services, vendors, legal requirements, or data practices change. Material updates are reflected on this page with a revised effective date.',
  },
] as const;

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-4 py-3">
          <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />
        </div>
      </div>

      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-widest text-slate-300">Legal & Privacy</p>
          <h1 className="mt-3 text-4xl font-black">Privacy Policy</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">
            This policy explains how {PLATFORM_DEFAULTS.orgName} processes information across its public website, applications, workforce services, learning systems, testing workflows, and partner operations.
          </p>
          <p className="mt-5 text-sm font-semibold text-slate-400">Effective: August 19, 2026</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          This policy describes platform practices. Program-specific notices, enrollment agreements, workforce-agency requirements, testing-provider terms, or signed partner agreements may impose additional obligations.
        </div>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-black text-slate-950">{section.title}</h2>
              <p className="mt-3 text-base leading-7 text-slate-700">{section.body}</p>
            </section>
          ))}
        </div>

        <section className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <h2 className="text-2xl font-black">Privacy requests and questions</h2>
          <p className="mt-3 leading-7 text-slate-700">
            Use the contact page for privacy requests, questions, corrections, or concerns. We may need to verify identity and authority before releasing or changing protected records.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact" className="rounded-lg bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">Contact us</Link>
            <Link href="/security-and-data-protection" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-100">Security & data protection</Link>
            <Link href="/legal" className="rounded-lg border border-slate-300 bg-white px-5 py-3 font-bold text-slate-900 hover:bg-slate-100">Legal documents</Link>
          </div>
        </section>
      </section>
    </main>
  );
}
