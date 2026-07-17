import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { WioaCompliancePublicLayout } from '@/components/compliance/WioaCompliancePublicLayout';
import { WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';
import { SECTION_188_PUBLIC_SUMMARY } from '@/lib/compliance/wioa-etpl-public-copy';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';

export const revalidate = 3600;

const path = WIOA_COMPLIANCE.section188Template;

export const metadata: Metadata = {
  title: 'Section 188 Equal Opportunity Compliance Checklist | WIOA',
  description: `WIOA Section 188 and 29 CFR Part 38 equal opportunity compliance checklist for ${PLATFORM_DEFAULTS.orgName} training programs.`,
  alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}${path}` },
  openGraph: {
    title: 'Section 188 Equal Opportunity Compliance Checklist',
    url: `${PLATFORM_DEFAULTS.siteUrl}${path}`,
  },
};

export default function Section188TemplatePage() {
  return (
    <WioaCompliancePublicLayout
      title={FORM_LABELS.section_188_checklist}
      description="Required for every WIOA Title I–assisted training program."
      canonicalPath={path}
      breadcrumbItems={[
        { label: 'Compliance', href: '/compliance' },
        { label: 'WIOA / ETPL', href: WIOA_COMPLIANCE.hub },
        { label: 'Section 188' },
      ]}
    >
      <p className="text-slate-700 leading-relaxed whitespace-pre-line">
        {SECTION_188_PUBLIC_SUMMARY.trim()}
      </p>
      <h2 className="text-xl font-bold text-slate-900 mt-10 mb-3">Checklist elements</h2>
      <ul className="list-disc pl-6 text-slate-700 space-y-2">
        <li>Equal Opportunity Officer designation and contact</li>
        <li>Notice, assurance language, and affirmative outreach</li>
        <li>ADA physical and programmatic access; reasonable accommodations</li>
        <li>Data collection, monitoring, complaint processing, and corrective actions</li>
        <li>29 CFR Part 38 acknowledgment and nondiscriminatory program delivery</li>
      </ul>
      <p className="mt-8">
        <Link href={WIOA_COMPLIANCE.hub} className="text-brand-blue-600 font-semibold hover:underline">
          View all programs →
        </Link>
      </p>
    </WioaCompliancePublicLayout>
  );
}
