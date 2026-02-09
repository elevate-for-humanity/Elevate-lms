import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StudentEngagementChart, CoursePerformanceChart } from './InstructorCharts';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/instructor/analytics' },
  title: 'Instructor Analytics | Elevate For Humanity',
  description: 'View teaching analytics and student performance.',
};

export default async function InstructorAnalyticsPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { count: totalStudents } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('instructor_id', user.id);
  const { count: totalCourses } = await supabase.from('courses').select('*', { count: 'exact', head: true }).eq('instructor_id', user.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/instructor" className="hover:text-primary">Instructor</Link></li><li>/</li><li className="text-gray-900 font-medium">Analytics</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Teaching Analytics</h1>
          <p className="text-gray-600 mt-2">Track your teaching performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Total Students</h3><p className="text-3xl font-bold text-blue-600 mt-2">{totalStudents || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Active Courses</h3><p className="text-3xl font-bold text-green-600 mt-2">{totalCourses || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Avg. Rating</h3><p className="text-3xl font-bold text-yellow-600 mt-2">4.8</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Completion Rate</h3><p className="text-3xl font-bold text-blue-600 mt-2">87%</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Student Engagement</h2><StudentEngagementChart /></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Course Performance</h2><CoursePerformanceChart /></div>
        </div>
      </div>
    </div>
  );
}
