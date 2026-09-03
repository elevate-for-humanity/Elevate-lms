import type { Metadata } from 'next';
import { getCurrentUser } from '@/lib/auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import CanonicalHvacCourseHome from './CanonicalHvacCourseHome';

export const metadata: Metadata = {
  title: 'HVAC Technician Course',
  description: 'HVAC technician training with EPA Section 608 preparation, safety, diagnostics, and hands-on learning.',
};

export const dynamic = 'force-dynamic';

export default async function HvacCoursePage() {
  const db = await requireAdminClient();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id, title, description, slug, is_active')
    .eq('slug', 'hvac-technician')
    .maybeSingle();

  if (courseError) {
    throw new Error(`HVAC_COURSE_LOOKUP_FAILED:${courseError.message}`);
  }
  if (!course) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-24">
        <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">HVAC course is not published yet</h1>
          <p className="mt-3 text-slate-700">
            The canonical course record could not be found. An administrator must publish the HVAC blueprint before learners can enter the course.
          </p>
        </div>
      </main>
    );
  }

  const [{ data: modules, error: modulesError }, { data: lessons, error: lessonsError }] = await Promise.all([
    db
      .from('course_modules')
      .select('id, title, description, order_index')
      .eq('course_id', course.id)
      .eq('is_published', true)
      .order('order_index', { ascending: true }),
    db
      .from('course_lessons')
      .select('id, module_id, title, lesson_type, duration_minutes, order_index, is_published')
      .eq('course_id', course.id)
      .eq('is_published', true)
      .order('order_index', { ascending: true }),
  ]);

  if (modulesError) throw new Error(`HVAC_MODULES_FAILED:${modulesError.message}`);
  if (lessonsError) throw new Error(`HVAC_LESSONS_FAILED:${lessonsError.message}`);

  const moduleModels = (modules ?? []).map((module) => ({
    id: String(module.id),
    title: String(module.title ?? 'Module'),
    description: module.description ? String(module.description) : null,
    orderIndex: Number(module.order_index ?? 0),
    lessons: (lessons ?? [])
      .filter((lesson) => String(lesson.module_id) === String(module.id))
      .map((lesson) => ({
        id: String(lesson.id),
        title: String(lesson.title ?? 'Lesson'),
        lessonType: String(lesson.lesson_type ?? 'lesson'),
        durationMinutes: lesson.duration_minutes == null ? null : Number(lesson.duration_minutes),
        orderIndex: Number(lesson.order_index ?? 0),
      }))
      .sort((a, b) => a.orderIndex - b.orderIndex),
  }));

  let completedLessonIds: string[] = [];
  let totalTimeSeconds = 0;
  const user = await getCurrentUser();

  if (user) {
    const { data: progress, error: progressError } = await db
      .from('lesson_progress')
      .select('lesson_id, completed, time_spent_seconds')
      .eq('user_id', user.id)
      .eq('course_id', course.id);

    if (!progressError && progress) {
      completedLessonIds = progress
        .filter((row) => row.completed === true && row.lesson_id)
        .map((row) => String(row.lesson_id));
      totalTimeSeconds = progress.reduce(
        (sum, row) => sum + Number(row.time_spent_seconds ?? 0),
        0,
      );
    }
  }

  return (
    <CanonicalHvacCourseHome
      courseId={String(course.id)}
      title={String(course.title ?? 'HVAC Technician')}
      description={course.description ? String(course.description) : null}
      modules={moduleModels}
      completedLessonIds={completedLessonIds}
      totalTimeSeconds={totalTimeSeconds}
    />
  );
}
