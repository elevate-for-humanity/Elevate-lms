import { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import { Users, ChevronRight, Search } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Participants | Case Manager',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CaseManagerParticipantsPage() {
  const { user } = await requireRole(['case_manager', 'admin', 'super_admin', 'staff']);

  const supabase = await createClient();
  const admin    = createAdminClient();
  const db       = admin || supabase;

  // Resolve assigned application IDs for this case manager
  const { data: assignments } = await db
    .from('case_manager_assignments')
    .select('application_id')
    .eq('case_manager_id', user.id);

  const applicationIds = (assignments ?? []).map((a: any) => a.application_id as string);

  // Fetch applications (which carry contact info)
  let applications: any[] = [];
  if (applicationIds.length > 0) {
    const { data } = await db
      .from('applications')
      .select('id, first_name, last_name, email, phone, program_interest, status, created_at')
      .in('id', applicationIds)
      .order('last_name', { ascending: true });
    applications = data ?? [];
  }

  // For each application email, look up profile + enrollment summary
  const emails = applications.map((a) => a.email).filter(Boolean);

  let profilesByEmail: Record<string, any> = {};
  let enrollmentCountByEmail: Record<string, number> = {};

  if (emails.length > 0) {
    const { data: profiles } = await db
      .from('profiles')
      .select('id, email, full_name, city, state')
      .in('email', emails);

    for (const p of profiles ?? []) {
      profilesByEmail[p.email] = p;
    }

    // Enrollment counts per user
    const userIds = Object.values(profilesByEmail).map((p: any) => p.id);
    if (userIds.length > 0) {
      const { data: enrollments } = await db
        .from('program_enrollments')
        .select('user_id, status')
        .in('user_id', userIds);

      for (const e of enrollments ?? []) {
        enrollmentCountByEmail[e.user_id] = (enrollmentCountByEmail[e.user_id] ?? 0) + 1;
      }
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'approved')  return 'bg-green-100 text-green-800';
    if (status === 'pending')   return 'bg-yellow-100 text-yellow-800';
    if (status === 'rejected')  return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <nav className="text-xs text-gray-500 mb-1">
              <Link href="/case-manager/dashboard" className="hover:underline">Dashboard</Link>
              <span className="mx-1">/</span>
              <span>Participants</span>
            </nav>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-brand-blue-600" />
              Participants
            </h1>
            <p className="text-sm text-gray-500 mt-1">{applications.length} assigned</p>
          </div>
        </div>

        {applications.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">No participants assigned yet.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Program Interest</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Enrollments</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">App Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Applied</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applications.map((app) => {
                  const profile = profilesByEmail[app.email];
                  const enrollCount = profile ? (enrollmentCountByEmail[profile.id] ?? 0) : 0;
                  return (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {app.first_name} {app.last_name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{app.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{app.program_interest ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{enrollCount}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(app.status)}`}>
                          {app.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/case-manager/participants/${app.id}`}
                          className="inline-flex items-center gap-1 text-xs text-brand-blue-600 hover:underline"
                        >
                          View <ChevronRight className="w-3 h-3" />
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
