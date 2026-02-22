
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Users, BookOpen, AlertCircle, Clock } from 'lucide-react';
import { safeFormatDate } from '@/lib/format-utils';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/staff-portal/dashboard',
  },
  title: 'Staff Dashboard | Elevate For Humanity',
  description:
    'Staff portal for managing students, enrollments, and support tasks.',
};

/**
 * STAFF PORTAL DASHBOARD
 *
 * Staff members need to see:
 * - Students they're supporting
 * - Active enrollments
 * - Students needing attention
 * - Recent activity
 */
export default async function StaffDashboard() {
  // Require staff or admin role
  const { user, profile } = await requireRole([
    'staff',
    'admin',
    'super_admin',
  ]);

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  // Get student counts
  const { count: totalStudents } = await db
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Get active enrollments
  const { count: activeEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get at-risk students
  const { count: atRiskCount } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('at_risk', true);

  // Get pending enrollments
  const { count: pendingEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Get recent enrollments for activity feed
  const { data: recentEnrollments } = await db
    .from('program_enrollments')
    .select(
      `
      id,
      status,
      created_at,
      profiles!enrollments_user_id_fkey (
        full_name,
        email
      ),
      programs (
        name
      )
    `
    )
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'Dashboard' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="bg-white border-b border-slate-200 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-black">Staff Dashboard</h1>
          <p className="text-black mt-2">
            Welcome back, {profile.full_name || profile.email}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-11 w-11 text-brand-blue-600" />
              <span className="text-3xl font-bold text-black">
                {totalStudents || 0}
              </span>
            </div>
            <div className="text-sm text-black">Total Students</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-11 w-11 text-brand-green-600" />
              <span className="text-3xl font-bold text-black">
                {activeEnrollments || 0}
              </span>
            </div>
            <div className="text-sm text-black">Active Enrollments</div>
          </div>

          <div
            className={`rounded-lg shadow-sm border p-6 ${
              (atRiskCount || 0) > 0
                ? 'bg-yellow-50 border-yellow-600'
                : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <AlertCircle
                className={`h-11 w-11 ${
                  (atRiskCount || 0) > 0 ? 'text-yellow-600' : 'text-slate-400'
                }`}
              />
              <span
                className={`text-3xl font-bold ${
                  (atRiskCount || 0) > 0 ? 'text-yellow-900' : 'text-black'
                }`}
              >
                {atRiskCount || 0}
              </span>
            </div>
            <div
              className={`text-sm ${
                (atRiskCount || 0) > 0 ? 'text-yellow-900' : 'text-black'
              }`}
            >
              At-Risk Students
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <Clock className="h-11 w-11 text-brand-blue-600" />
              <span className="text-3xl font-bold text-black">
                {pendingEnrollments || 0}
              </span>
            </div>
            <div className="text-sm text-black">Pending Enrollments</div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <Link
                href="/admin/students"
                className="block p-3 border rounded-lg hover:bg-slate-50 transition"
              >
                <div className="font-semibold">View All Students</div>
                <div className="text-sm text-black">
                  Manage student accounts and enrollments
                </div>
              </Link>
              <Link
                href="/admin/programs"
                className="block p-3 border rounded-lg hover:bg-slate-50 transition"
              >
                <div className="font-semibold">View Programs</div>
                <div className="text-sm text-black">
                  Browse available training programs
                </div>
              </Link>
              <Link
                href="/admin/reports"
                className="block p-3 border rounded-lg hover:bg-slate-50 transition"
              >
                <div className="font-semibold">Generate Reports</div>
                <div className="text-sm text-black">
                  Access analytics and insights
                </div>
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold mb-4">Support Tasks</h2>
            <div className="space-y-3">
              {(atRiskCount || 0) > 0 && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 text-yellow-900 font-semibold">
                    <AlertCircle className="h-5 w-5" />
                    {atRiskCount} At-Risk Students
                  </div>
                  <div className="text-sm text-yellow-800 mt-1">
                    These students need immediate attention
                  </div>
                </div>
              )}
              {(pendingEnrollments || 0) > 0 && (
                <div className="p-3 bg-brand-blue-50 border border-brand-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-brand-blue-900 font-semibold">
                    <Clock className="h-5 w-5" />
                    {pendingEnrollments} Pending Enrollments
                  </div>
                  <div className="text-sm text-brand-blue-800 mt-1">
                    Review and approve new enrollments
                  </div>
                </div>
              )}
              {(atRiskCount || 0) === 0 && (pendingEnrollments || 0) === 0 && (
                <div className="p-3 bg-brand-green-50 border border-brand-green-200 rounded-lg">
                  <div className="flex items-center gap-2 text-brand-green-900 font-semibold">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    All Caught Up!
                  </div>
                  <div className="text-sm text-brand-green-800 mt-1">
                    No urgent tasks at this time
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xl font-semibold">Recent Enrollments</h2>
          </div>
          <div className="overflow-x-auto">
            {recentEnrollments && recentEnrollments.length > 0 ? (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Program
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {recentEnrollments.map((enrollment) => (
                    <tr key={enrollment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm text-black">
                        {enrollment.profiles?.full_name ||
                          enrollment.profiles?.email ||
                          'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm text-black">
                        {enrollment.programs?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-2 py-2 rounded-full text-xs ${
                            enrollment.status === 'completed'
                              ? 'bg-brand-green-100 text-brand-green-800'
                              : enrollment.status === 'active'
                                ? 'bg-brand-blue-100 text-brand-blue-800'
                                : enrollment.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-slate-100 text-black'
                          }`}
                        >
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500">
                        {safeFormatDate(enrollment.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <p>No recent enrollments</p>
              </div>
            )}
          </div>
        </div>

        {/* Staff Tools */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-black mb-4">Staff Tools</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link href="/staff-portal/students" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Students</Link>
            <Link href="/staff-portal/courses" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Courses</Link>
            <Link href="/staff-portal/campaigns" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Campaigns</Link>
            <Link href="/staff-portal/customer-service" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Customer Service</Link>
            <Link href="/staff-portal/processes" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Processes</Link>
            <Link href="/staff-portal/qa-checklist" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">QA Checklist</Link>
            <Link href="/staff-portal/training" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Training</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
