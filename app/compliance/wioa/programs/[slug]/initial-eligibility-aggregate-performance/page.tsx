import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { WioaCompliancePublicLayout } from '@/components/compliance/WioaCompliancePublicLayout';
import { WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';
import { fetchProgramForWioaPublic } from '@/lib/compliance/fetch-program-for-wioa-public';
import { IEAP_PUBLIC_SUMMARY } from '@/lib/compliance/wioa-etpl-public-copy';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await fetchProgramForWioaPublic(slug);
  if (!program) return { title: 'Program not found' };
  const path = WIOA_COMPLIANCE.programIeap(slug);
  return {
    title: `${program.title} — Initial Eligibility Aggregate Performance`,
    description: `IEAP form page for ${program.title} — Indiana INTraining / ETPL new program initial eligibility.`,
    alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}${path}` },
    openGraph: { title: `${program.title} — IEAP`, url: `${PLATFORM_DEFAULTS.siteUrl}${path}` },
  };
}

export default async function ProgramIeapPublicPage({ params }: Props) {
  const { slug } = await params;
  const program = await fetchProgramForWioaPublic(slug);
  if (!program) notFound();

  const path = WIOA_COMPLIANCE.programIeap(slug);

  if (!program.etpl_requires_initial_eligibility) {
    return (
      <WioaCompliancePublicLayout
        title={`${program.title} — IEAP`}
        description="Not required for established ETPL programs."
        canonicalPath={path}
        breadcrumbItems={[
          { label: 'Compliance', href: '/compliance' },
          { label: 'WIOA / ETPL', href: WIOA_COMPLIANCE.hub },
          { label: program.title, href: WIOA_COMPLIANCE.programHub(slug) },
          { label: 'IEAP' },
        ]}
      >
        <p className="text-slate-700">
          This program is treated as an established INTraining / ETPL listing. Initial Eligibility
          Aggregate Performance applies to <strong>new programs only</strong>. Complete the{' '}
          <Link
            href={WIOA_COMPLIANCE.programSection188(slug)}
            className="text-brand-blue-600 font-semibold hover:underline"
          >
            Section 188 checklist
          </Link>{' '}
          for this program.
        </p>
      </WioaCompliancePublicLayout>
    );
  }

  return (
    <WioaCompliancePublicLayout
      title={`${program.title} — ${FORM_LABELS.initial_eligibility_aggregate_performance}`}
      description="New program initial eligibility documentation for Indiana INTraining / ETPL."
      canonicalPath={path}
      breadcrumbItems={[
        { label: 'Compliance', href: '/compliance' },
        { label: 'WIOA / ETPL', href: WIOA_COMPLIANCE.hub },
        { label: program.title, href: WIOA_COMPLIANCE.programHub(slug) },
        { label: 'IEAP' },
      ]}
    >
      <p className="text-slate-700 leading-relaxed whitespace-pre-line mb-6">
        {IEAP_PUBLIC_SUMMARY.trim()}
      </p>
      <div className="not-prose bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm space-y-2">
        <p>
          <span className="text-slate-500">Program:</span>{' '}
          <strong className="text-slate-900">{program.title}</strong>
        </p>
        {program.credential_name && (
          <p>
            <span className="text-slate-500">Credential:</span> {program.credential_name}
          </p>
        )}
      </div>
      <p className="not-prose mt-6 text-sm">
        <Link href={WIOA_COMPLIANCE.programHub(slug)} className="text-brand-blue-600 hover:underline">
          ← Back to {program.title} compliance hub
        </Link>
      </p>
    </WioaCompliancePublicLayout>
  );
}
