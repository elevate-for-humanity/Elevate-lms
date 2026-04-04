
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { Users, BookOpen, AlertCircle, Clock, UserPlus, DollarSign, FileText, Timer, CalendarOff, ClipboardList, Scissors } from 'lucide-react';
import { safeFormatDate } from '@/lib/format-utils';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

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


  // Get student counts
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  // Get active enrollments
  const { count: activeEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get at-risk students
  const { count: atRiskCount } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('at_risk', true);

  // Get pending enrollments
  const { count: pendingEnrollments } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending');

  // Get recent enrollments for activity feed
  const { data: recentEnrollments } = await supabase
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
    <div className="min-h-screen bg-white">
      {/* Breadcrumbs */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'Dashboard' }]} />
        </div>
      </div>

      {/* Header */}
      <section className="border-b border-slate-200 py-6">
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
                className="block p-3 border rounded-lg hover:bg-white transition"
              >
                <div className="font-semibold">View All Students</div>
                <div className="text-sm text-black">
                  Manage student accounts and enrollments
                </div>
              </Link>
              <Link
                href="/admin/programs"
                className="block p-3 border rounded-lg hover:bg-white transition"
              >
                <div className="font-semibold">View Programs</div>
                <div className="text-sm text-black">
                  Browse available training programs
                </div>
              </Link>
              <Link
                href="/admin/reports"
                className="block p-3 border rounded-lg hover:bg-white transition"
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
                <thead className="bg-white">
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
                    <tr key={enrollment.id} className="hover:bg-white">
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
                                  : 'bg-white text-black'
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

        {/* Booth Renters — visible to all staff */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-black mb-4">Booth &amp; Suite Rentals</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/staff-portal/booth-renters" className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-500 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center flex-shrink-0">
                <Scissors className="w-5 h-5 text-brand-blue-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Manage Renters</div>
                <div className="text-xs text-slate-500 mt-0.5">View all booth renters, payment status, and MOU</div>
              </div>
            </Link>
            <Link href="/booth-rental/apply" className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-500 hover:shadow-sm transition-all">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <UserPlus className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">Add New Renter</div>
                <div className="text-xs text-slate-500 mt-0.5">Start the signup and payment flow</div>
              </div>
            </Link>
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
            <Link href="/staff-portal/dashboard" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Processes</Link>
            <Link href="/staff-portal/qa-checklist" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">QA Checklist</Link>
            <Link href="/staff-portal/training" aria-label="Link" className="p-3 bg-white border rounded-lg hover:border-brand-blue-500 hover:shadow text-sm">Training</Link>
          </div>
        </div>

        {/* HR, Hiring & Payroll — admin/super_admin only */}
        {['admin', 'super_admin'].includes(profile?.role ?? '') && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-black mb-4">HR, Hiring &amp; Payroll</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

              {/* Hiring */}
              <Link href="/apply/staff" className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-500 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center flex-shrink-0">
                  <UserPlus className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Staff Application</div>
                  <div className="text-xs text-slate-500 mt-0.5">Public hiring form — share with candidates</div>
                </div>
              </Link>

              <Link href="/admin/applicants" className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-500 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-brand-blue-50 flex items-center justify-center flex-shrink-0">
                  <ClipboardList className="w-5 h-5 text-brand-blue-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Applicant Review</div>
                  <div className="text-xs text-slate-500 mt-0.5">Review and process incoming applications</div>
                </div>
              </Link>

              {/* Employees */}
              <Link href="/admin/hr/employees" className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-500 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Employee Directory</div>
                  <div className="text-xs text-slate-500 mt-0.5">View and manage all staff records</div>
                </div>
              </Link>

              {/* Payroll */}
              <Link href="/admin/hr/payroll" className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-500 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Payroll</div>
                  <div className="text-xs text-slate-500 mt-0.5">Run payroll and view pay history</div>
                </div>
              </Link>

              {/* Time tracking */}
              <Link href="/admin/hr/time" className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-500 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Timer className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Time Tracking</div>
                  <div className="text-xs text-slate-500 mt-0.5">Review staff hours and timesheets</div>
                </div>
              </Link>

              {/* Leave */}
              <Link href="/admin/hr/leave" className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-500 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <CalendarOff className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Leave Requests</div>
                  <div className="text-xs text-slate-500 mt-0.5">Approve or deny time-off requests</div>
                </div>
              </Link>

              {/* Onboarding */}
              <Link href="/onboarding/staff" className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:border-brand-blue-500 hover:shadow-sm transition-all">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <div className="font-semibold text-slate-900 text-sm">Staff Onboarding</div>
                  <div className="text-xs text-slate-500 mt-0.5">New hire onboarding checklist and docs</div>
                </div>
              </Link>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
