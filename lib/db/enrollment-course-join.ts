import type { SupabaseClient } from '@supabase/supabase-js';

export type LmsCourseSummary = {
  id: string;
  course_name: string | null;
  title?: string | null;
};

/**
 * Attach course metadata from lms_courses (canonical read) for enrollment rows.
 * Avoids PostgREST embeds on legacy training_courses FK.
 */
export async function attachLmsCoursesToEnrollments<
  T extends { course_id?: string | null },
>(supabase: SupabaseClient, rows: T[]): Promise<(T & { course: LmsCourseSummary | null })[]> {
  const courseIds = [...new Set(rows.map((r) => r.course_id).filter(Boolean))] as string[];
  if (courseIds.length === 0) {
    return rows.map((r) => ({ ...r, course: null }));
  }

  const { data: courses, error } = await supabase
    .from('lms_courses')
    .select('id, course_name, title')
    .in('id', courseIds);

  if (error) {
    return rows.map((r) => ({ ...r, course: null }));
  }

  const byId = new Map<string, LmsCourseSummary>(
    (courses ?? []).map((c) => [
      c.id as string,
      {
        id: c.id as string,
        course_name: (c.course_name as string | null) ?? (c.title as string | null) ?? null,
        title: c.title as string | null,
      },
    ]),
  );

  return rows.map((row) => ({
    ...row,
    course: row.course_id ? (byId.get(row.course_id) ?? null) : null,
  }));
}
