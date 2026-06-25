import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/reports/caseload' },
  title: 'Caseload Reports | Elevate For Humanity',
  description: 'View caseload distribution and staff assignments.',
};

export default async function CaseloadReportsPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  // Total active caseload = active program enrollments
  const { count: totalCaseload } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Staff members = profiles with role staff, admin, admin, instructor
  const { count: staffCount } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .in('role', ['staff', 'admin', 'instructor']);

  const avgPerStaff = staffCount && staffCount > 0
    ? Math.round((totalCaseload || 0) / staffCount)
    : 0;

  // Per-staff breakdown: enrollments assigned via program_enrollments.assigned_staff_id if it exists,
  // otherwise show staff list with enrollment counts by program
  const { data: staffMembers } = await db
    .from('profiles')
    .select('id, full_name, email, role')
    .in('role', ['staff', 'admin', 'instructor'])
    .order('full_name');

  // Count active enrollments per staff member via assigned_staff_id (if column exists)
  const staffWithCounts = await Promise.all(
    (staffMembers || []).map(async (s: any) => {
      const { count } = await db
        .from('program_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_staff_id', s.id)
        .eq('status', 'active');
      return { ...s, caseload: count || 0 };
    })
  );

  // Sort by caseload desc
  staffWithCounts.sort((a, b) => b.caseload - a.caseload);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/reports" className="hover:text-primary">Reports</Link></li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Caseload</li>
            </ol>
          </nav>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Caseload Reports</h1>
              <p className="text-slate-700 mt-2">Staff caseload distribution and assignments</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">Total Active Caseload</h3>
            <p className="text-3xl font-bold text-slate-900 mt-2">{totalCaseload ?? 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">Avg per Staff</h3>
            <p className="text-3xl font-bold text-brand-blue-600 mt-2">{avgPerStaff}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-slate-700">Staff Members</h3>
            <p className="text-3xl font-bold text-brand-green-600 mt-2">{staffCount ?? 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Caseload Distribution</h2>
          </div>
          {staffWithCounts.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-700 border-b bg-slate-50">
                  <th className="px-4 py-3 font-medium">Staff Member</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium text-right">Assigned Caseload</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {staffWithCounts.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{s.full_name || '—'}</td>
                    <td className="px-4 py-3 text-slate-700 capitalize">{s.role}</td>
                    <td className="px-4 py-3 text-slate-700">{s.email}</td>
                    <td className="px-4 py-3 text-right font-semibold">{s.caseload}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-8 text-center text-slate-700">No staff members found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
