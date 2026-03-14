import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import LessonManagerClient from './LessonManagerClient';
import QuizManagerClient from './QuizManagerClient';
import { mapCourseRow, type RawCourseRow } from '@/lib/domain';

export const metadata: Metadata = {
  title: 'Course Content | Elevate For Humanity',
  description: 'Manage course content, lessons, and materials.',
};

export default async function CourseContentPage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params;
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: rawCourse } = await db.from('training_courses').select('*').eq('id', courseId).single();
  // mapCourseRow resolves title/course_name drift and normalizes status/nulls.
  // Re-project to the snake_case shape LessonManagerClient expects.
  const mapped = rawCourse ? mapCourseRow(rawCourse as RawCourseRow) : null;
  const course = mapped ? {
    id: mapped.id,
    title: mapped.title,
    description: mapped.description || null,
    duration_hours: mapped.durationHours,
  } : null;
  const { data: lessons } = await db.from('training_lessons').select('*').eq('course_id', courseId).order('lesson_number');

  // Extract quiz data from metadata JSONB (set by AI ingestion pipeline)
  const quizMeta = rawCourse?.metadata as {
    quiz_title?: string;
    quiz_passing_score?: number;
    quiz_questions?: any[];
  } | null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/courses" className="hover:text-primary">Courses</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Content</li>
            </ol>
          </nav>
        </div>
        <LessonManagerClient course={course} initialLessons={lessons || []} courseId={courseId} />
        <div className="mt-8">
          <QuizManagerClient
            courseId={courseId}
            initialQuizTitle={quizMeta?.quiz_title || 'Course Assessment'}
            initialPassingScore={quizMeta?.quiz_passing_score || 70}
            initialQuestions={quizMeta?.quiz_questions || []}
          />
        </div>
      </div>
    </div>
  );
}
