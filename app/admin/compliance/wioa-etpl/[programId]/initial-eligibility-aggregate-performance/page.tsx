import { requireRole } from '@/lib/auth/require-role';
import { WioaIeapAdminForm } from '@/components/admin/compliance/WioaIeapAdminForm';
import type { Metadata } from 'next';
import { FORM_LABELS } from '@/lib/compliance/wioa-etpl-forms';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ programId: string }> };

export const metadata: Metadata = {
  title: `${FORM_LABELS.initial_eligibility_aggregate_performance} | Admin`,
  robots: { index: false, follow: false },
};

/** Auth on server; form load/save via /api/admin/compliance/wioa-etpl/[programId]. */
export default async function WioaIeapAdminPage({ params }: Props) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { programId } = await params;

  return (
    <div className="min-h-screen bg-slate-50">
      <WioaIeapAdminForm programId={programId} />
    </div>
  );
}
