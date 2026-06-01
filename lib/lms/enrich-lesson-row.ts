import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Live DB `lms_lessons` view can lag migrations: missing `video_url`, `slug` renamed to `lesson_slug`.
 * Always hydrate from canonical `course_lessons` when those fields are absent.
 */
export async function enrichLessonRowFromCourseLessons(
  supabase: SupabaseClient,
  lessonId: string,
  lessonData: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const slug =
    (typeof lessonData.slug === 'string' && lessonData.slug) ||
    (typeof lessonData.lesson_slug === 'string' && lessonData.lesson_slug) ||
    null;

  const hasVideo =
    typeof lessonData.video_url === 'string' && lessonData.video_url.trim().length > 0;

  if (hasVideo && slug) {
    return { ...lessonData, slug };
  }

  const { data: canonical } = await supabase
    .from('course_lessons')
    .select('video_url, slug, video_config, lesson_type, content_type')
    .eq('id', lessonId)
    .maybeSingle();

  if (!canonical) {
    return { ...lessonData, slug };
  }

  return {
    ...lessonData,
    slug: slug ?? canonical.slug,
    video_url: hasVideo ? lessonData.video_url : canonical.video_url,
    video_config: lessonData.video_config ?? canonical.video_config,
    step_type:
      lessonData.step_type ?? canonical.lesson_type ?? canonical.content_type ?? 'lesson',
    content_type: lessonData.content_type ?? canonical.content_type ?? canonical.lesson_type,
  };
}
