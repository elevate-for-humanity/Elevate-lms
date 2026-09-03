import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Enterprise Platform Review | Elevate for Humanity',
  description:
    'Buyer-facing review of Elevate for Humanity platform architecture, security, compliance controls, licensing scope, and validation requirements.',
  alternates: { canonical: 'https://www.elevateforhumanity.org/licenses/enterprise-review' },
};

const sections = [
  {
    title: 'Platform scope',
    body: 'The enterprise platform includes organization administration, learning management, course and assessment delivery, workforce and apprenticeship workflows, reporting, credential records, and role-based portals. Exact capabilities are confirmed during technical review and acceptance testing.',
  },
  {
    title: 'Security and access controls',
    body: 'Production review covers authentication, role-based authorization, tenant isolation, database row-level security, protected administrative routes, audit logging, secret management, transport encryption, dependency controls, and release validation. Security controls must be demonstrated in the deployed environment; this page does not represent a third-party certification.',
  },
  {
    title: 'Privacy and regulated data',
    body: 'Organizations should complete a data-flow and privacy review before production use. Contractual requirements, retention periods, authorized roles, subprocessors, incident procedures, and any FERPA or workforce-program obligations are documented for the customer deployment and use case.',
  },
  {
    title: 'AI-assisted capabilities',
    body: 'Where enabled, AI may assist with curriculum generation, administrative workflows, analysis, and learner-support functions. AI output is subject to validation and human oversight where required. AI functionality is not represented as an autonomous compliance determination or government decision-making system.',
  },
  {
    title: 'Credential verification',
    body: 'Issued credentials can be checked against the platform credential record using a certificate number and public verification workflow. Any stronger claim, including blockchain anchoring, applies only when the deployed credential record contains verifiable anchoring evidence for that credential.',
  },
  {
    title: 'Availability and acceptance',
    body: 'A production purchase should include documented acceptance criteria for critical routes, authentication, authorization, course publishing and delivery, reporting, backups, recovery, accessibility, performance, and deployment health. Service levels and support commitments are contractual and are not implied by marketing copy.',
  },
];

export default function EnterpriseReviewPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <section className="bg-slate-950 px-4 py-16 text-white">
        <div className="mx-auto max-w-5xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">Enterprise due diligence</p>
          <h1 className="mt-3 text-4xl font-black md:text-5xl">Platform review and validation</h1>
          <p className="mt-5 max-w-3xl text-lg text-slate-300">
            This review separates implemented platform capabilities from claims that require customer-specific, deployment-specific, or independent evidence.
          </p>
        </div>
      </section>

      <section className="px-4 py-12">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="text-xl font-black">Evidence standard</h2>
            <p className="mt-2 text-slate-700">
              Elevate does not treat a marketing statement as audit evidence. Certifications, approval status, performance statistics, security attestations, funding eligibility, and third-party relationships must be supported by current records before they are represented as verified facts.
            </p>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {sections.map((section) => (
              <article key={section.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-black">{section.title}</h2>
                <p className="mt-3 leading-7 text-slate-700">{section.body}</p>
              </article>
            ))}
          </div>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-black">Enterprise acceptance checklist</h2>
            <ul className="mt-4 grid gap-3 text-slate-700 md:grid-cols-2">
              {[
                'Architecture and data-flow review',
                'Authentication, RBAC and tenant-isolation tests',
                'Database RLS and privileged-access review',
                'Audit-log and administrative-action validation',
                'Course create, publish, enroll, assess and complete test',
                'Credential issuance and verification test',
                'Accessibility and keyboard-navigation review',
                'Security headers and dependency review',
                'Backup and recovery procedure review',
                'Performance and deployment-health validation',
                'Privacy, retention and incident-process review',
                'Contractual SLA and support-scope review',
              ].map((item) => <li key={item}>• {item}</li>)}
            </ul>
          </section>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/licenses" className="rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800">Review licensing</Link>
            <Link href="/security" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold hover:bg-slate-100">Security & data</Link>
            <Link href="/contact" className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold hover:bg-slate-100">Request technical review</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
