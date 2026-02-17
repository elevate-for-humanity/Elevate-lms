import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, Users, GraduationCap, Clock, Download, TrendingUp, Calendar } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Reports | Staff Portal | Elevate For Humanity',
  description: 'Generate and view staff reports.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StaffReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/staff-portal/reports');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['staff', 'instructor', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Fetch report data
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Student counts
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student');

  const { count: newStudentsThisWeek } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .gte('created_at', weekAgo);

  // Enrollment stats
  const { count: activeEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: completedThisMonth } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', monthAgo);

  // Attendance today
  const { count: attendanceToday } = await supabase
    .from('attendance')
    .select('*', { count: 'exact', head: true })
    .eq('date', today);

  // Recent enrollments for the table
  const { data: recentEnrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      funding_type,
      enrolled_at,
      student:profiles!enrollments_student_id_fkey(full_name, email),
      program:programs(name)
    `)
    .order('enrolled_at', { ascending: false })
    .limit(10);

  const reportTypes = [
    { 
      name: 'Enrollment Report', 
      description: 'Student enrollment data by program and funding source',
      icon: Users,
      href: '/staff-portal/reports/enrollments'
    },
    { 
      name: 'Attendance Report', 
      description: 'Daily and weekly attendance records',
      icon: Calendar,
      href: '/staff-portal/reports/attendance'
    },
    { 
      name: 'Progress Report', 
      description: 'Student progress and completion rates',
      icon: TrendingUp,
      href: '/staff-portal/reports/progress'
    },
    { 
      name: 'Completion Report', 
      description: 'Certificates issued and program completions',
      icon: GraduationCap,
      href: '/staff-portal/reports/completions'
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'Reports' }]} />
        </div>
      </div>

      <div className="py-8">
      <div className="max-w-7xl mx-auto px-4">
        <nav className="flex items-center gap-2 text-sm text-gray-600 mb-6">
          <Link href="/" className="hover:text-brand-orange-600">Home</Link>
          <ChevronRight className="w-4 h-4" />
          <Link href="/staff-portal" className="hover:text-brand-orange-600">Staff Portal</Link>
          <ChevronRight className="w-4 h-4" />
          <span className="text-gray-900">Reports</span>
        </nav>

        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
            <p className="text-gray-600">Generate and export reports</p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <Users className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalStudents || 0}</p>
            <p className="text-gray-600 text-sm">Total Students</p>
            <p className="text-xs text-brand-green-600 mt-1">+{newStudentsThisWeek || 0} this week</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <GraduationCap className="w-8 h-8 text-brand-green-500 mb-2" />
            <p className="text-2xl font-bold">{activeEnrollments || 0}</p>
            <p className="text-gray-600 text-sm">Active Enrollments</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <TrendingUp className="w-8 h-8 text-brand-orange-500 mb-2" />
            <p className="text-2xl font-bold">{completedThisMonth || 0}</p>
            <p className="text-gray-600 text-sm">Completed This Month</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Clock className="w-8 h-8 text-brand-blue-500 mb-2" />
            <p className="text-2xl font-bold">{attendanceToday || 0}</p>
            <p className="text-gray-600 text-sm">Attendance Today</p>
          </div>
        </div>

        {/* Report Types */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {reportTypes.map(report => (
            <Link key={report.name} href={report.href}
              className="bg-white rounded-xl p-6 border hover:shadow-md transition flex items-start gap-4">
              <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <report.icon className="w-6 h-6 text-brand-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{report.name}</h3>
                <p className="text-sm text-gray-500">{report.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>

        {/* Recent Enrollments Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="font-semibold">Recent Enrollments</h2>
            <button className="flex items-center gap-2 px-3 py-1.5 text-sm border rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Program</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Funding</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recentEnrollments && recentEnrollments.length > 0 ? (
                recentEnrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium">{enrollment.student?.full_name || 'Unknown'}</p>
                      <p className="text-sm text-gray-500">{enrollment.student?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-sm">{enrollment.program?.name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-brand-blue-100 text-brand-blue-700 rounded text-xs uppercase">
                        {enrollment.funding_type || 'self_pay'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        enrollment.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' :
                        enrollment.status === 'completed' ? 'bg-brand-blue-100 text-brand-blue-700' :
                        enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No enrollments found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      </div>
    </div>
  );
}
