import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { mapCourseRow, type RawCourseRow } from '@/lib/domain';

export const metadata: Metadata = {
  title: 'Learn | Elevate For Humanity',
  description: 'Access your course learning materials.',
};

export default async function LearnPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient();
  const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Use underlying tables directly to avoid VIEW permission issues
  const { data: rawCourse } = await db.from('training_courses').select('*').eq('id', courseId).single();
  const course = rawCourse ? mapCourseRow(rawCourse as RawCourseRow) : null;
  const { data: lessons } = await db.from('training_lessons').select('*').eq('course_id', courseId).order('order_index');
  const { data: enrollment } = await db.from('training_enrollments').select('*').eq('course_id', courseId).eq('user_id', user.id).single();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href={`/courses/${courseId}`} className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">← Back to Course</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{course?.title ?? 'Course'}</h1>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-sm text-gray-500">{lessons?.length || 0} lessons</span>
            <span className="text-sm text-gray-500">Progress: {enrollment?.progress || 0}%</span>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h2 className="font-semibold mb-4">Course Content</h2>
              <div className="space-y-2">
                {lessons && lessons.length > 0 ? lessons.map((lesson: any, i: number) => (
                  <Link key={lesson.id} href={`/courses/${courseId}/lessons/${lesson.id}`} className="block p-2 rounded hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 bg-brand-blue-100 text-brand-blue-600 rounded-full flex items-center justify-center text-xs">{i + 1}</span>
                      <span className="text-sm">{lesson.title}</span>
                    </div>
                  </Link>
                )) : <p className="text-sm text-gray-500">No lessons available</p>}
              </div>
            </div>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center mb-6">
                <p className="text-white">Select a lesson to begin</p>
              </div>
              <h2 className="text-xl font-semibold mb-2">Welcome to {course?.course_name || course?.title}</h2>
              <p className="text-gray-600">{course?.description || 'Start learning by selecting a lesson from the sidebar.'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
