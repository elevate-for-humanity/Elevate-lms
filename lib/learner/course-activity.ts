import type { SupabaseClient } from '@/lib/supabase';
import { readHoursPages } from '@/lib/apprenticeship/admin-hours';

export function distinctPublishedActivity(lessonIds: string[], rows: { lesson_id: string }[]) {
  const published = new Set(lessonIds);
  return new Set(rows.filter((row) => published.has(row.lesson_id)).map((row) => row.lesson_id))
    .size;
}

/** Assessment/video evidence remains visible without awarding lesson completion or hours. */
export async function loadCourseActivity(
  db: SupabaseClient,
  userId: string,
  courseId: string,
  lessonIds: string[],
) {
  const [scores, videos] = await Promise.all([
    readHoursPages<{ lesson_id: string }>((from, to) =>
      db
        .from('checkpoint_scores')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('passed', true)
        .order('id')
        .range(from, to),
    ),
    readHoursPages<{ lesson_id: string }>((from, to) =>
      db
        .from('learner_video_progress')
        .select('lesson_id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('completed', true)
        .order('id')
        .range(from, to),
    ),
  ]);
  return {
    assessmentsPassed: distinctPublishedActivity(lessonIds, scores),
    videosCompleted: distinctPublishedActivity(lessonIds, videos),
  };
}
