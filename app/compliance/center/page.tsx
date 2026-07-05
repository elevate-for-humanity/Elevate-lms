import type { Metadata } from 'next';
import Link from 'next/link';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { FileText, Shield, Scale, Users, Accessibility } from 'lucide-react';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { RAPIDS_SPONSOR_LABEL } from '@/lib/workforce-ids';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Public Compliance Center',
  description: `Policies, credential disclosures, equal opportunity, grievance process, and workforce compliance documents for ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: 'https://www.elevateforhumanity.org/compliance/center' },
};

const SECTIONS = [
  {
    title: 'Legal & Privacy',
    icon: Scale,
    links: [
      { href: '/legal', label: 'Terms of Service' },
      { href: '/legal/privacy', label: 'Privacy Policy' },
      { href: '/security-and-data-protection', label: 'Data Protection Statement' },
      { href: '/policies', label: 'All Policies Index' },
    ],
  },
  {
    title: 'Equal Opportunity & Grievances',
    icon: Users,
    links: [
      { href: '/equal-opportunity', label: 'Equal Opportunity Statement' },
      { href: '/federal-compliance', label: 'Federal Compliance (WIOA, ADA)' },
      { href: '/grievance', label: 'Complaint & Grievance Process' },
      { href: '/legal/student-handbook', label: 'Student Handbook' },
    ],
  },
  {
    title: 'Credentials & Apprenticeship',
    icon: Shield,
    links: [
      { href: '/compliance', label: 'Credential Disclosure Hub' },
      { href: '/credentials', label: 'Credential Authority Separation' },
      { href: '/apprenticeships', label: `Apprenticeship Programs (${RAPIDS_SPONSOR_LABEL})` },
      { href: '/verify-credentials', label: 'Verify Credentials' },
    ],
  },
  {
    title: 'Funding & Refunds',
    icon: FileText,
    links: [
      { href: '/tuition-fees#refund', label: 'Refund Policy' },
      { href: '/satisfactory-academic-progress', label: 'Satisfactory Academic Progress' },
      { href: '/compliance/wioa', label: 'WIOA / ETPL Compliance' },
      { href: '/funding', label: 'Funding Overview' },
    ],
  },
  {
    title: 'Accessibility',
    icon: Accessibility,
    links: [
      { href: '/accessibility', label: 'Accessibility Statement' },
      { href: '/consumer-education', label: 'Consumer Education' },
    ],
  },
];

export default function ComplianceCenterPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <Breadcrumbs items={[{ label: 'Compliance Center' }]} />
      </div>

      <section className="bg-brand-blue-800 text-white py-14 px-6 text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">Public Compliance Center</h1>
        <p className="text-brand-blue-100 text-sm max-w-2xl mx-auto">
          Workforce reviewers, funders, and partners can find policies, credential disclosures, and
          complaint processes in one place.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-12 grid sm:grid-cols-2 gap-6">
        {SECTIONS.map((section) => (
          <div key={section.title} className="rounded-xl border border-slate-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <section.icon className="w-5 h-5 text-brand-red-600" aria-hidden />
              <h2 className="font-extrabold text-slate-900">{section.title}</h2>
            </div>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-blue-700 font-semibold hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section className="max-w-3xl mx-auto px-4 pb-16 text-center">
        <p className="text-sm text-slate-600 mb-4">
          Questions from a workforce board or state agency? Contact compliance at{' '}
          <a href="mailto:carlina@elevateforhumanity.org" className="font-semibold text-brand-blue-700 hover:underline">
            carlina@elevateforhumanity.org
          </a>
        </p>
        <Link href="/impact/methodology" className="text-sm font-bold text-brand-red-600 hover:underline">
          How we measure outcomes →
        </Link>
      </section>
    </div>
  );
}
