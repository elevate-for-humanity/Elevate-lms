#!/usr/bin/env npx tsx
import { getCourseMediaState } from '../../lib/course-factory/media-manager';
import { requireAdminClient } from '../../lib/supabase/admin';

const args = process.argv.slice(2);
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

function storagePath(url: unknown): string | null {
  if (typeof url !== 'string' || !url.trim()) return null;
  const marker = '/storage/v1/object/public/course-videos/';
  const index = url.indexOf(marker);
  if (index < 0) return null;
  const path = url.slice(index + marker.length).split(/[?#]/, 1)[0];
  return path ? decodeURIComponent(path) : null;
}

async function main() {
  const slug = valueAfter('--course');
  const execute = args.includes('--execute');
  if (!slug) throw new Error('--course <slug> is required');

  const db = await requireAdminClient();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,slug,status,is_active')
    .eq('slug', slug)
    .maybeSingle();
  if (courseError || !course) throw new Error(courseError?.message ?? 'Course not found');
  if (course.status === 'published' || course.is_active) {
    throw new Error('Refusing to retire media from a published or active course');
  }

  const media = await getCourseMediaState(course.id, { verifyUrls: true });
  if (!media.completePackage) {
    throw new Error(
      `Replacement media is not complete (${media.complete}/${media.expectedTotal} complete, ` +
      `${media.queued} queued, ${media.rendering} rendering, ${media.failed} failed)`,
    );
  }

  const [{ data: lessons, error: lessonError }, { data: jobs, error: jobError }, { data: versions, error: versionError }, { data: assets, error: assetError }] = await Promise.all([
    db.from('course_lessons').select('id,video_url,video_config').eq('course_id', course.id),
    db.from('video_jobs').select('id,lesson_id,asset_kind,asset_key,video_url,audio_url,thumbnail_url,previous_video_url').eq('course_id', course.id),
    db.from('lesson_video_versions').select('id,video_url,status').eq('course_id', course.id),
    db.from('course_media_assets').select('id,url').eq('course_id', course.id),
  ]);
  if (lessonError) throw lessonError;
  if (jobError) throw jobError;
  if (versionError) throw versionError;
  if (assetError) throw assetError;

  const currentUrls = new Set(
    (lessons ?? []).map((lesson) => lesson.video_url).filter((url): url is string => typeof url === 'string' && Boolean(url.trim())),
  );
  const enabledMicroclipsByLesson = new Map(
    (lessons ?? []).map((lesson) => {
      const config = lesson.video_config && typeof lesson.video_config === 'object'
        ? lesson.video_config as Record<string, unknown>
        : {};
      return [lesson.id, config.enableMicroclips === true] as const;
    }),
  );
  const obsoleteJobs = (jobs ?? []).filter((job) =>
    job.asset_kind === 'microclip' && enabledMicroclipsByLesson.get(job.lesson_id) !== true,
  );
  const obsoleteVersions = (versions ?? []).filter((version) =>
    version.status !== 'active' && !currentUrls.has(version.video_url),
  );
  const candidateUrls = new Set<string>();
  for (const job of jobs ?? []) {
    if (obsoleteJobs.some((candidate) => candidate.id === job.id)) {
      for (const value of [job.video_url, job.audio_url, job.thumbnail_url]) {
        if (typeof value === 'string' && !currentUrls.has(value)) candidateUrls.add(value);
      }
    }
    if (typeof job.previous_video_url === 'string' && !currentUrls.has(job.previous_video_url)) {
      candidateUrls.add(job.previous_video_url);
    }
  }
  for (const version of obsoleteVersions) candidateUrls.add(version.video_url);
  const obsoleteAssets = (assets ?? []).filter((asset) =>
    typeof asset.url === 'string' && candidateUrls.has(asset.url) && !currentUrls.has(asset.url),
  );

  const paths = [...candidateUrls].map(storagePath).filter((path): path is string => Boolean(path));
  const evidence = {
    courseId: course.id,
    courseSlug: course.slug,
    replacementVideos: media.complete,
    obsoleteJobs: obsoleteJobs.length,
    obsoleteVersions: obsoleteVersions.length,
    obsoleteAssets: obsoleteAssets.length,
    removableStorageObjects: paths.length,
    skippedNonSupabaseUrls: candidateUrls.size - paths.length,
    execute,
  };
  if (!execute) {
    console.info(JSON.stringify(evidence, null, 2));
    return;
  }

  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await db.storage.from('course-videos').remove(paths.slice(index, index + 100));
    if (error) throw error;
  }
  if (obsoleteVersions.length) {
    const { error } = await db.from('lesson_video_versions').delete().in('id', obsoleteVersions.map((row) => row.id));
    if (error) throw error;
  }
  if (obsoleteJobs.length) {
    const { error } = await db.from('video_jobs').delete().in('id', obsoleteJobs.map((row) => row.id));
    if (error) throw error;
  }
  if (obsoleteAssets.length) {
    const { error } = await db.from('course_media_assets').delete().in('id', obsoleteAssets.map((row) => row.id));
    if (error) throw error;
  }
  const { error: clearError } = await db
    .from('video_jobs')
    .update({ previous_video_url: null, updated_at: new Date().toISOString() })
    .eq('course_id', course.id)
    .eq('asset_kind', 'lesson');
  if (clearError) throw clearError;

  console.info(JSON.stringify({ ...evidence, retired: true }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
