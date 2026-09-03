import { createClient } from '@supabase/supabase-js';

const ESB_COURSE_ID = '398acfef-5d20-4c1d-b23a-6982dc05a250';

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function parsePublicStorageUrl(url: string): { bucket: string; path: string } {
  const marker = '/storage/v1/object/public/';
  const markerIndex = url.indexOf(marker);
  if (markerIndex < 0) throw new Error(`Refusing to delete unrecognized storage URL: ${url}`);
  const storagePath = url.slice(markerIndex + marker.length);
  const separator = storagePath.indexOf('/');
  if (separator < 1 || separator === storagePath.length - 1) {
    throw new Error(`Refusing to delete malformed storage URL: ${url}`);
  }
  return {
    bucket: decodeURIComponent(storagePath.slice(0, separator)),
    path: decodeURIComponent(storagePath.slice(separator + 1)),
  };
}

async function main() {
  const supabase = createClient(
    required('SUPABASE_URL'),
    required('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  const { data: jobs, error: jobsError } = await supabase
    .from('video_jobs')
    .select('id, video_url, audio_url, thumbnail_url')
    .eq('course_id', ESB_COURSE_ID);
  if (jobsError) throw jobsError;
  if (jobs.length !== 105) {
    throw new Error(`Safety gate: expected exactly 105 ESB video jobs, found ${jobs.length}`);
  }

  const objects = new Map<string, Set<string>>();
  for (const job of jobs) {
    for (const url of [job.video_url, job.audio_url, job.thumbnail_url]) {
      if (!url) continue;
      const { bucket, path } = parsePublicStorageUrl(url);
      const paths = objects.get(bucket) ?? new Set<string>();
      paths.add(path);
      objects.set(bucket, paths);
    }
  }

  const objectCount = [...objects.values()].reduce((sum, paths) => sum + paths.size, 0);
  if (objectCount !== 204) {
    throw new Error(`Safety gate: expected exactly 204 ESB storage objects, resolved ${objectCount}`);
  }

  for (const [bucket, pathSet] of objects) {
    const paths = [...pathSet];
    for (let offset = 0; offset < paths.length; offset += 100) {
      const batch = paths.slice(offset, offset + 100);
      const { data: removed, error } = await supabase.storage.from(bucket).remove(batch);
      if (error) throw new Error(`Storage deletion failed in ${bucket}: ${error.message}`);
      if ((removed?.length ?? 0) !== batch.length) {
        throw new Error(
          `Storage deletion count mismatch in ${bucket}: requested ${batch.length}, removed ${removed?.length ?? 0}`,
        );
      }
    }
  }

  const { data: deleted, error: deleteError } = await supabase
    .from('video_jobs')
    .delete()
    .eq('course_id', ESB_COURSE_ID)
    .select('id');
  if (deleteError) throw deleteError;
  if (deleted.length !== 105) {
    throw new Error(`Database deletion count mismatch: expected 105, deleted ${deleted.length}`);
  }

  const { count, error: verifyError } = await supabase
    .from('video_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('course_id', ESB_COURSE_ID);
  if (verifyError) throw verifyError;
  if (count !== 0) throw new Error(`Verification failed: ${count} ESB video jobs remain`);

  console.log(JSON.stringify({
    ok: true,
    courseId: ESB_COURSE_ID,
    deletedJobs: deleted.length,
    deletedStorageObjects: objectCount,
  }));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
