export type LessonRowLike = Record<string, unknown> & {
  slug?: string | null;
  lesson_slug?: string | null;
  video_url?: string | null;
};

export function normalizeLessonRow<T extends LessonRowLike>(row: T): T {
  const slug = (row.slug ?? row.lesson_slug) as string | null | undefined;
  return {
    ...row,
    slug: slug ?? null,
    lesson_slug: (row.lesson_slug ?? row.slug) as string | null | undefined,
  };
}

export function mergeCourseLessonFields<T extends LessonRowLike>(
  row: T,
  courseLesson: { slug?: string | null; video_url?: string | null } | null,
): T {
  const normalized = normalizeLessonRow(row);
  if (!courseLesson) return normalized;
  return {
    ...normalized,
    slug: normalized.slug || courseLesson.slug || null,
    lesson_slug: normalized.slug || courseLesson.slug || null,
    video_url: normalized.video_url || courseLesson.video_url || null,
  };
}
