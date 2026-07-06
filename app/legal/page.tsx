import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, Shield, Scale, Lock } from 'lucide-react';
import { TermsAcceptBanner } from '@/app/terms/TermsAcceptBanner';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Legal',
  description: `Legal documents, policies, and disclosures for ${PLATFORM_DEFAULTS.orgName}. Terms of service, privacy policy, license agreements, and compliance disclosures.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/legal' },
};

const LEGAL_DOCS = [
  { icon: FileText, title: 'Terms of Service', desc: 'User agreement governing access to the Elevate platform and programs.', href: '/legal' },
  { icon: Lock, title: 'Privacy Policy', desc: 'How we collect, use, and protect your personal information.', href: '/legal/privacy' },
  { icon: Shield, title: 'Security & Data Protection', desc: 'Technical and organizational measures protecting student and partner data.', href: '/security-and-data-protection' },
  { icon: Scale, title: 'License Agreement', desc: 'Software license terms for LMS platform licensees.', href: '/legal/license-agreement' },
  { icon: FileText, title: 'Policies', desc: 'Academic, enrollment, refund, and conduct policies.', href: '/policies' },
  { icon: FileText, title: 'Disclosures', desc: 'Regulatory disclosures, ETPL listing, and accreditation information.', href: '/legal/disclosures' },
  { icon: Scale, title: 'Equal Opportunity', desc: 'Non-discrimination policy and equal opportunity statement.', href: '/equal-opportunity' },
  { icon: FileText, title: 'Grievance Policy', desc: 'Student and participant grievance procedures.', href: '/grievance' },
  { icon: FileText, title: 'Satisfactory Academic Progress', desc: 'SAP standards and appeal procedures for funded students.', href: '/satisfactory-academic-progress' },
  { icon: Shield, title: 'Federal Compliance', desc: 'WIOA, Title IX, ADA, and other federal compliance statements.', href: '/federal-compliance' },
];

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Legal' }]} />
      </div>
      <section className="bg-slate-900 text-white py-14 px-4 text-center">
        <h1 className="text-4xl font-black mb-3">Legal & Compliance</h1>
        <p className="text-slate-300 max-w-xl mx-auto">Policies, disclosures, and legal documents governing {PLATFORM_DEFAULTS.orgName} programs and platform.</p>
      </section>
      <section className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid sm:grid-cols-2 gap-4">
          {LEGAL_DOCS.map((doc) => (
            <Link key={doc.href} href={doc.href} className="flex gap-4 p-5 border border-slate-200 rounded-xl hover:border-slate-400 hover:shadow-sm transition group">
              <doc.icon className="w-6 h-6 text-slate-400 group-hover:text-slate-700 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-slate-900 group-hover:text-brand-blue-700">{doc.title}</div>
                <div className="text-sm text-slate-500 mt-0.5">{doc.desc}</div>
              </div>
            </Link>
          ))}
        </div>
        <div className="mt-10">
          <TermsAcceptBanner />
        </div>
        <div className="mt-6 text-center text-sm text-slate-500">
          Questions about our legal documents? <Link href="/contact" className="text-brand-blue-600 hover:underline">Contact us</Link>.
        </div>
      </section>
    </div>
  );
}
