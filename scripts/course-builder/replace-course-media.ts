#!/usr/bin/env npx tsx
import { requireAdminClient } from '../../lib/supabase/admin';

const args = process.argv.slice(2);
const valueAfter = (flag: string) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};

function storagePath(url: string): string | null {
  const marker = '/storage/v1/object/public/course-videos/';
  const index = url.indexOf(marker);
  return index >= 0 ? decodeURIComponent(url.slice(index + marker.length)) : null;
}

async function main() {
  const courseSlug = valueAfter('--course');
  const expectedRaw = valueAfter('--expected');
  const expected = expectedRaw ? Number.parseInt(expectedRaw, 10) : null;
  if (!courseSlug) throw new Error('--course <slug> is required');

  const db = await requireAdminClient();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,title,status,is_active')
    .eq('slug', courseSlug)
    .maybeSingle();
  if (courseError || !course) throw new Error(courseError?.message ?? 'Course not found');
  if (course.status === 'published' || course.is_active) {
    throw new Error('Refusing media replacement for a published or active course');
  }

  const { data: lessons, error: lessonError } = await db
    .from('course_lessons')
    .select('id,title,video_url')
    .eq('course_id', course.id)
    .not('video_url', 'is', null);
  if (lessonError) throw new Error(lessonError.message);

  const connected = (lessons ?? []).filter(
    (lesson) => typeof lesson.video_url === 'string' && lesson.video_url.trim(),
  );
  if (expected !== null && connected.length !== expected) {
    throw new Error(
      `Expected exactly ${expected} connected videos for ${courseSlug}; found ${connected.length}. No files were deleted.`,
    );
  }

  const paths = connected
    .map((lesson) => storagePath(lesson.video_url))
    .filter((path): path is string => Boolean(path));
  if (paths.length !== connected.length) {
    throw new Error('One or more connected videos are outside the canonical course-videos bucket');
  }

  for (let index = 0; index < paths.length; index += 100) {
    const { error } = await db.storage.from('course-videos').remove(paths.slice(index, index + 100));
    if (error) throw new Error(`Storage deletion failed: ${error.message}`);
  }

  const lessonIds = connected.map((lesson) => lesson.id);
  const { error: canonicalError } = await db
    .from('course_lessons')
    .update({
      video_url: null,
      video_status: 'pending',
      video_generated_at: null,
      media_quality_status: 'unverified',
      media_quality_evidence: {},
      media_verified_at: null,
    })
    .in('id', lessonIds);
  if (canonicalError) throw new Error(canonicalError.message);

  const { error: consumerError } = await db
    .from('lms_lessons')
    .update({ video_url: null })
    .in('id', lessonIds);
  if (consumerError) throw new Error(consumerError.message);

  const { error: jobError } = await db
    .from('video_jobs')
    .update({
      status: 'draft',
      video_url: null,
      error_message: null,
      review_status: 'not_ready',
      quality_evidence: {},
      completed_at: null,
      lease_token: null,
      lease_expires_at: null,
      heartbeat_at: null,
    })
    .eq('course_id', course.id)
    .eq('asset_kind', 'lesson');
  if (jobError) throw new Error(jobError.message);

  console.log(JSON.stringify({
    courseId: course.id,
    courseSlug,
    deletedVideos: paths.length,
    clearedLessons: lessonIds.length,
    publicationStatus: course.status,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
