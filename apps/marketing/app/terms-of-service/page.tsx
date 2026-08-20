import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { LEGAL_ENTITY_OPERATING_LINE } from '@/lib/config/legal-entity';

export const metadata: Metadata = {
  title: `Terms of Service | ${PLATFORM_DEFAULTS.orgName}`,
  description: `Terms governing use of ${PLATFORM_DEFAULTS.orgName} public websites, applications, training services, and platform features.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/terms-of-service' },
};

const sections = [
  {
    title: '1. Scope and acceptance',
    body: 'These Terms govern use of Elevate public websites, applications, learning and apprenticeship technology, testing and credential-support services, and other digital services that link to these Terms. Program-specific enrollment agreements, employer or host-site agreements, funding authorizations, testing rules, and license agreements may add requirements. If a signed agreement conflicts with a general website summary, the applicable signed agreement and governing law control to the extent permitted by law.',
  },
  {
    title: '2. Accounts and authorized use',
    body: 'Users must provide accurate information, protect account credentials, and use only accounts and roles assigned to them. Access controls, tenant boundaries, and role permissions are enforced by the platform. Users may not attempt to access another person’s or organization’s records, bypass security controls, scrape restricted data, interfere with service availability, or use the platform for unlawful activity.',
  },
  {
    title: '3. Training, apprenticeship, and licensing',
    body: 'Program pages describe current training pathways but do not themselves award a professional license, guarantee employment, or replace requirements imposed by a licensing board, certifying body, registered-apprenticeship authority, employer, or government agency. Apprenticeship completion, occupational licensing, testing, and credential issuance depend on the requirements applicable to the specific program and participant.',
  },
  {
    title: '4. Funding and payment',
    body: 'Public funding is program-specific and participant-specific. WIOA, Workforce Ready Grant, or other public funding is not guaranteed by this website. The responsible workforce or government agency determines eligibility, availability, covered costs, and authorization. Self-pay prices, deposits, installment arrangements, refunds, and cancellation terms are governed by the applicable enrollment or purchase agreement and checkout disclosures.',
  },
  {
    title: '5. Content, assessments, and AI-assisted features',
    body: 'Course content, assessments, administrative tools, and AI-assisted features are provided to support training and operations. AI-assisted output may require human review and must not be treated as a substitute for professional, legal, licensing, medical, financial, or government-agency determinations. Users remain responsible for reviewing consequential submissions and decisions before relying on them.',
  },
  {
    title: '6. Privacy, education records, and data',
    body: 'Information is collected and handled according to the Privacy Policy and applicable signed agreements. Access to learner, apprenticeship, employment, testing, and partner records is limited by role and operational need. Where education-record or agency-specific rules apply, the applicable authorization, consent, contract, or law controls disclosure.',
  },
  {
    title: '7. Intellectual property and licensed materials',
    body: 'Elevate software, course materials, branding, documentation, and other protected content may be used only as permitted by law and the applicable license or enrollment terms. Enterprise, program, marketplace, and source-use licenses are governed by their specific agreements and do not arise merely from access to a public page or demonstration.',
  },
  {
    title: '8. Service changes and availability',
    body: 'Features, integrations, schedules, program availability, host-site availability, funding pathways, and third-party services may change. Elevate may maintain, update, suspend, or discontinue a feature when necessary for security, legal compliance, vendor changes, or operations. Material contractual obligations remain governed by the applicable signed agreement.',
  },
  {
    title: '9. Prohibited conduct',
    body: 'Users may not submit malicious code, attempt unauthorized privilege escalation, impersonate another person, falsify training or attendance records, manipulate credential evidence, misuse personal data, infringe intellectual property, abuse payment systems, or use the service in a way that violates law or another person’s rights.',
  },
  {
    title: '10. Disclaimers and limitations',
    body: 'Training outcomes, employment, wages, licensing, funding, certification, host-site placement, and third-party service availability are not guaranteed unless an executed agreement expressly states otherwise. Nothing on the public website should be interpreted as a promise of government funding, professional licensure, employment, or a regulatory certification that has not been expressly documented.',
  },
  {
    title: '11. Suspension and termination',
    body: 'Access may be restricted or terminated for security threats, fraud, material policy violations, nonpayment where payment is required, unauthorized system use, or other grounds permitted by the applicable agreement or law. Required records may be retained after access ends when retention is necessary for legal, audit, credential, apprenticeship, payment, or program obligations.',
  },
  {
    title: '12. Questions and governing documents',
    body: 'These Terms are a general service agreement. Program enrollment, licensing, marketplace purchases, employer participation, host-site participation, data sharing, and other specialized relationships may be governed by additional documents available through the Legal Documents & Policies index.',
  },
] as const;

export default function TermsOfServicePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <section className="bg-slate-950 px-4 py-14 text-white">
        <div className="mx-auto max-w-4xl">
          <p className="text-sm font-black uppercase tracking-[0.15em] text-slate-300">Legal</p>
          <h1 className="mt-3 text-4xl font-black sm:text-5xl">Terms of Service</h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-300">Current public terms governing access to and use of Elevate services.</p>
          <p className="mt-4 text-sm text-slate-400">Operating structure: {LEGAL_ENTITY_OPERATING_LINE}.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-950">
          These Terms do not replace an executed enrollment, apprenticeship, employer, partner, testing, funding, marketplace, or software-license agreement.
        </div>

        <div className="mt-10 space-y-9">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-2xl font-black">{section.title}</h2>
              <p className="mt-3 leading-7 text-slate-700">{section.body}</p>
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-3 border-t border-slate-200 pt-8">
          <Link href="/privacy" className="rounded-lg border border-slate-300 px-5 py-3 font-bold hover:bg-slate-50">Privacy Policy</Link>
          <Link href="/legal" className="rounded-lg border border-slate-300 px-5 py-3 font-bold hover:bg-slate-50">All Legal Documents</Link>
          <Link href="/contact" className="rounded-lg bg-brand-blue-700 px-5 py-3 font-bold text-white hover:bg-brand-blue-800">Contact Us</Link>
        </div>
      </section>
    </main>
  );
}
