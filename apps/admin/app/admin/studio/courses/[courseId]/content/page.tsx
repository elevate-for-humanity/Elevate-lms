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

type LessonInput = {
  id: string;
  course_id?: string | null;
  title?: string | null;
  content?: string | null;
  video_url?: string | null;
  order_index?: number | null;
  lesson_order?: number | null;
  lesson_number?: number | null;
  duration_minutes?: number | null;
  created_at?: string | null;
};

type LessonView = {
  id: string;
  course_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  order_index: number;
  duration_minutes: number | null;
  created_at: string;
};

type QuizQuestion = {
  question_text: string;
  question_type: 'multiple_choice' | 'true_false';
  options: string[];
  correct_answer: string;
  points: number;
};

function normalizeLesson(row: LessonInput, courseId: string, index: number): LessonView {
  return {
    id: String(row.id),
    course_id: row.course_id || courseId,
    title: row.title || `Lesson ${index + 1}`,
    content: row.content ?? null,
    video_url: row.video_url ?? null,
    order_index: row.order_index ?? row.lesson_order ?? row.lesson_number ?? index,
    duration_minutes: row.duration_minutes ?? null,
    created_at: row.created_at || new Date(0).toISOString(),
  };
}

function isQuizQuestion(value: unknown): value is QuizQuestion {
  if (!value || typeof value !== 'object') return false;
  const q = value as Record<string, unknown>;
  return (
    typeof q.question_text === 'string' &&
    (q.question_type === 'multiple_choice' || q.question_type === 'true_false') &&
    Array.isArray(q.options) &&
    q.options.every((option) => typeof option === 'string') &&
    typeof q.correct_answer === 'string' &&
    typeof q.points === 'number'
  );
}

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

  const { data: canonicalCourse } = await supabase
    .from('courses')
    .select('id, title, slug, description, duration_hours, video_config, video_profile, status')
    .eq('id', courseId)
    .maybeSingle();

  const course = canonicalCourse
    ? {
        id: canonicalCourse.id,
        title: canonicalCourse.title || 'Untitled course',
        description: canonicalCourse.description ?? null,
        duration_hours: canonicalCourse.duration_hours ?? null,
        video_config: canonicalCourse.video_config ?? null,
        video_profile: canonicalCourse.video_profile ?? null,
      }
    : rawCourse
      ? {
          id: rawCourse.id,
          title: rawCourse.course_name || rawCourse.title || 'Untitled course',
          description: rawCourse.description ?? null,
          duration_hours: rawCourse.duration_hours ?? null,
          video_config: null,
          video_profile: null,
        }
      : null;

  let lessons: LessonView[] = [];
  const { data: curriculumLessons } = await supabase
    .from('curriculum_lessons')
    .select('id, course_id, title, content, video_url, lesson_order, duration_minutes, created_at')
    .eq('course_id', courseId)
    .order('lesson_order');

  if (curriculumLessons?.length) {
    lessons = (curriculumLessons as LessonInput[]).map((row, index) =>
      normalizeLesson(row, courseId, index),
    );
  } else {
    const { data: legacyLessons } = await supabase
      .from('lms_lessons')
      .select('*')
      .eq('course_id', courseId)
      .order('lesson_number');
    lessons = ((legacyLessons ?? []) as LessonInput[]).map((row, index) =>
      normalizeLesson(row, courseId, index),
    );
  }

  const quizMeta = (rawCourse?.metadata ?? null) as {
    quiz_title?: string;
    quiz_passing_score?: number;
    quiz_questions?: unknown[];
  } | null;
  const quizQuestions = (quizMeta?.quiz_questions ?? []).filter(isQuizQuestion);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-slate-700">
              <li>
                <Link href="/admin" className="hover:text-primary">Admin</Link>
              </li>
              <li>/</li>
              <li>
                <Link href="/courses" className="hover:text-primary">Courses</Link>
              </li>
              <li>/</li>
              <li className="text-slate-900 font-medium">Content</li>
            </ol>
          </nav>
        </div>
        <LessonManagerClient course={course} initialLessons={lessons} courseId={courseId} />
        <div className="mt-8">
          <QuizManagerClient
            courseId={courseId}
            initialQuizTitle={quizMeta?.quiz_title || 'Course Assessment'}
            initialPassingScore={quizMeta?.quiz_passing_score || 70}
            initialQuestions={quizQuestions}
          />
        </div>
      </div>
    </div>
  );
}
