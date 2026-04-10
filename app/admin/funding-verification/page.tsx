import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import type { Metadata } from 'next';
import FundingVerificationTable from './FundingVerificationTable';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Funding Verification Queue | Admin',
  robots: { index: false, follow: false },
};

export default async function FundingVerificationPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const supabase = await getAdminClient();

  // v_funding_verification_queue is defined in migration 20260503000013.
  // Columns: enrollment_id, user_id, email, full_name, phone, program_slug,
  //          enrollment_state, funding_source, enrolled_at, due_at, notes,
  //          days_since_enrollment, days_until_due, sla_status,
  //          has_open_escalation, flag_type, flagged_at
  const { data: queue, error } = await supabase
    .from('v_funding_verification_queue')
    .select('*');
  // View is already ordered by SLA priority — no .order() needed

  // Summary stats
  const { data: flags } = await supabase
    .from('payment_integrity_flags')
    .select('resolved_at')
    .eq('flag_type', 'pending_admin_verification');

  const totalFlags = flags?.length ?? 0;
  const resolvedFlags = flags?.filter(f => f.resolved_at != null).length ?? 0;
  const openFlags = totalFlags - resolvedFlags;

  const criticalCount = queue?.filter(r => r.sla_status === 'critical').length ?? 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Funding Verification Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Students enrolled via the instant-access flow awaiting funding confirmation.
          SLA: 14 days. Reject requires a documented reason.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">In Queue</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{queue?.length ?? 0}</p>
        </div>
        <div className="bg-white rounded-lg border border-red-200 p-5">
          <p className="text-sm font-medium text-gray-500">Critical (7d+ overdue)</p>
          <p className="mt-1 text-3xl font-semibold text-red-700">{criticalCount}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Open Integrity Flags</p>
          <p className="mt-1 text-3xl font-semibold text-amber-600">{openFlags}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">Resolved Flags</p>
          <p className="mt-1 text-3xl font-semibold text-green-600">{resolvedFlags}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          <strong>Queue unavailable.</strong> The <code>v_funding_verification_queue</code> view
          may not be applied yet — run migration <code>20260503000013</code> in Supabase Dashboard
          SQL Editor, then reload.
        </div>
      )}

      <FundingVerificationTable rows={queue ?? []} />
    </main>
  );
}
