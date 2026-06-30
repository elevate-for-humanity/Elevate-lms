import { requireRole } from '@/lib/auth/require-role';
import { WioaEtplProgramHubClient } from '@/components/admin/compliance/WioaEtplProgramHubClient';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ programId: string }> };

export const metadata: Metadata = {
  title: 'Program — WIOA compliance | Admin',
  robots: { index: false, follow: false },
};

/** Auth on server; all program/form data loads via /api/admin/compliance/wioa-etpl/[programId]. */
export default async function WioaEtplProgramHubPage({ params }: Props) {
  await requireRole(['admin', 'super_admin', 'staff']);
  const { programId } = await params;

  return (
    <div className="min-h-screen bg-slate-50">
      <WioaEtplProgramHubClient programId={programId} />
    </div>
  );
}
