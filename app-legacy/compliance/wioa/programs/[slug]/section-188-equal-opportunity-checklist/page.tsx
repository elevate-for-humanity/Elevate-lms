import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { WioaCompliancePublicLayout } from '@/components/compliance/WioaCompliancePublicLayout';
import { WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';
import { fetchProgramForWioaPublic } from '@/lib/compliance/fetch-program-for-wioa-public';
import { SECTION_188_PUBLIC_SUMMARY } from '@/lib/compliance/wioa-etpl-public-copy';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await fetchProgramForWioaPublic(slug);
  if (!program) return { title: 'Program not found' };
  const path = WIOA_COMPLIANCE.programSection188(slug);
  return {
    title: `${program.title} — Section 188 Equal Opportunity Checklist`,
    description: `Section 188 / 29 CFR Part 38 equal opportunity compliance for ${program.title}.`,
    alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}${path}` },
    openGraph: {
      title: `${program.title} — Section 188`,
      url: `${PLATFORM_DEFAULTS.siteUrl}${path}`,
    },
  };
}

export default async function ProgramSection188PublicPage({ params }: Props) {
  const { slug } = await params;
  const program = await fetchProgramForWioaPublic(slug);
  if (!program) notFound();

  const path = WIOA_COMPLIANCE.programSection188(slug);

  return (
    <WioaCompliancePublicLayout
      title={`${program.title} — ${FORM_LABELS.section_188_checklist}`}
      description="Equal opportunity and nondiscrimination compliance for this training program."
      canonicalPath={path}
      breadcrumbItems={[
        { label: 'Compliance', href: '/compliance' },
        { label: 'WIOA / ETPL', href: WIOA_COMPLIANCE.hub },
        { label: program.title, href: WIOA_COMPLIANCE.programHub(slug) },
        { label: 'Section 188' },
      ]}
    >
      <p className="text-slate-700 leading-relaxed whitespace-pre-line mb-6">
        {SECTION_188_PUBLIC_SUMMARY.trim()}
      </p>
      <div className="not-prose bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm">
        <p>
          <span className="text-slate-500">Program:</span>{' '}
          <strong className="text-slate-900">{program.title}</strong>
        </p>
      </div>
      <p className="not-prose mt-6 text-sm">
        <Link href={WIOA_COMPLIANCE.programHub(slug)} className="text-brand-blue-600 hover:underline">
          ← Back to {program.title} compliance hub
        </Link>
      </p>
    </WioaCompliancePublicLayout>
  );
}
