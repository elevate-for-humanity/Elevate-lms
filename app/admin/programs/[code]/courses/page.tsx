import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { Plus, BookOpen, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Program Courses | Elevate Admin' };

export default async function ProgramCoursesPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: program } = await supabase.from('programs').select('id, title, code, slug').or(`code.eq.${code},slug.eq.${code}`).single();
  if (!program) return <div className="p-8"><h1 className="text-2xl font-bold">Program not found</h1></div>;

  const { data: courses } = await supabase
    .from('training_courses')
    .select('id, course_name, title, slug, is_active, duration_hours, enrolled_count, status')
    .eq('program_id', program.id)
    .order('created_at', { ascending: true });

  // Get lesson counts per course
  const courseIds = (courses || []).map((c: any) => c.id);
  const lessonCounts: Record<string, number> = {};
  if (courseIds.length > 0) {
    const { data: lessons } = await supabase
      .from('training_lessons')
      .select('course_id')
      .in('course_id', courseIds);
    for (const l of lessons || []) {
      lessonCounts[l.course_id] = (lessonCounts[l.course_id] || 0) + 1;
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-4">
        <ol className="flex items-center space-x-2 text-gray-500">
          <li><Link href="/admin/programs" className="hover:text-brand-blue-600">Programs</Link></li>
          <li>/</li>
          <li><Link href={`/admin/programs/${code}/dashboard`} className="hover:text-brand-blue-600">{program.title}</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Courses</li>
        </ol>
      </nav>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Courses — {program.title}</h1>
        <Link
          href="/admin/courses/create"
          className="inline-flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Course
        </Link>
      </div>

      {(!courses || courses.length === 0) ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses yet</h3>
          <p className="text-gray-500 mb-4">Create the first course for this program.</p>
          <Link href="/admin/courses/create" className="text-brand-blue-600 hover:underline">Create Course</Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg border divide-y">
          {courses.map((course: any) => (
            <Link
              key={course.id}
              href={`/admin/courses/${course.id}`}
              className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{course.title || course.course_name}</h3>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>{lessonCounts[course.id] || 0} lessons</span>
                  {course.duration_hours && <span>{course.duration_hours}h</span>}
                  <span className={course.is_active ? 'text-green-600' : 'text-gray-400'}>
                    {course.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
