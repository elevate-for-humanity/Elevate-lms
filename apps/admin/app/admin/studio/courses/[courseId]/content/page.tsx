import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import LessonManagerClient from './LessonManagerClient';
import QuizManagerClient from './QuizManagerClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Course Content | Elevate For Humanity',
  description: 'Manage course content, lessons, and materials.',
};

export default async function CourseContentPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  await requireRole(['admin', 'staff']);
  const { courseId } = await params;
  const supabase = await createClient();

  const { data: rawCourse } = await supabase
    .from('lms_courses')
    .select('*')
    .eq('id', courseId)
    .maybeSingle();

  // Canonical courses table — always checked for video_config / video_profile / title
  const { data: canonicalCourse } = await supabase
    .from('courses')
    .select('id, title, slug, description, video_config, video_profile, status')
    .eq('id', courseId)
    .maybeSingle();

  // Prefer canonical course data, fall back to legacy
  const course = canonicalCourse
    ? {
        ...canonicalCourse,
        course_name: canonicalCourse.title,
        video_config: canonicalCourse.video_config ?? null,
        video_profile: canonicalCourse.video_profile ?? null,
      }
    : rawCourse
      ? {
          ...rawCourse,
          title: rawCourse.course_name || rawCourse.title,
          video_config: null,
          video_profile: null,
        }
      : null;

  // Lessons: try curriculum_lessons (canonical) first, fall back to training_lessons (legacy)
  let lessons: unknown[];
  const { data: curriculumLessons } = await supabase
    .from('curriculum_lessons')
    .select('id, title, slug, lesson_order, step_type, status, module_id')
    .eq('course_id', courseId)
    .order('lesson_order');

  if (curriculumLessons && curriculumLessons.length > 0) {
    lessons = curriculumLessons;
  } else {
    const { data: legacyLessons } = await supabase
      .from('lms_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('lesson_number');
    lessons = legacyLessons ?? [];
  }

  // Extract quiz data from metadata JSONB (set by AI ingestion pipeline — legacy path only)
  const quizMeta = (rawCourse?.metadata ?? null) as {
    quiz_title?: string;
    quiz_passing_score?: number;
    quiz_questions?: unknown[];
  } | null;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li>
                <Link href="/admin" className="hover:text-primary">
                  Admin
                </Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/admin/courses" className="hover:text-primary">
                  Courses
                </Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Content</li>
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
