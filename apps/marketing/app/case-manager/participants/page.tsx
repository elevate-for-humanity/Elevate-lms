import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
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
  const { user } = await requireRole(['case_manager', 'admin', 'staff']);

  const supabase = await createClient();
  const admin = await requireAdminClient();
  const db = admin || supabase;

  // Resolve only applications assigned to this case manager. Search is applied
  // after the assignment boundary so a query can never expand the caseload.
  const { data: assignments } = await supabase
    .from('case_manager_assignments')
    .select('application_id')
    .eq('case_manager_id', user.id);

  const applicationIds = (assignments ?? [])
    .map((assignment: any) => assignment.application_id as string | null)
    .filter((id): id is string => Boolean(id));

  let applications: any[] = [];
  if (applicationIds.length > 0) {
    const { data } = await supabase
      .from('applications')
      .select('id, first_name, last_name, email, phone, program_interest, status, created_at')
      .in('id', applicationIds)
      .order('last_name', { ascending: true });
    applications = data ?? [];
  }

  if (normalizedQuery) {
    applications = applications.filter((application) => {
      const searchable = [
        application.first_name,
        application.last_name,
        application.email,
        `${application.first_name ?? ''} ${application.last_name ?? ''}`,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }

  const emails = applications.map((application) => application.email).filter(Boolean);
  const profilesByEmail: Record<string, any> = {};
  const enrollmentCountByUserId: Record<string, number> = {};

  if (emails.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, city, state')
      .in('email', emails);

    for (const profile of profiles ?? []) {
      if (profile.email) profilesByEmail[profile.email] = profile;
    }

    const userIds = Object.values(profilesByEmail).map((profile: any) => profile.id);
    if (userIds.length > 0) {
      const { data: enrollments } = await db
        .from('program_enrollments')
        .select('user_id, status')
        .in('user_id', userIds);

      for (const enrollment of enrollments ?? []) {
        enrollmentCountByUserId[enrollment.user_id] =
          (enrollmentCountByUserId[enrollment.user_id] ?? 0) + 1;
      }
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
              <Link href="/case-manager/dashboard" className="hover:underline">
                Dashboard
              </Link>
              <span className="mx-1">/</span>
              <span>Participants</span>
            </nav>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
              <Users className="h-6 w-6 text-brand-blue-600" />
              Participants
            </h1>
            <p className="mt-1 text-sm text-slate-700">
              {applications.length} assigned{normalizedQuery ? ' matching search' : ''}
            </p>
          </div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <StudentSearchPanel defaultValue={q ?? ''} />
          {normalizedQuery && (
            <Link
              href="/case-manager/participants"
              className="mt-2 inline-block text-xs font-semibold text-brand-blue-700 hover:underline"
            >
              Clear search
            </Link>
          )}
        </div>

        {applications.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <Users className="mx-auto mb-3 h-10 w-10 text-slate-500" />
            <p className="text-sm text-slate-700">
              {normalizedQuery ? 'No assigned participants match this search.' : 'No participants assigned yet.'}
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
                {applications.map((application) => {
                  const profile = profilesByEmail[application.email];
                  const enrollCount = profile ? (enrollmentCountByUserId[profile.id] ?? 0) : 0;
                  return (
                    <tr key={application.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {application.first_name} {application.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{application.email}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {application.program_interest ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-900">{enrollCount}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(application.status)}`}
                        >
                          {application.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {new Date(application.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/case-manager/participants/${application.id}`}
                          className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:underline"
                        >
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
