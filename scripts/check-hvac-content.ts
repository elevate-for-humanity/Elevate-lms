import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const COURSE_ID = '0ba9a61c-1f1b-4019-be6f-90e92eba2bc0';
const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const [{ data: lessons, error: lessonError }, { data: jobs, error: jobError }] = await Promise.all([
    db.from('lms_lessons')
      .select('id, lesson_slug, video_url, content, lesson_source, step_type')
      .eq('course_id', COURSE_ID)
      .order('order_index'),
    db.from('video_jobs')
      .select('lesson_id, status, video_url, review_status, error_message')
      .eq('course_id', COURSE_ID)
      .eq('asset_kind', 'lesson'),
  ]);

  if (lessonError || jobError) {
    console.error(lessonError?.message ?? jobError?.message);
    process.exit(1);
  }

  const canonicalJobs = new Map((jobs ?? []).map((job) => [String(job.lesson_id), job]));
  const mediaRequired = (lesson: NonNullable<typeof lessons>[number]) =>
    !['checkpoint', 'quiz', 'exam', 'assessment'].includes(String(lesson.step_type ?? '').toLowerCase());
  const hasContent = (lesson: NonNullable<typeof lessons>[number]) =>
    typeof lesson.content === 'string'
      ? lesson.content.length > 50
      : lesson.content != null && JSON.stringify(lesson.content).length > 50;
  const hasApprovedVideo = (lesson: NonNullable<typeof lessons>[number]) =>
    Boolean(lesson.video_url) || (
      canonicalJobs.get(String(lesson.id))?.status === 'complete' &&
      Boolean(canonicalJobs.get(String(lesson.id))?.video_url) &&
      canonicalJobs.get(String(lesson.id))?.review_status === 'approved'
    );
  const hasActiveVideoJob = (lesson: NonNullable<typeof lessons>[number]) =>
    ['queued', 'rendering'].includes(String(canonicalJobs.get(String(lesson.id))?.status ?? ''));

  const total = lessons?.length ?? 0;
  const contentReady = (lessons ?? []).filter(hasContent).length;
  const required = (lessons ?? []).filter(mediaRequired);
  const approved = required.filter(hasApprovedVideo).length;
  const queued = required.filter((lesson) => !hasApprovedVideo(lesson) && hasActiveVideoJob(lesson)).length;
  const blocked = required.filter((lesson) => !hasApprovedVideo(lesson) && !hasActiveVideoJob(lesson));
  const missingContent = (lessons ?? []).filter((lesson) => !hasContent(lesson));

  console.log(`Total lessons:       ${total}`);
  console.log(`Content ready:       ${contentReady} / ${total}`);
  console.log(`Media-required:      ${required.length}`);
  console.log(`Approved videos:     ${approved} / ${required.length}`);
  console.log(`Active video jobs:   ${queued}`);
  console.log(`Blocked media:       ${blocked.length}`);

  if (missingContent.length || blocked.length) {
    if (missingContent.length) {
      console.log(`\nMissing content (${missingContent.length}):`);
      missingContent.forEach((lesson) => console.log(`  ${lesson.lesson_slug ?? lesson.id}`));
    }
    if (blocked.length) {
      console.log(`\nNo approved video or active canonical job (${blocked.length}):`);
      blocked.forEach((lesson) => {
        const job = canonicalJobs.get(String(lesson.id));
        console.log(`  ${lesson.lesson_slug ?? lesson.id} status=${job?.status ?? 'missing'} error=${job?.error_message ?? 'none'}`);
      });
    }
    process.exit(1);
  }

  console.log('\n✅ All lesson content is present and every media-required lesson has either an approved video or an active canonical render job.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
