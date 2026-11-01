import type { SupabaseClient } from '@supabase/supabase-js';
import { UltimateReleaseService } from './release-service';

/** Existing publication URLs cannot bypass the current production contract. */
export async function releaseCanonicalCourse(db: SupabaseClient, courseId: string, actorId: string) {
  const { data: build, error } = await db.from('ultimate_course_builds').select('id')
    .eq('course_id', courseId).in('status', ['built', 'published'])
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw error;
  if (!build) throw new Error('ULTIMATE_BUILD_NOT_RELEASE_READY');
  const release = await new UltimateReleaseService(db).publish(build.id, actorId);
  return { ok: true, authority: 'ultimate-course-builder', release };
}
