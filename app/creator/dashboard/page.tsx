import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Palette, BookOpen, Users, TrendingUp, Plus, Eye, Edit, BarChart3 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Creator Studio | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function CreatorDashboardPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    redirect('/login?redirect=/creator/dashboard');
  }

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/creator/dashboard');
  }

  // Fetch courses created by this user
  const { data: coursesData } = await db
    .from('training_courses')
    .select('id, course_name, is_active, enrolled_count, created_at')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  const courses = (coursesData || []).map(c => ({
    id: c.id,
    title: c.course_name || 'Untitled Course',
    students: c.enrolled_count || 0,
    status: c.is_active ? 'published' : 'draft',
  }));

  const totalStudents = courses.reduce((sum, c) => sum + c.students, 0);
  const publishedCount = courses.filter(c => c.status === 'published').length;

  const stats = [
    { label: 'Total Courses', value: courses.length.toString(), icon: BookOpen },
    { label: 'Total Students', value: totalStudents.toLocaleString(), icon: Users },
    { label: 'Published', value: publishedCount.toString(), icon: TrendingUp },
    { label: 'Drafts', value: (courses.length - publishedCount).toString(), icon: Edit },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Creator', href: '/creator' }, { label: 'Dashboard' }]} />
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Palette className="w-8 h-8 text-brand-orange-600" />
              <h1 className="text-2xl font-bold text-gray-900">Creator Studio</h1>
            </div>
            <Link href="/creator/courses/new" className="flex items-center gap-2 bg-brand-orange-600 text-white px-4 py-2 rounded-lg hover:bg-brand-orange-700">
              <Plus className="w-5 h-5" /> Create Course
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-orange-100 rounded-lg flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-brand-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">My Courses</h2>
            <Link href="/creator/courses" className="text-brand-orange-600 hover:underline text-sm">View All</Link>
          </div>

          {courses.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-3">Course</th>
                  <th className="pb-3 text-center">Students</th>
                  <th className="pb-3 text-center">Status</th>
                  <th className="pb-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courses.slice(0, 10).map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50">
                    <td className="py-4 font-medium text-gray-900">{course.title}</td>
                    <td className="py-4 text-center text-gray-600">{course.students}</td>
                    <td className="py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${course.status === 'published' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-gray-100 text-gray-700'}`}>
                        {course.status}
                      </span>
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/creator/courses/${course.id}`} className="p-2 text-gray-600 hover:text-brand-blue-600">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/creator/courses/${course.id}/edit`} className="p-2 text-gray-600 hover:text-brand-orange-600">
                          <Edit className="w-4 h-4" />
                        </Link>
                        <Link href={`/creator/analytics/${course.id}`} className="p-2 text-gray-600 hover:text-brand-blue-600">
                          <BarChart3 className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No courses yet</h3>
              <p className="text-gray-600 mb-4">Create your first course to get started.</p>
              <Link href="/creator/courses/new" className="inline-flex items-center gap-2 px-4 py-2 bg-brand-orange-600 text-white rounded-lg hover:bg-brand-orange-700">
                <Plus className="w-4 h-4" /> Create Course
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
