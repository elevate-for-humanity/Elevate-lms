import { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { WioaEtplProgramsList } from '@/components/admin/compliance/WioaEtplProgramsList';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ChevronLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: `WIOA ETPL Compliance Forms | Admin | ${PLATFORM_DEFAULTS.orgName}`,
  description:
    'Initial Eligibility Aggregate Performance (new programs) and Section 188 Equal Opportunity checklists per program.',
};

export default async function WioaEtplCompliancePage() {
  await requireRole(['admin', 'super_admin', 'staff']);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs
          items={[
            { label: 'Compliance', href: '/admin/compliance' },
            { label: 'WIOA / ETPL Forms' },
          ]}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <Link
          href="/admin/compliance"
          className="inline-flex items-center text-sm text-slate-600 hover:text-brand-blue-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Compliance dashboard
        </Link>

        <h1 className="text-2xl font-bold text-slate-900 mb-2">WIOA / INTraining ETPL compliance</h1>
        <p className="text-slate-600 max-w-3xl mb-8">
          Complete the{' '}
          <strong>Initial Eligibility Aggregate Performance (IEAP)</strong> form for each{' '}
          <strong>new</strong> program before initial ETPL listing, and the{' '}
          <strong>Section 188 Equal Opportunity Compliance Checklist</strong> for every program.
          Aligns with Indiana DWD INTraining guidance (Policy 2020-16, TA 2020-17) and 29 CFR Part
          38.
        </p>

        <WioaEtplProgramsList />
      </div>
    </div>
  );
}
