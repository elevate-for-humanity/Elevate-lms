import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { WioaCompliancePublicLayout } from '@/components/compliance/WioaCompliancePublicLayout';
import { WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';
import { fetchProgramForWioaPublic } from '@/lib/compliance/fetch-program-for-wioa-public';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';
import { FileText } from 'lucide-react';

export const revalidate = 3600;

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await fetchProgramForWioaPublic(slug);
  if (!program) return { title: 'Program not found' };
  const path = WIOA_COMPLIANCE.programHub(slug);
  return {
    title: `${program.title} — WIOA / ETPL compliance`,
    description: `Indiana INTraining and ETPL compliance forms for the ${program.title} program at ${PLATFORM_DEFAULTS.orgName}.`,
    alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}${path}` },
    openGraph: { title: `${program.title} — WIOA compliance`, url: `${PLATFORM_DEFAULTS.siteUrl}${path}` },
  };
}

export default async function ProgramWioaComplianceHubPage({ params }: Props) {
  const { slug } = await params;
  const program = await fetchProgramForWioaPublic(slug);
  if (!program) notFound();

  const canonicalPath = WIOA_COMPLIANCE.programHub(slug);
  const needsIeap = program.etpl_requires_initial_eligibility;

  return (
    <WioaCompliancePublicLayout
      title={`${program.title} — WIOA compliance`}
      description="Separate pages for each required Indiana workforce form."
      canonicalPath={canonicalPath}
      breadcrumbItems={[
        { label: 'Compliance', href: '/compliance' },
        { label: 'WIOA / ETPL', href: WIOA_COMPLIANCE.hub },
        { label: program.title },
      ]}
    >
      {program.description && (
        <p className="text-slate-700 leading-relaxed mb-8">{program.description}</p>
      )}

      <dl className="not-prose grid sm:grid-cols-2 gap-4 text-sm mb-10">
        {program.cip_code && (
          <>
            <dt className="text-slate-500">CIP</dt>
            <dd className="text-slate-900 font-medium">{program.cip_code}</dd>
          </>
        )}
        {program.soc_code && (
          <>
            <dt className="text-slate-500">SOC</dt>
            <dd className="text-slate-900 font-medium">{program.soc_code}</dd>
          </>
        )}
        {program.intraining_program_id && (
          <>
            <dt className="text-slate-500">INTraining ID</dt>
            <dd className="text-slate-900 font-medium">{program.intraining_program_id}</dd>
          </>
        )}
      </dl>

      <div className="not-prose space-y-4">
        {needsIeap && (
          <Link
            href={WIOA_COMPLIANCE.programIeap(slug)}
            className="flex gap-4 p-5 border border-slate-200 rounded-xl hover:border-brand-blue-300 transition"
          >
            <FileText className="w-6 h-6 text-slate-400 shrink-0" />
            <div>
              <div className="font-semibold text-slate-900">
                {FORM_LABELS.initial_eligibility_aggregate_performance}
              </div>
              <p className="text-sm text-slate-500 mt-1">New program — initial ETPL listing</p>
            </div>
          </Link>
        )}
        <Link
          href={WIOA_COMPLIANCE.programSection188(slug)}
          className="flex gap-4 p-5 border border-slate-200 rounded-xl hover:border-brand-blue-300 transition"
        >
          <FileText className="w-6 h-6 text-slate-400 shrink-0" />
          <div>
            <div className="font-semibold text-slate-900">{FORM_LABELS.section_188_checklist}</div>
            <p className="text-sm text-slate-500 mt-1">Required for this program</p>
          </div>
        </Link>
      </div>

      <p className="not-prose mt-8 text-sm text-slate-500">
        <Link href={`/programs/${slug}`} className="text-brand-blue-600 hover:underline">
          View public program page
        </Link>
      </p>
    </WioaCompliancePublicLayout>
  );
}
