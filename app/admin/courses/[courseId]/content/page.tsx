import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import LessonManagerClient from './LessonManagerClient';
import QuizManagerClient from './QuizManagerClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Course Content | Elevate For Humanity',
  description: 'Manage course content, lessons, and materials.',
};

export default async function CourseContentPage({ params }: { params: Promise<{ courseId: string }> }) {
  await requireRole(['admin', 'super_admin']);
  const { courseId } = await params;
  const supabase = await createClient();



  const { data: rawCourse } = await supabase.from('training_courses').select('*').eq('id', courseId).maybeSingle();
  const course = rawCourse ? { ...rawCourse, title: rawCourse.course_name || rawCourse.title } : null;
  const { data: lessons } = await supabase.from('training_lessons').select('*').eq('course_id', courseId).order('lesson_number');

  // Extract quiz data from metadata JSONB (set by AI ingestion pipeline)
  const quizMeta = rawCourse?.metadata as {
    quiz_title?: string;
    quiz_passing_score?: number;
    quiz_questions?: any[];
  } | null;

  return (
    <div className="min-h-screen bg-white">
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
