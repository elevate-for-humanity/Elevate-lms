import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import FundingVerificationTable from './FundingVerificationTable';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Funding Verification Queue | Admin',
  robots: { index: false, follow: false },
};

export default async function FundingVerificationPage() {
  const supabase = await createClient();
  const db = createAdminClient() || supabase;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/funding-verification');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/learner/dashboard');
  }

  // Load queue — view must exist in DB (migration 20260503000013)
  const { data: queue, error } = await db
    .from('v_funding_verification_queue')
    .select('*')
    .order('days_remaining', { ascending: true });

  // Summary stats from integrity flags
  const { data: flags } = await db
    .from('payment_integrity_flags')
    .select('resolved_at')
    .eq('flag_type', 'pending_admin_verification');

  const totalFlags = flags?.length ?? 0;
  const resolvedFlags = flags?.filter(f => f.resolved_at != null).length ?? 0;
  const openFlags = totalFlags - resolvedFlags;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Funding Verification Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Students enrolled via the instant-access flow who require funding confirmation before
          gaining LMS access. SLA: 14 days from enrollment date.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-500">In Queue</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">{queue?.length ?? 0}</p>
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
        <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-700">
          Failed to load queue. The <code>v_funding_verification_queue</code> view may not be
          applied yet — run migration <code>20260503000013</code> in Supabase Dashboard.
        </div>
      )}

      <FundingVerificationTable rows={queue ?? []} />
    </main>
  );
}
