import { Metadata } from 'next';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { StudentSearchPanel } from '@/components/workforce/StudentSearchPanel';

export const metadata: Metadata = {
  title: 'Participants | Workforce Portal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function WorkforceParticipantsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>;
}) {
  const { effectiveRoles } = await requireRole([
    'workforce_partner',
    'admin',
    'super_admin',
    'staff',
    'org_admin',
  ]);
  const { filter, q } = await searchParams;
  const normalizedQuery = q?.trim().toLowerCase() ?? '';

  const supabase = await createClient();
  const privileged = effectiveRoles.some((role) =>
    ['admin', 'super_admin', 'staff', 'org_admin'].includes(role),
  );
  const admin = privileged ? await requireAdminClient() : null;

  // Workforce partners query through the signed-in client so RLS remains in
  // force. Service-role access is reserved for internal oversight roles.
  const db = admin ?? supabase;

  let restrictedIds: string[] | null = null;
  if (filter === 'at-risk') {
    const { data: atRiskEnrollments } = await db
      .from('program_enrollments')
      .select('user_id')
      .eq('at_risk', true);
    restrictedIds = [
      ...new Set((atRiskEnrollments ?? []).map((row: any) => row.user_id).filter(Boolean)),
    ];
  }

  let participants: any[] = [];
  if (restrictedIds === null || restrictedIds.length > 0) {
    let query = db
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .eq('role', 'student')
      .order('created_at', { ascending: false })
      .limit(100);

    if (restrictedIds) query = query.in('id', restrictedIds);

    const { data } = await query;
    participants = data ?? [];
  }

  if (normalizedQuery) {
    participants = participants.filter((participant) => {
      const searchable = `${participant.full_name ?? ''} ${participant.email ?? ''}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Participants</h1>
          <p className="mt-1 text-sm text-slate-600">
            {participants.length} participant{participants.length !== 1 ? 's' : ''}
            {filter === 'at-risk' ? ' · at-risk enrollments' : ''}
          </p>
        </div>
        <Link
          href="/workforce/dashboard"
          className="text-sm font-semibold text-brand-blue-700 hover:underline"
        >
          Back to dashboard
        </Link>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
        <StudentSearchPanel
          action="/workforce/participants"
          defaultValue={q ?? ''}
          label="Search workforce participants"
        />
        {(normalizedQuery || filter) && (
          <Link
            href="/workforce/participants"
            className="mt-2 inline-block text-xs font-semibold text-brand-blue-700 hover:underline"
          >
            Clear filters
          </Link>
        )}
      </div>

      {!participants.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-slate-400" />
          <p className="text-sm font-medium text-slate-700">No participants found</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Name</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Email</th>
                <th className="px-4 py-3 text-left font-medium text-slate-700">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {participants.map((participant) => (
                <tr key={participant.id} className="transition hover:bg-slate-50">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {participant.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-slate-700">{participant.email}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {new Date(participant.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
