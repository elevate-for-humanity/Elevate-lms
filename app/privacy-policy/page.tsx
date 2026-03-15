import { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

const SITE_URL = 'https://www.elevateforhumanity.org';
const EFFECTIVE_DATE = 'February 17, 2026';
const LEGAL_ENTITY = '2Exclusive LLC-S (d/b/a Elevate for Humanity Career & Technical Institute)';
const ORG_NAME = 'Elevate for Humanity';
const ORG_FULL = `${ORG_NAME}, operated by ${LEGAL_ENTITY}`;
const PARTNER_ENTITY = 'Selfish Inc. (d/b/a Rise Forward Foundation)';
const ORG_EMAIL = 'privacy@elevateforhumanity.org';
const ORG_PHONE = '(317) 314-3757';
const ORG_ADDRESS = 'Indianapolis, IN 46240';

export const metadata: Metadata = {
  title: 'Privacy Policy | Elevate for Humanity',
  description:
    'Privacy policy for Elevate for Humanity / Technical Career Institute. How we collect, use, share, and protect personal information in compliance with FERPA, WIOA, and Indiana state law.',
  alternates: { canonical: `${SITE_URL}/privacy-policy` },
};

function Section({ id, number, title, children }: { id: string; number: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-baseline gap-3">
        <span className="text-brand-blue-600 font-mono text-sm">{number}</span>
        {title}
      </h2>
      <div className="text-slate-700 leading-relaxed space-y-4 pl-8">
        {children}
      </div>
    </section>
  );
}

const tocItems = [
  { id: 'scope', label: 'Scope' },
  { id: 'info-collected', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Information' },
  { id: 'info-sharing', label: 'Information Sharing & Disclosure' },
  { id: 'ferpa', label: 'FERPA & Education Records' },
  { id: 'wioa', label: 'WIOA & Workforce Reporting' },
  { id: 'cookies', label: 'Cookies & Tracking' },
  { id: 'data-security', label: 'Data Security' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'children', label: "Children's Privacy" },
  { id: 'third-party', label: 'Third-Party Services' },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Information' },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white">      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-slate-900 text-white py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Privacy Policy</h1>
          <p className="text-slate-300 text-lg mb-1">{ORG_NAME}</p>
          <p className="text-slate-400 text-sm">Effective Date: {EFFECTIVE_DATE}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-[260px_1fr] gap-12">

          {/* Table of Contents — sticky sidebar */}
          <nav className="hidden lg:block">
            <div className="sticky top-24">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Contents</h3>
              <ul className="space-y-2 text-sm">
                {tocItems.map((item, i) => (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      className="text-slate-600 hover:text-brand-blue-600 transition-colors flex items-baseline gap-2"
                    >
                      <span className="text-slate-400 font-mono text-xs">{String(i + 1).padStart(2, '0')}</span>
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
              <div className="mt-8 pt-6 border-t border-slate-200">
                <p className="text-xs text-slate-400 mb-2">Related Policies</p>
                <ul className="space-y-1.5 text-sm">
                  <li><Link href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms of Service</Link></li>
                  <li><Link href="/accessibility" className="text-brand-blue-600 hover:underline">Accessibility Statement</Link></li>
                  <li><Link href="/disclosures" className="text-brand-blue-600 hover:underline">Disclosures</Link></li>
                </ul>
              </div>
            </div>
          </nav>

          {/* Policy Content */}
          <div className="space-y-12">

            {/* Intro */}
            <div className="bg-brand-blue-50 border border-brand-blue-200 rounded-xl p-6">
              <p className="text-slate-800 leading-relaxed">
                {ORG_FULL} (&quot;Company,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting the privacy of students,
                applicants, employers, and visitors who use our website, learning management system, and
                workforce training services. {LEGAL_ENTITY} is the data controller and legal operator
                of all services provided under the {ORG_NAME} brand. This policy describes how we collect,
                use, share, and safeguard personal information in compliance with the Family Educational
                Rights and Privacy Act (FERPA), the Workforce Innovation and Opportunity Act (WIOA),
                Indiana state privacy law, and other applicable regulations.
              </p>
            </div>

            {/* 01 Scope */}
            <Section id="scope" number="01" title="Scope">
              <p>This policy applies to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>The website at <strong>www.elevateforhumanity.org</strong> and all subdomains</li>
                <li>Our learning management system (LMS) and student portal</li>
                <li>Online enrollment, application, and payment forms</li>
                <li>Career services, job placement, and employer partnership tools</li>
                <li>Services delivered in partnership with Rise Forward Foundation</li>
                <li>Communications via email, phone, text, and chat</li>
              </ul>
            </Section>

            {/* 02 Information We Collect */}
            <Section id="info-collected" number="02" title="Information We Collect">
              <p><strong>Information you provide directly:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Full name, date of birth, Social Security Number (for funding eligibility and tax services only)</li>
                <li>Email address, phone number, and mailing address</li>
                <li>Educational background, employment history, and military service status</li>
                <li>Program enrollment selections and scheduling preferences</li>
                <li>Financial information for tuition payments (processed by Stripe; we do not store card numbers)</li>
                <li>Tax return information (for tax preparation clients only, stored encrypted and governed by a separate addendum)</li>
                <li>Documents you upload (ID, transcripts, certifications, W-2s)</li>
              </ul>

              <p><strong>Information collected automatically:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>IP address, browser type, device type, and operating system</li>
                <li>Pages visited, time spent, and referral source</li>
                <li>Course progress, quiz scores, and completion status (for enrolled students)</li>
              </ul>

              <p><strong>Information from third parties:</strong></p>
              <ul className="list-disc pl-6 space-y-1">
                <li>WorkOne and Indiana DWD (funding eligibility verification)</li>
                <li>JotForm (application and intake form submissions)</li>
                <li>Employer partners (job placement outcomes)</li>
              </ul>
            </Section>

            {/* 03 How We Use Information */}
            <Section id="how-we-use" number="03" title="How We Use Information">
              <ul className="list-disc pl-6 space-y-1">
                <li>Process enrollment applications and determine funding eligibility</li>
                <li>Deliver training programs, track progress, and issue certifications</li>
                <li>Provide career services including resume assistance and job placement</li>
                <li>Process tuition payments and workforce funding</li>
                <li>Prepare and file tax returns (tax preparation clients, governed by separate addendum)</li>
                <li>Communicate about programs, schedules, and deadlines</li>
                <li>Comply with WIOA, WRG, JRI, and DOL reporting requirements</li>
                <li>Report apprenticeship outcomes to the U.S. Department of Labor</li>
                <li>Improve our programs, website, and services</li>
                <li>Prevent fraud and protect the security of our systems</li>
              </ul>
            </Section>

            {/* 04 Information Sharing */}
            <Section id="info-sharing" number="04" title="Information Sharing & Disclosure">
              <p>We do <strong>not</strong> sell personal information to third parties. We may share information with:</p>

              <div className="bg-white rounded-lg p-5 space-y-3">
                <div>
                  <p className="font-semibold text-slate-900">Workforce Development Agencies</p>
                  <p className="text-sm">Indiana DWD, WorkOne, EmployIndy — as required for WIOA, WRG, and JRI funding compliance and outcome reporting.</p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-900">U.S. Department of Labor</p>
                  <p className="text-sm">Registered Apprenticeship program data, completion rates, and wage outcomes as required by 29 CFR Part 29.</p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-900">Employer Partners</p>
                  <p className="text-sm">With your written consent only — name, certifications earned, and program completion status for job placement.</p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-900">Certification Bodies</p>
                  <p className="text-sm">OSHA, HSI, state licensing boards — to verify and issue industry credentials.</p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-900">Service Providers</p>
                  <p className="text-sm">Supabase (database), Stripe (payments), Netlify (hosting), Cloudflare (CDN/storage), Resend (email), Sentry (error monitoring), Google Analytics (analytics), OpenAI (AI features) — bound by data processing agreements.</p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-900">Rise Forward Foundation (Supportive Services)</p>
                  <p className="text-sm">We may share limited information with Selfish Inc. (d/b/a Rise Forward Foundation) to coordinate supportive services, including mental wellness programming (CurvatureBody Sculpting). We share the minimum necessary data and require appropriate safeguards.</p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-900">Training Partners</p>
                  <p className="text-sm">We may share limited information with training partners (e.g., Choice Medical CNA School) when required to deliver instruction, clinical components, attendance verification, credentialing, or program administration.</p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-900">IRS</p>
                  <p className="text-sm">Tax return data for tax preparation clients — transmitted via IRS Modernized e-File (MeF) system with end-to-end encryption. Governed by a separate privacy addendum.</p>
                </div>
                <div className="border-t border-slate-200 pt-3">
                  <p className="font-semibold text-slate-900">Legal Authorities</p>
                  <p className="text-sm">When required by law, subpoena, court order, or to protect the safety of individuals.</p>
                </div>
              </div>
            </Section>

            {/* 05 FERPA */}
            <Section id="ferpa" number="05" title="FERPA & Education Records">
              <p>
                As a training provider, we comply with the Family Educational Rights and Privacy Act
                (FERPA), 20 U.S.C. § 1232g. Student education records are protected and will not be
                disclosed without written consent except as permitted by FERPA, including:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>To school officials with legitimate educational interest</li>
                <li>To comply with a judicial order or lawfully issued subpoena</li>
                <li>To authorized representatives for audit or evaluation purposes</li>
                <li>In connection with workforce funding</li>
                <li>To accrediting organizations</li>
              </ul>
              <p>
                Students have the right to inspect their education records, request amendments, and
                file complaints with the U.S. Department of Education.
              </p>
            </Section>

            {/* 06 WIOA */}
            <Section id="wioa" number="06" title="WIOA & Workforce Reporting">
              <p>
                Participants enrolled through WIOA, Workforce Ready Grant (WRG), or Job-Ready
                Incentive (JRI) funding are subject to federal and state reporting requirements.
                We are required to report:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Enrollment and completion data</li>
                <li>Credential attainment</li>
                <li>Employment outcomes and wage data (quarters 2 and 4 after exit)</li>
                <li>Demographic information for EEO compliance</li>
              </ul>
              <p>
                This data is reported to Indiana DWD and the U.S. Department of Labor through
                secure, authorized channels. It is used solely for program evaluation and compliance.
              </p>
            </Section>

            {/* 07 Cookies */}
            <Section id="cookies" number="07" title="Cookies & Tracking">
              <p>Our website uses the following types of cookies:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-white">
                    <tr>
                      <th className="text-left p-3 font-semibold border-b">Type</th>
                      <th className="text-left p-3 font-semibold border-b">Purpose</th>
                      <th className="text-left p-3 font-semibold border-b">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Session</td>
                      <td className="p-3">Authentication, login state</td>
                      <td className="p-3">Yes</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Preferences</td>
                      <td className="p-3">Language, theme, cookie consent</td>
                      <td className="p-3">Yes</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Analytics</td>
                      <td className="p-3">Page views, traffic sources (anonymized)</td>
                      <td className="p-3">Optional</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">Marketing</td>
                      <td className="p-3">Not used</td>
                      <td className="p-3">N/A</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                You can manage cookie preferences through your browser settings. Disabling session
                cookies may prevent you from accessing the student portal and LMS.
              </p>
            </Section>

            {/* 08 Data Security */}
            <Section id="data-security" number="08" title="Data Security">
              <p>We protect personal information through:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>TLS/SSL encryption for all data in transit</li>
                <li>Encryption at rest for sensitive data (SSN, tax records)</li>
                <li>Row-level security (RLS) policies on all database tables</li>
                <li>Role-based access control for staff and administrators</li>
                <li>Regular security monitoring and error tracking</li>
                <li>Service role key isolation (never exposed to client-side code)</li>
                <li>Rate limiting on public-facing API endpoints</li>
              </ul>
              <p>
                No system is 100% secure. If you believe your account has been compromised,
                contact us immediately at <a href={`mailto:${ORG_EMAIL}`} className="text-brand-blue-600 hover:underline">{ORG_EMAIL}</a>.
              </p>
            </Section>

            {/* 09 Data Retention */}
            <Section id="data-retention" number="09" title="Data Retention">
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-white">
                    <tr>
                      <th className="text-left p-3 font-semibold border-b">Data Type</th>
                      <th className="text-left p-3 font-semibold border-b">Retention Period</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">Student education records</td>
                      <td className="p-3">7 years after last enrollment</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">WIOA/WRG/JRI participant data</td>
                      <td className="p-3">Per federal retention schedule (typically 3-7 years)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Apprenticeship records</td>
                      <td className="p-3">5 years after program completion (29 CFR 29.7)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Tax return data</td>
                      <td className="p-3">7 years (IRS requirement)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Payment records</td>
                      <td className="p-3">7 years</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Website analytics</td>
                      <td className="p-3">26 months (anonymized)</td>
                    </tr>
                    <tr>
                      <td className="p-3">Account data (after deletion request)</td>
                      <td className="p-3">30 days, then permanently deleted</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            {/* 10 Your Rights */}
            <Section id="your-rights" number="10" title="Your Rights">
              <p>You have the right to:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li><strong>Access</strong> — Request a copy of the personal information we hold about you</li>
                <li><strong>Correction</strong> — Request correction of inaccurate or incomplete information</li>
                <li><strong>Deletion</strong> — Request deletion of your information, subject to legal retention requirements</li>
                <li><strong>Portability</strong> — Request your data in a machine-readable format</li>
                <li><strong>Opt-out</strong> — Unsubscribe from marketing communications at any time</li>
                <li><strong>Restrict processing</strong> — Request that we limit how we use your data</li>
                <li><strong>Complaint</strong> — File a complaint with the U.S. Department of Education (for FERPA) or the Indiana Attorney General</li>
              </ul>
              <p>
                To exercise any of these rights, email <a href={`mailto:${ORG_EMAIL}`} className="text-brand-blue-600 hover:underline">{ORG_EMAIL}</a> or
                call <a href={`tel:${ORG_PHONE.replace(/[^0-9]/g, '')}`} className="text-brand-blue-600 hover:underline">{ORG_PHONE}</a>.
                We will respond within 30 days.
              </p>
            </Section>

            {/* 11 Children */}
            <Section id="children" number="11" title="Children's Privacy">
              <p>
                Our services are intended for individuals 16 years of age and older. We do not
                knowingly collect personal information from children under 13. If you believe a
                child under 13 has provided us with personal information, contact us immediately
                and we will delete it.
              </p>
              <p>
                Participants aged 16-17 may enroll in certain programs with parental or guardian
                consent as required by Indiana law and program-specific requirements.
              </p>
            </Section>

            {/* 12 Third-Party Services */}
            <Section id="third-party" number="12" title="Third-Party Services">
              <p>We use the following third-party services that may process your data:</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                  <thead className="bg-white">
                    <tr>
                      <th className="text-left p-3 font-semibold border-b">Service</th>
                      <th className="text-left p-3 font-semibold border-b">Purpose</th>
                      <th className="text-left p-3 font-semibold border-b">Data Processed</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Supabase</td>
                      <td className="p-3">Database and authentication</td>
                      <td className="p-3">Account data, enrollment records</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Stripe</td>
                      <td className="p-3">Payment processing</td>
                      <td className="p-3">Payment card data (PCI compliant)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Netlify</td>
                      <td className="p-3">Website hosting</td>
                      <td className="p-3">IP address, request logs</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">JotForm</td>
                      <td className="p-3">Application forms</td>
                      <td className="p-3">Form submissions</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Sentry</td>
                      <td className="p-3">Error monitoring</td>
                      <td className="p-3">Error logs (no PII)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Resend</td>
                      <td className="p-3">Transactional email</td>
                      <td className="p-3">Email address, name</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Cloudflare</td>
                      <td className="p-3">CDN, file storage, bot protection</td>
                      <td className="p-3">IP address, uploaded documents</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 font-medium">Google Analytics</td>
                      <td className="p-3">Website analytics</td>
                      <td className="p-3">Anonymized usage data, cookies (with consent)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium">OpenAI</td>
                      <td className="p-3">AI-assisted features (tutoring, content)</td>
                      <td className="p-3">User prompts (no PII sent; inputs are anonymized)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>
                Each service operates under its own privacy policy. We select providers that
                maintain appropriate security standards and data processing agreements.
              </p>
            </Section>

            {/* 13 Changes */}
            <Section id="changes" number="13" title="Changes to This Policy">
              <p>
                We may update this policy periodically. Material changes will be posted on this
                page with an updated effective date. Continued use of our services after changes
                constitutes acceptance of the revised policy.
              </p>
            </Section>

            {/* 14 Contact */}
            <Section id="contact" number="14" title="Contact Information">
              <div className="bg-white rounded-xl p-6 not-prose">
                <p className="font-bold text-slate-900 text-lg mb-1">{LEGAL_ENTITY}</p>
                <p className="text-slate-500 text-sm mb-3">d/b/a {ORG_NAME}</p>
                <div className="grid sm:grid-cols-2 gap-4 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">Privacy Inquiries</p>
                    <p>Email: <a href={`mailto:${ORG_EMAIL}`} className="text-brand-blue-600 hover:underline">{ORG_EMAIL}</a></p>
                    <p>Phone: <a href={`tel:${ORG_PHONE.replace(/[^0-9]/g, '')}`} className="text-brand-blue-600 hover:underline">{ORG_PHONE}</a></p>
                    <p>Address: {ORG_ADDRESS}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">FERPA Complaints</p>
                    <p>U.S. Department of Education</p>
                    <p>Student Privacy Policy Office</p>
                    <p>400 Maryland Avenue, SW</p>
                    <p>Washington, DC 20202-5920</p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Mobile TOC */}
            <div className="lg:hidden border-t border-slate-200 pt-8 mt-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Related Policies</h3>
              <div className="flex flex-wrap gap-4 text-sm">
                <Link href="/terms-of-service" className="text-brand-blue-600 hover:underline">Terms of Service</Link>
                <Link href="/accessibility" className="text-brand-blue-600 hover:underline">Accessibility Statement</Link>
                <Link href="/disclosures" className="text-brand-blue-600 hover:underline">Disclosures</Link>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
