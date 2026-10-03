import type { SupabaseClient } from '@supabase/supabase-js';
import { UltimateJobQueue } from './job-queue';
import { observedLicenseEvidence } from '../adapters/platform-media';

/** Shared by secure imports and the builder. Resume only after the actual
 * licensed file is attached; selected/download-requested manifest flags are intent. */
export async function resumeMediaDependency(
  db: SupabaseClient,
  courseId: string,
  lessonIds: string[],
) {
  if (!lessonIds.length) return [];
  const { data: matches, error: matchError } = await db
    .from('course_lesson_media_matches')
    .select('lesson_id,course_video_id,entitlement_id')
    .eq('course_id', courseId)
    .eq('status', 'attached')
    .in('lesson_id', lessonIds);
  if (matchError) throw matchError;
  const { data: files, error: fileError } = await db
    .from('course_videos')
    .select(
      'id,lesson_id,storage_path,entitlement_id,licensed_media_entitlements(provider,provider_item_id,license_document_url,metadata)',
    )
    .eq('course_id', courseId)
    .eq('status', 'ready')
    .eq('asset_role', 'source_broll')
    .not('entitlement_id', 'is', null);
  if (fileError) throw fileError;
  const stored: Array<{ id: string; lessonIds: string[] }> = [];
  for (const file of files ?? []) {
    const entitlement: any = Array.isArray(file.licensed_media_entitlements)
      ? file.licensed_media_entitlements[0]
      : file.licensed_media_entitlements;
    if (entitlement?.provider !== 'envato' || !observedLicenseEvidence(entitlement)) continue;
    const linkedLessons = new Set<string>(
      lessonIds.includes(file.lesson_id) ? [file.lesson_id] : [],
    );
    for (const match of matches ?? []) {
      if (match.course_video_id === file.id && match.entitlement_id === file.entitlement_id)
        linkedLessons.add(match.lesson_id);
    }
    if (!linkedLessons.size || !file.storage_path) continue;
    // Object existence, not a naming convention, proves that the import finished.
    // The short-lived URL is discarded; scene/action and finished-video checks
    // still run in the resumed builder before any publication.
    const { data: object, error: storageError } = await db.storage
      .from('course_videos')
      .createSignedUrl(file.storage_path, 60);
    if (storageError) {
      if (/object not found|not_found/i.test(storageError.message)) continue;
      throw storageError;
    }
    if (!object?.signedUrl) continue;
    stored.push({ id: file.id, lessonIds: [...linkedLessons] });
  }
  if (!stored.length) return [];
  const { data: builds, error } = await db
    .from('ultimate_course_builds')
    .select('id')
    .eq('course_id', courseId)
    .neq('status', 'published');
  if (error) throw error;
  const queue = new UltimateJobQueue(db);
  const jobs = [];
  for (const build of builds ?? [])
    jobs.push(
      await queue.enqueue(build.id, {
        dependencyResume: 'licensed_media_attached',
        lessonIds: [...new Set(stored.flatMap((f) => f.lessonIds))],
        assetIds: stored.map((f) => f.id),
      }),
    );
  return jobs;
}
