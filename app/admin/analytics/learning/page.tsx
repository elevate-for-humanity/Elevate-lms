import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/analytics/learning',
  },
  title: 'Learning Analytics | Elevate For Humanity',
  description: 'Track course completion rates, learning progress, and educational outcomes.',
};

export default async function LearningAnalyticsPage() {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch learning analytics data
  const { count: totalCourses } = await db
    .from('courses')
    .select('*', { count: 'exact', head: true });

  const { count: totalEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  const { count: completedEnrollments } = await db
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: totalCertificates } = await db
    .from('certificates')
    .select('*', { count: 'exact', head: true });

  const { data: topCourses } = await db
    .from('courses')
    .select('id, title, enrollment_count')
    .order('enrollment_count', { ascending: false })
    .limit(10);

  const completionRate = totalEnrollments 
    ? Math.round(((completedEnrollments || 0) / totalEnrollments) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/analytics" className="hover:text-primary">Analytics</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Learning</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Learning Analytics</h1>
          <p className="text-gray-600 mt-2">Track course performance and learner progress</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Courses</h3>
              <span className="text-brand-blue-600 bg-brand-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalCourses || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Available courses</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Enrollments</h3>
              <span className="text-brand-green-600 bg-brand-green-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalEnrollments || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total enrollments</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
              <span className="text-brand-blue-600 bg-brand-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{completionRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Courses completed</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Certificates Issued</h3>
              <span className="text-brand-orange-600 bg-brand-orange-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalCertificates || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Certificates earned</p>
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Top Courses by Enrollment</h2>
            <p className="text-sm text-gray-500">Most popular courses</p>
          </div>
          <div className="divide-y">
            {topCourses && topCourses.length > 0 ? (
              topCourses.map((course: any, index: number) => (
                <div key={course.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <span className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center text-brand-blue-600 font-semibold text-sm">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{course.title}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{course.enrollment_count || 0}</p>
                    <p className="text-sm text-gray-500">enrollments</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No course data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
