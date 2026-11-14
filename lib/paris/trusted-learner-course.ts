import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { resolveLatestEnrollment } from '@/lib/enrollment/resolver';
import { loadLessonAvailability } from '@/lib/lms/lesson-availability';
export async function loadTrustedLearnerCourse(db: SupabaseClient, userId: string) {
  const enrollment = await resolveLatestEnrollment({ client: db, userId });
  const blocked = ['withdrawn', 'cancelled', 'rejected', 'revoked', 'suspended', 'inactive'];
  if (
    !enrollment?.courseId ||
    !enrollment.accessGrantedAt ||
    blocked.includes(enrollment.status) ||
    blocked.includes(enrollment.enrollmentState ?? '')
  )
    return null;
  const [courseResult, lessonResult] = await Promise.all([
    db
      .from('courses')
      .select('id,title')
      .eq('id', enrollment.courseId)
      .eq('is_active', true)
      .eq('status', 'published')
      .maybeSingle(),
    db
      .from('course_lessons')
      .select('id,title,order_index')
      .eq('course_id', enrollment.courseId)
      .eq('is_published', true)
      .order('order_index', { ascending: true }),
  ]);
  if (courseResult.error || lessonResult.error)
    throw new Error('LEARNER_COURSE_CONTEXT_UNAVAILABLE');
  if (!courseResult.data) return null;
  const lessons = lessonResult.data ?? [];
  const completed = new Set<string>();
  for (let offset = 0; ; offset += 500) {
    const { data, error } = await db
      .from('lesson_progress')
      .select('lesson_id,completed')
      .eq('user_id', userId)
      .eq('course_id', enrollment.courseId)
      .range(offset, offset + 499);
    if (error) throw new Error('LEARNER_PROGRESS_UNAVAILABLE');
    (data ?? [])
      .filter((row) => row.completed === true)
      .forEach((row) => completed.add(row.lesson_id));
    if ((data ?? []).length < 500) break;
  }
  const available = await loadLessonAvailability(
    db,
    userId,
    lessons.map((lesson) => lesson.id),
  );
  const next = lessons.find(
    (lesson) => !completed.has(lesson.id) && available.get(lesson.id) === true,
  );
  const completedLessons = lessons.filter((lesson) => completed.has(lesson.id)).length;
  return {
    courseId: courseResult.data.id,
    courseTitle: String(courseResult.data.title || 'Current course'),
    nextLessonTitle: next?.title ? String(next.title) : null,
    courseProgress: lessons.length
      ? Math.min(100, Math.round((completedLessons / lessons.length) * 100))
      : 0,
    completedLessons,
    totalLessons: lessons.length,
  };
}
