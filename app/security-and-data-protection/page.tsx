import { Metadata } from 'next';
import Link from 'next/link';
import { Shield, Lock, Eye, Server, FileCheck, AlertTriangle, Mail, Key, CheckCircle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: 'Security & Data Protection Statement | Elevate For Humanity',
  description:
    'How Elevate for Humanity collects, stores, protects, and handles participant data. Covers FERPA, WIOA, encryption, access controls, and your rights as a data subject.',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/security-and-data-protection',
  },
};

const SECTIONS = [
  {
    icon: Shield,
    title: 'Our Commitment',
    content: `Elevate for Humanity is committed to protecting the privacy and security of all participant, employer, and partner data. As an ETPL-listed workforce training provider operating under WIOA, FERPA, and Indiana state law, we are legally and ethically obligated to handle personal information with care, transparency, and accountability.

This statement describes how we collect, use, store, protect, and share data — and what rights you have over your information.`,
  },
  {
    icon: Eye,
    title: 'Data We Collect',
    content: `We collect only the data necessary to deliver training services, process funding, and meet regulatory reporting requirements.

**Participant data includes:**
- Name, date of birth, contact information
- Social Security Number (required for WIOA ITA processing and credential issuance)
- Employment history, education level, and household income (for funding eligibility)
- Training enrollment, attendance, and assessment records
- Credential and certification records

**Employer and partner data includes:**
- Business name, EIN, and contact information
- Job postings, hiring records, and OJT agreements
- WOTC certification documentation

**Platform usage data includes:**
- Login activity, course progress, and assessment scores
- Device type and browser (for technical support purposes only)`,
  },
  {
    icon: Lock,
    title: 'How We Protect Your Data',
    content: `**Encryption:** All data is encrypted in transit (TLS 1.2+) and at rest (AES-256). Database credentials and API keys are stored in environment-isolated secret stores and never exposed in application code.

**Access controls:** Role-based access control (RBAC) limits data access to staff with a legitimate need. Participant records are accessible only to the participant, their assigned case manager, and authorized administrators.

**Authentication:** Multi-factor authentication (MFA) is required for all staff accounts. Participant accounts use secure password hashing (bcrypt) and optional MFA.

**Infrastructure:** Our platform is hosted on Supabase (SOC 2 Type II certified) and Netlify (SOC 2 Type II certified). No participant data is stored on local servers or personal devices.

**Audit logging:** All access to sensitive records is logged with timestamp, user ID, and action type. Logs are retained for a minimum of 3 years.`,
  },
  {
    icon: Server,
    title: 'Data Retention',
    content: `We retain participant records for the minimum period required by applicable law and funding regulations:

- **WIOA participant records:** 3 years after the program year closes (per 2 CFR § 200.334)
- **FERPA education records:** Until the participant requests deletion or 5 years after last enrollment, whichever is later
- **Financial and billing records:** 7 years (IRS requirement)
- **Credential records:** Indefinitely, as these may be needed for employment verification

After the applicable retention period, records are securely deleted or anonymized. You may request early deletion of non-regulated records by contacting us.`,
  },
  {
    icon: FileCheck,
    title: 'Legal Basis & Regulatory Compliance',
    content: `**FERPA (Family Educational Rights and Privacy Act):** Participant education records are protected under FERPA. We do not disclose education records to third parties without written consent, except as permitted by law (e.g., to accrediting organizations, in response to judicial orders, or to funding agencies for audit purposes).

**WIOA (Workforce Innovation and Opportunity Act):** Participant data collected for WIOA-funded programs is shared with Indiana DWD and the U.S. Department of Labor as required for performance reporting and audit compliance. This sharing is authorized under WIOA § 116.

**Indiana state law:** We comply with Indiana's data breach notification law (IC 24-4.9) and applicable state privacy regulations.

**HIPAA:** We do not collect or store protected health information (PHI). Health-related data collected for CNA or healthcare programs is limited to training records, not medical records.`,
  },
  {
    icon: Key,
    title: 'Your Rights',
    content: `As a participant, employer, or partner, you have the following rights regarding your data:

**Right to access:** You may request a copy of the personal data we hold about you at any time.

**Right to correction:** You may request correction of inaccurate or incomplete records.

**Right to deletion:** You may request deletion of non-regulated personal data. Note that records required by WIOA, FERPA, or IRS regulations cannot be deleted before the applicable retention period expires.

**Right to restrict processing:** You may request that we limit how we use your data in certain circumstances.

**FERPA rights:** Students and eligible parents have the right to inspect and review education records, request amendments, and consent to disclosures as provided under FERPA.

To exercise any of these rights, contact our Data Protection Officer at the address below.`,
  },
  {
    icon: AlertTriangle,
    title: 'Data Breach Response',
    content: `In the event of a data breach affecting personal information, Elevate for Humanity will:

1. Contain the breach and assess the scope within 24 hours of discovery
2. Notify affected individuals within 72 hours as required by Indiana IC 24-4.9
3. Notify relevant regulatory agencies (Indiana DWD, U.S. DOL) as required by funding agreements
4. Provide affected individuals with information about the breach, what data was involved, and steps they can take to protect themselves
5. Conduct a post-incident review and implement corrective measures

We maintain an incident response plan that is reviewed annually.`,
  },
  {
    icon: CheckCircle,
    title: 'Third-Party Data Sharing',
    content: `We share participant data only as necessary and only with parties who have agreed to appropriate data protection terms:

**Funding agencies:** Indiana DWD, U.S. DOL (required for WIOA reporting)
**Credentialing bodies:** NHA, ACT, Certiport, EPA, OSHA (for credential issuance and verification)
**Payment processors:** Stripe (for tuition payments — PCI DSS compliant)
**Platform infrastructure:** Supabase, Netlify (SOC 2 Type II certified)

We do not sell, rent, or trade personal data to any third party for marketing or commercial purposes.`,
  },
];

export default function SecurityAndDataProtectionPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Security & Data Protection' }]} />
        </div>
      </div>

      {/* Hero */}
      <div className="bg-slate-900 text-white py-14">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-8 h-8 text-brand-red-400" />
            <span className="text-brand-red-400 font-semibold text-sm uppercase tracking-wider">Legal & Compliance</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Security & Data Protection Statement</h1>
          <p className="text-slate-300 text-lg max-w-3xl">
            How Elevate for Humanity collects, protects, and handles participant, employer, and partner data. Effective January 1, 2025.
          </p>
          <p className="text-slate-500 text-sm mt-4">Last reviewed: May 2025 · Next review: November 2025</p>
        </div>
      </div>

      {/* Quick nav */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {SECTIONS.map((s) => (
              <a
                key={s.title}
                href={`#${s.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                className="text-brand-red-600 hover:underline"
              >
                {s.title}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-10">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const id = section.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
          return (
            <div key={section.title} id={id} className="bg-white rounded-xl border border-slate-200 p-8 scroll-mt-20">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-brand-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-brand-red-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">{section.title}</h2>
              </div>
              <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-3">
                {section.content.split('\n\n').map((para, i) => {
                  if (para.startsWith('**') && para.includes(':**')) {
                    const [label, ...rest] = para.split(':**');
                    return (
                      <p key={i}>
                        <strong>{label.replace('**', '')}</strong>:{rest.join(':**')}
                      </p>
                    );
                  }
                  if (para.startsWith('- ') || para.includes('\n- ')) {
                    const items = para.split('\n').filter(Boolean);
                    return (
                      <ul key={i} className="list-disc list-inside space-y-1 text-slate-600">
                        {items.map((item, j) => (
                          <li key={j}>{item.replace(/^[-\d]+\.?\s*/, '').replace(/\*\*/g, '')}</li>
                        ))}
                      </ul>
                    );
                  }
                  if (/^\d+\./.test(para)) {
                    const items = para.split('\n').filter(Boolean);
                    return (
                      <ol key={i} className="list-decimal list-inside space-y-1 text-slate-600">
                        {items.map((item, j) => (
                          <li key={j}>{item.replace(/^\d+\.\s*/, '').replace(/\*\*/g, '')}</li>
                        ))}
                      </ol>
                    );
                  }
                  return <p key={i}>{para.replace(/\*\*/g, '')}</p>;
                })}
              </div>
            </div>
          );
        })}

        {/* Contact */}
        <div className="bg-slate-900 text-white rounded-xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Mail className="w-6 h-6 text-brand-red-400" />
            <h2 className="text-xl font-bold">Contact Our Data Protection Officer</h2>
          </div>
          <p className="text-slate-300 mb-6">
            For data access requests, corrections, deletions, or questions about this statement, contact:
          </p>
          <div className="space-y-1 text-slate-300 text-sm mb-6">
            <p><strong className="text-white">Elizabeth Greene</strong> — Data Protection Officer</p>
            <p>Elevate for Humanity</p>
            <p>Indianapolis, Indiana</p>
            <p>
              Email:{' '}
              <a href="mailto:privacy@elevateforhumanity.org" className="text-brand-red-400 hover:underline">
                privacy@elevateforhumanity.org
              </a>
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/contact" className="bg-brand-red-600 hover:bg-brand-red-700 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition-colors">
              Contact Us
            </Link>
            <Link href="/privacy-policy" className="border border-slate-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/security" className="border border-slate-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-slate-800 transition-colors">
              Security Overview
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
