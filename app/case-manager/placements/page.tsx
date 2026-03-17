import { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import VerifyPlacementButton from './_components/VerifyPlacementButton';

export const metadata: Metadata = {
  title: 'Placements | Case Manager',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CaseManagerPlacementsPage() {
  const { user } = await requireRole(['case_manager', 'admin', 'super_admin', 'staff']);

  const supabase = await createClient();
  const admin    = createAdminClient();
  const db       = admin || supabase;

  // Fetch all placements this case manager owns, pending first
  const { data: placements } = await db
    .from('placement_records')
    .select(`
      id, employer_name, job_title, employment_type,
      hourly_wage, start_date, status, verification_method,
      verified_at, notes, created_at,
      profiles:learner_id ( full_name, email )
    `)
    .eq('case_manager_id', user.id)
    .order('status', { ascending: true })   // pending first
    .order('created_at', { ascending: false });

  const pending   = (placements ?? []).filter((p: any) => p.status === 'pending');
  const verified  = (placements ?? []).filter((p: any) => p.status === 'verified');
  const other     = (placements ?? []).filter((p: any) => !['pending','verified'].includes(p.status));

  const statusBadge = (status: string) => {
    if (status === 'verified') return 'bg-green-100 text-green-800';
    if (status === 'pending')  return 'bg-yellow-100 text-yellow-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    if (status === 'lost')     return 'bg-gray-100 text-gray-600';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <nav className="text-xs text-gray-500 mb-4">
          <Link href="/case-manager/dashboard" className="hover:underline">Dashboard</Link>
          <span className="mx-1">/</span>
          <span>Placements</span>
        </nav>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Employment Placements</h1>
            <p className="text-sm text-gray-500 mt-1">
              {pending.length} pending verification · {verified.length} verified
            </p>
          </div>
        </div>

        {/* Pending verification */}
        {pending.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide mb-3">
              Pending Verification ({pending.length})
            </h2>
            <PlacementTable
              rows={pending}
              statusBadge={statusBadge}
              showVerifyAction
              caseManagerId={user.id}
            />
          </div>
        )}

        {/* Verified */}
        {verified.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-green-700 uppercase tracking-wide mb-3">
              Verified ({verified.length})
            </h2>
            <PlacementTable rows={verified} statusBadge={statusBadge} />
          </div>
        )}

        {/* Other (rejected / lost) */}
        {other.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Other ({other.length})
            </h2>
            <PlacementTable rows={other} statusBadge={statusBadge} />
          </div>
        )}

        {!placements?.length && (
          <div className="rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-sm text-gray-500">No placements recorded yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function PlacementTable({
  rows,
  statusBadge,
  showVerifyAction = false,
  caseManagerId,
}: {
  rows:             any[];
  statusBadge:      (s: string) => string;
  showVerifyAction?: boolean;
  caseManagerId?:   string;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-100 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Participant</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Employer</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Title</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Wage</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Start</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Verification</th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
            {showVerifyAction && <th className="px-4 py-3" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((p: any) => (
            <tr key={p.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-medium text-gray-900">
                {(p.profiles as any)?.full_name ?? (p.profiles as any)?.email ?? '—'}
              </td>
              <td className="px-4 py-3 text-gray-700">{p.employer_name ?? '—'}</td>
              <td className="px-4 py-3 text-gray-700">{p.job_title ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{p.employment_type?.replace('_', ' ') ?? '—'}</td>
              <td className="px-4 py-3 text-gray-600">{p.hourly_wage ? `$${p.hourly_wage}/hr` : '—'}</td>
              <td className="px-4 py-3 text-gray-500">
                {p.start_date ? new Date(p.start_date).toLocaleDateString() : '—'}
              </td>
              <td className="px-4 py-3 text-gray-500">{p.verification_method?.replace('_', ' ') ?? '—'}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(p.status)}`}>
                  {p.status}
                </span>
              </td>
              {showVerifyAction && (
                <td className="px-4 py-3 text-right">
                  <VerifyPlacementButton placementId={p.id} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
