import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Search, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Courses | Staff Portal | Elevate For Humanity',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function StaffCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/staff-portal/courses');

  // Fetch courses from training_programs table
  const { data: courses } = await supabase
    .from('training_programs')
    .select('id, name, slug, category, tuition_cost, duration_weeks, is_active')
    .order('name');

  // Get enrollment counts per program
  const { data: enrollmentCounts } = await supabase
    .from('program_enrollments')
    .select('program_id')
    .eq('status', 'ACTIVE');

  const enrollmentMap = (enrollmentCounts || []).reduce((acc: Record<string, number>, e: any) => {
    acc[e.program_id] = (acc[e.program_id] || 0) + 1;
    return acc;
  }, {});

  const courseList = (courses || []).map((course: any) => ({
    id: course.id,
    title: course.name,
    slug: course.slug,
    students: enrollmentMap[course.id] || 0,
    status: course.is_active ? 'Active' : 'Draft',
    category: course.category,
    duration: course.duration_weeks,
  }));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'Courses' }]} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <div className="flex gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search courses..." className="pl-10 pr-4 py-2 border rounded-lg" />
            </div>
            <Link href="/staff-portal/courses/create" className="flex items-center gap-2 px-4 py-2 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Plus className="w-5 h-5" /> New Course
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-900">Course</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Category</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Students</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Duration</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {courseList.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-500">
                      No courses found. Create your first course to get started.
                    </td>
                  </tr>
                ) : (
                  courseList.map((course: any) => (
                    <tr key={course.id} className="hover:bg-white">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <BookOpen className="w-5 h-5 text-brand-blue-600" />
                          <span className="font-medium text-gray-900">{course.title}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600 capitalize">{course.category || '-'}</td>
                      <td className="p-4 text-gray-600">{course.students}</td>
                      <td className="p-4 text-gray-600">{course.duration ? `${course.duration} weeks` : '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          course.status === 'Active' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-white text-gray-700'
                        }`}>{course.status}</span>
                      </td>
                      <td className="p-4">
                        <Link href={`/staff-portal/courses/${course.slug || course.id}`} className="text-brand-blue-600 hover:underline text-sm">Manage</Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
