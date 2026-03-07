import Image from 'next/image';
import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get courses assigned to this instructor
  const { data: myCourses } = await db.from('training_courses').select('id').eq('instructor_id', user.id);
  const courseIds = (myCourses || []).map((c: any) => c.id);
  const totalCourses = courseIds.length;

  // Get enrollment counts for those courses
  const { count: totalStudents } = courseIds.length > 0
    ? await db.from('training_enrollments').select('*', { count: 'exact', head: true }).in('course_id', courseIds)
    : { count: 0 };
  const { count: completedEnrollments } = courseIds.length > 0
    ? await db.from('training_enrollments').select('*', { count: 'exact', head: true }).in('course_id', courseIds).eq('status', 'completed')
    : { count: 0 };
  const completionRate = (totalStudents && totalStudents > 0) ? Math.round(((completedEnrollments || 0) / totalStudents) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/instructor-page-1.jpg" alt="Instructor portal" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/instructor" className="hover:text-primary">Instructor</Link></li><li>/</li><li className="text-gray-900 font-medium">Analytics</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Teaching Analytics</h1>
          <p className="text-gray-600 mt-2">Track your teaching performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Total Students</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">{totalStudents || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Active Courses</h3><p className="text-3xl font-bold text-brand-green-600 mt-2">{totalCourses || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Avg. Rating</h3><p className="text-3xl font-bold text-yellow-600 mt-2">N/A</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Completion Rate</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">{completionRate}%</p></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Student Engagement</h2><StudentEngagementChart /></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Course Performance</h2><CoursePerformanceChart /></div>
        </div>
      </div>
    </div>
  );
}
