import type { Metadata } from 'next';
import Link from 'next/link';
import { createPublicClient } from '@/lib/supabase/public';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { WioaCompliancePublicLayout } from '@/components/compliance/WioaCompliancePublicLayout';
import { WIOA_COMPLIANCE } from '@/lib/compliance/wioa-etpl-routes';
import { FileText } from 'lucide-react';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'WIOA & INTraining ETPL Compliance Forms',
  description: `Indiana DWD INTraining and ETPL compliance documentation for ${PLATFORM_DEFAULTS.orgName} training programs — Initial Eligibility Aggregate Performance and Section 188 Equal Opportunity checklists.`,
  alternates: { canonical: `${PLATFORM_DEFAULTS.siteUrl}${WIOA_COMPLIANCE.hub}` },
  openGraph: {
    title: 'WIOA & INTraining ETPL Compliance',
    description: 'Per-program IEAP and Section 188 compliance forms for Indiana workforce training.',
    url: `${PLATFORM_DEFAULTS.siteUrl}${WIOA_COMPLIANCE.hub}`,
  },
};

export default async function WioaComplianceHubPage() {
  let programs: { slug: string; title: string }[];
  try {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from('programs')
      .select('slug, title')
      .or('published.eq.true,is_active.eq.true')
      .neq('status', 'archived')
      .order('title');
    programs = (data ?? []).filter((p) => p.slug && p.title) as { slug: string; title: string }[];
  } catch {
    programs = [];
  }

  return (
    <WioaCompliancePublicLayout
      title="WIOA / INTraining ETPL compliance"
      description="Dedicated pages for each required Indiana workforce compliance form — no redirects."
      canonicalPath={WIOA_COMPLIANCE.hub}
      breadcrumbItems={[
        { label: 'Compliance', href: '/compliance' },
        { label: 'WIOA / ETPL' },
      ]}
    >
      <p className="text-slate-700 leading-relaxed mb-8">
        {PLATFORM_DEFAULTS.orgName} maintains separate, crawlable documentation for each WIOA and
        ETPL requirement. Use the program-specific links below or the form templates for reference.
      </p>

      <div className="not-prose space-y-4 mb-10">
        <Link
          href={WIOA_COMPLIANCE.ieapTemplate}
          className="flex gap-4 p-5 border border-slate-200 rounded-xl hover:border-brand-blue-300 transition"
        >
          <FileText className="w-6 h-6 text-slate-400 shrink-0" />
          <div>
            <div className="font-semibold text-slate-900">
              Initial Eligibility Aggregate Performance (template)
            </div>
            <p className="text-sm text-slate-500 mt-1">New ETPL programs only</p>
          </div>
        </Link>
        <Link
          href={WIOA_COMPLIANCE.section188Template}
          className="flex gap-4 p-5 border border-slate-200 rounded-xl hover:border-brand-blue-300 transition"
        >
          <FileText className="w-6 h-6 text-slate-400 shrink-0" />
          <div>
            <div className="font-semibold text-slate-900">
              Section 188 Equal Opportunity Compliance Checklist (template)
            </div>
            <p className="text-sm text-slate-500 mt-1">Every program</p>
          </div>
        </Link>
      </div>

      <h2 className="text-xl font-bold text-slate-900 mb-4">Per-program compliance pages</h2>
      <ul className="not-prose divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
        {programs.map((p) => (
          <li key={p.slug}>
            <Link
              href={WIOA_COMPLIANCE.programHub(p.slug)}
              className="block px-5 py-4 hover:bg-slate-50 font-medium text-brand-blue-700"
            >
              {p.title}
            </Link>
          </li>
        ))}
      </ul>
      {programs.length === 0 && (
        <p className="text-slate-500 text-sm">Program list unavailable — see form templates above.</p>
      )}
    </WioaCompliancePublicLayout>
  );
}
