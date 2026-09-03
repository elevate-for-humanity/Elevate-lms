import type { Metadata } from 'next';
import Link from 'next/link';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { WioaCompliancePublicLayout } from '@/components/compliance/WioaCompliancePublicLayout';
import { WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';
import { IEAP_PUBLIC_SUMMARY } from '@/lib/compliance/wioa-etpl-public-copy';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';

export const revalidate = 3600;

const path = WIOA_COMPLIANCE.ieapTemplate;

export const metadata: Metadata = {
  title: 'Initial Eligibility Aggregate Performance | WIOA ETPL',
  description: `Indiana INTraining / ETPL Initial Eligibility Aggregate Performance (IEAP) form requirements for new training programs at ${PLATFORM_DEFAULTS.orgName}.`,
  alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}${path}` },
  openGraph: {
    title: 'Initial Eligibility Aggregate Performance (IEAP)',
    url: `${PLATFORM_DEFAULTS.siteUrl}${path}`,
  },
};

export default function IeapTemplatePage() {
  return (
    <WioaCompliancePublicLayout
      title={FORM_LABELS.initial_eligibility_aggregate_performance}
      description="Required for new programs before initial Indiana INTraining / ETPL listing."
      canonicalPath={path}
      breadcrumbItems={[
        { label: 'Compliance', href: '/compliance' },
        { label: 'WIOA / ETPL', href: WIOA_COMPLIANCE.hub },
        { label: 'IEAP' },
      ]}
    >
      <p className="text-slate-700 leading-relaxed whitespace-pre-line">{IEAP_PUBLIC_SUMMARY.trim()}</p>
      <h2 className="text-xl font-bold text-slate-900 mt-10 mb-3">What the form includes</h2>
      <ul className="list-disc pl-6 text-slate-700 space-y-2">
        <li>Program title matching the ETPL / INTraining listing</li>
        <li>CIP and SOC codes, duration, and credential description</li>
        <li>Alignment with in-demand occupations and business partnerships</li>
        <li>Aggregate performance metrics or new-program attestation (no completer data yet)</li>
        <li>Authorized preparer attestation</li>
      </ul>
      <p className="mt-8">
        <Link href={WIOA_COMPLIANCE.hub} className="text-brand-blue-600 font-semibold hover:underline">
          View all programs →
        </Link>
      </p>
    </WioaCompliancePublicLayout>
  );
}
