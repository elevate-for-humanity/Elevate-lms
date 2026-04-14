import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, GraduationCap, TrendingUp, Circle, Clock } from 'lucide-react';
import ExportButton from './ExportButton';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Enrollment Report | Admin',
  description: 'View enrollment trends and statistics',
};

export default async function EnrollmentReportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/reports/enrollment');
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) redirect('/unauthorized');

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { data: enrollments },
    { count: totalEnrollments },
    { data: courses },
  ] = await Promise.all([
    supabase
      .from('training_enrollments')
      .select('*, course:training_courses(title), student:profiles(full_name, email)')
      .order('enrolled_at', { ascending: false })
      .limit(50),
    supabase.from('training_enrollments').select('*', { count: 'exact', head: true }),
    supabase.from('courses').select('id, title'),
  ]);

  const recentEnrollments = enrollments?.filter(e => 
    new Date(e.enrolled_at) > new Date(thirtyDaysAgo)
  ) || [];

  // Calculate stats
  const completed = enrollments?.filter(e => e.status === 'completed').length || 0;
  const inProgress = enrollments?.filter(e => e.status === 'in_progress').length || 0;
  const completionRate = enrollments?.length ? ((completed / enrollments.length) * 100).toFixed(1) : '0';

  // Enrollment by course
  const enrollmentByCourse: Record<string, number> = {};
  enrollments?.forEach(e => {
    const name = (e.course as { title: string } | null)?.title || 'Unknown';
    enrollmentByCourse[name] = (enrollmentByCourse[name] || 0) + 1;
  });

  const statusColors: Record<string, string> = {
    enrolled: 'bg-brand-blue-100 text-brand-blue-700',
    in_progress: 'bg-yellow-100 text-yellow-700',
    completed: 'bg-brand-green-100 text-brand-green-700',
    dropped: 'bg-brand-red-100 text-brand-red-700',
  };

  return (
    <div className="min-h-screen bg-white p-8">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/reports"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Reports
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Enrollment Report</h1>
              <p className="text-gray-600">Student enrollment trends and program performance</p>
            </div>
            <ExportButton />
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <GraduationCap className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Total Enrollments</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{totalEnrollments || 0}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-green-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-brand-green-600" />
              </div>
              <span className="text-sm text-gray-600">New This Month</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{recentEnrollments.length}</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-brand-blue-100 rounded-lg">
                <Circle className="w-5 h-5 text-brand-blue-600" />
              </div>
              <span className="text-sm text-gray-600">Completion Rate</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{completionRate}%</p>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <span className="text-sm text-gray-600">In Progress</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{inProgress}</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Enrollments</h2>
            {enrollments && enrollments.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Student</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Course</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-2 text-sm font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrollments.slice(0, 10).map((enrollment) => (
                      <tr key={enrollment.id} className="border-b last:border-0">
                        <td className="py-3 px-2">
                          <p className="font-medium text-gray-900">
                            {(enrollment.student as { full_name: string | null } | null)?.full_name || 'Unknown'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {(enrollment.student as { email: string } | null)?.email || ''}
                          </p>
                        </td>
                        <td className="py-3 px-2 text-gray-600">
                          {(enrollment.course as { title: string } | null)?.title || 'N/A'}
                        </td>
                        <td className="py-3 px-2">
                          <span className={`px-2 py-1 text-xs rounded-full ${statusColors[enrollment.status] || 'bg-gray-100'}`}>
                            {enrollment.status}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-sm text-gray-600">
                          {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No enrollments found</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Enrollments by Course</h2>
            {Object.keys(enrollmentByCourse).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(enrollmentByCourse)
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 8)
                  .map(([course, count]) => (
                    <div key={course}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-700 truncate">{course}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-brand-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / (totalEnrollments || 1)) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
