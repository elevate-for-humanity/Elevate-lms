import type { SupabaseClient } from '@supabase/supabase-js';
/** Use the same combined module and pacing gate as actual delivery. */
export async function loadLessonAvailability(
  db: SupabaseClient,
  userId: string,
  lessonIds: string[],
) {
  const ids = [...new Set(lessonIds)];
  const result = new Map<string, boolean>();
  for (let offset = 0; offset < ids.length; offset += 8) {
    const page = await Promise.all(
      ids.slice(offset, offset + 8).map(async (id) => {
        const { data, error } = await db.rpc('can_access_lesson', {
          p_user_id: userId,
          p_lesson_id: id,
        });
        if (error) throw new Error('LESSON_AVAILABILITY_UNAVAILABLE');
        return [id, data === true] as const;
      }),
    );
    page.forEach(([id, available]) => result.set(id, available));
  }
  return result;
}
