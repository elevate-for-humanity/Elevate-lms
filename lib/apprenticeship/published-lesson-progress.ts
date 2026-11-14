import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { readHoursPages } from './admin-hours';

/** Count only published lesson IDs belonging to this course, once per learner. */
export async function loadPublishedLessonProgress(db: SupabaseClient, courseId: string, userId: string) {
  const [lessons, progress] = await Promise.all([
    readHoursPages<{ id: string }>((from, to) => db.from('course_lessons').select('id')
      .eq('course_id', courseId).eq('is_published', true).order('id').range(from, to)),
    readHoursPages<{ lesson_id: string }>((from, to) => db.from('lesson_progress').select('lesson_id')
      .eq('user_id', userId).eq('course_id', courseId).eq('completed', true)
      .order('id').range(from, to)),
  ]);
  const publishedIds = new Set(lessons.map(row => row.id));
  const completedIds = new Set(progress.map(row => row.lesson_id).filter(id => publishedIds.has(id)));
  return { totalLessons: publishedIds.size, completedLessons: completedIds.size,
    percent: publishedIds.size ? Math.round(completedIds.size / publishedIds.size * 100) : 0 };
}
