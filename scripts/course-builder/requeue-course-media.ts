#!/usr/bin/env npx tsx
import { queueCourseLessonVideos } from '../../lib/course-factory/media-service';
import { requireAdminClient } from '../../lib/supabase/admin';

const args = process.argv.slice(2);
const flag = (name: string) => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

async function main() {
  const slug = flag('--course');
  if (!slug) throw new Error('--course <slug> is required');

  const db = await requireAdminClient();
  const { data: course, error } = await db
    .from('courses')
    .select('id,status,is_active')
    .eq('slug', slug)
    .maybeSingle();
  if (error || !course) throw new Error(error?.message ?? 'Course not found');
  if (course.status === 'published' || course.is_active) {
    throw new Error('Refusing to requeue media for a published or active course');
  }

  const media = await queueCourseLessonVideos({
    courseId: course.id,
    onlyMissing: true,
    force: true,
  });
  if (media.lessonVideosReady !== media.attempted) {
    throw new Error(
      `Primary lesson video gate failed: ${media.lessonVideosReady}/${media.attempted} ready`,
    );
  }

  console.log(JSON.stringify({
    courseId: course.id,
    courseSlug: slug,
    lessons: media.totalLessons,
    primaryLessonVideosReady: media.lessonVideosReady,
    lessonVideosQueued: media.queued,
    microclipsQueued: media.microclipsQueued,
    warnings: media.failed,
    publicationStatus: course.status,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
