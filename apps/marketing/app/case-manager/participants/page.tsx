import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { getCaseManagerParticipants } from '@/lib/case-manager/participant-scope';
import { Users, ChevronRight } from 'lucide-react';
import { StudentSearchPanel } from '../StudentSearchPanel';

export const metadata: Metadata = {
  title: 'Participants | Case Manager',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export default async function CaseManagerParticipantsPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const normalizedQuery = q?.trim().toLowerCase() ?? '';
  const { user, effectiveRoles } = await requireRole(['case_manager', 'admin', 'staff']);

  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;

  let participants = await getCaseManagerParticipants({
    db,
    userId: user.id,
    effectiveRoles,
  });

  if (normalizedQuery) {
    participants = participants.filter(({ application, learnerProfile }) => {
      const searchable = [
        application.first_name,
        application.last_name,
        application.email,
        learnerProfile?.full_name,
        learnerProfile?.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }

  const learnerIds = participants
    .map((participant) => participant.learnerId)
    .filter((id): id is string => Boolean(id));
  const enrollmentCountByUserId: Record<string, number> = {};

  if (learnerIds.length > 0) {
    const { data: enrollments } = await db
      .from('program_enrollments')
      .select('user_id, status')
      .in('user_id', learnerIds);

    for (const enrollment of enrollments ?? []) {
      enrollmentCountByUserId[enrollment.user_id] =
        (enrollmentCountByUserId[enrollment.user_id] ?? 0) + 1;
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'bg-brand-green-100 text-brand-green-800';
    if (status === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-slate-100 text-slate-900';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <nav className="mb-1 text-xs text-slate-700">
              <Link href="/case-manager/dashboard" className="hover:underline">Dashboard</Link>
              <span className="mx-1">/</span>
              <span>Participants</span>
            </nav>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Users className="h-6 w-6 text-brand-blue-600" />
              Participants
            </h1>
            <p className="mt-1 text-sm text-slate-700">
              {participants.length} participant{participants.length === 1 ? '' : 's'}{normalizedQuery ? ' matching search' : ''}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <StudentSearchPanel defaultValue={q ?? ''} />
          {normalizedQuery && (
            <Link href="/case-manager/participants" className="mt-2 inline-block text-xs font-semibold text-brand-blue-700 hover:underline">
              Clear search
            </Link>
          )}
        </div>

        {participants.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-500" />
            <p className="text-sm text-slate-700">
              {normalizedQuery ? 'No scoped participants match this search.' : 'No participants assigned yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">Program Interest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">Enrollments</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">App Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-700">Applied</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {participants.map(({ application, learnerProfile, learnerId }) => {
                  const displayName = learnerProfile?.full_name || `${application.first_name ?? ''} ${application.last_name ?? ''}`.trim() || 'Unknown';
                  const enrollCount = learnerId ? (enrollmentCountByUserId[learnerId] ?? 0) : 0;
                  return (
                    <tr key={application.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{displayName}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{application.email ?? learnerProfile?.email ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{application.program_interest ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{enrollCount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(application.status)}`}>
                          {application.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {application.created_at ? new Date(application.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/case-manager/participants/${application.id}`} className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:underline">
                          View <ChevronRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
