import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { getCourseMediaState } from '@/lib/course-factory/media-manager';

/** Course build completion is separate from publication. */
export async function markCourseMediaPendingWithClient(input: {
  db: SupabaseClient;
  courseId: string;
}) {
  const { error } = await input.db
    .from('courses')
    .update({
      generation_status: 'generating',
      generation_progress: 95,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.courseId)
    .neq('status', 'published');
  if (error) throw error;
  return { ok: true as const, state: 'media_pending' as const };
}

/**
 * Finalizes one unified build without publishing it. Human review remains the
 * only publication authority after every required video is attached and valid.
 */
export async function finalizeUnifiedCourseBuildWithClient(input: {
  db: SupabaseClient;
  courseId: string;
  verifyUrls?: boolean;
}) {
  const media = await getCourseMediaState(input.courseId, {
    verifyUrls: input.verifyUrls !== false,
  });
  if (!media.completePackage) {
    await markCourseMediaPendingWithClient(input);
    return { ok: false as const, state: 'media_pending' as const, media };
  }

  const now = new Date().toISOString();
  const { error } = await input.db
    .from('courses')
    .update({
      generation_status: 'completed',
      generation_progress: 100,
      status: 'draft',
      review_status: 'draft',
      reviewed_by: null,
      reviewed_at: null,
      published_at: null,
      published_by: null,
      updated_at: now,
    })
    .eq('id', input.courseId)
    .neq('status', 'published');
  if (error) throw error;

  return { ok: true as const, state: 'ready_for_review' as const, media };
}
