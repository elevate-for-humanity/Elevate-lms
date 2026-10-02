import type { SupabaseClient } from '@supabase/supabase-js';
import { UltimateJobQueue } from './job-queue';

/** Shared by secure imports and the builder. Resume only after the actual
 * licensed file is attached; selected/download-requested manifest flags are intent. */
export async function resumeMediaDependency(db: SupabaseClient, courseId: string, lessonIds: string[]) {
  if (!lessonIds.length) return [];
  const { data: files, error: fileError } = await db.from('course_videos')
    .select('id,lesson_id,storage_path,entitlement_id')
    .eq('course_id', courseId).eq('status','ready').eq('asset_role','source_broll')
    .in('lesson_id', lessonIds).not('entitlement_id','is',null);
  if (fileError) throw fileError;
  const stored = files?.filter(f => String(f.storage_path ?? '').startsWith('licensed-library/envato/')) ?? [];
  if (!stored.length) return [];
  const { data: builds, error } = await db.from('ultimate_course_builds')
    .select('id').eq('course_id',courseId).neq('status','published');
  if (error) throw error;
  const queue = new UltimateJobQueue(db);
  const jobs = [];
  for (const build of builds ?? []) jobs.push(await queue.enqueue(build.id, {
    dependencyResume:'licensed_media_attached',
    lessonIds:[...new Set(stored.map(f=>f.lesson_id))], assetIds:stored.map(f=>f.id),
  }));
  return jobs;
}
