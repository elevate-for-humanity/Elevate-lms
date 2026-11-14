#!/usr/bin/env npx tsx
import { resetCanonicalMediaJob } from '../../lib/course-factory/media-manager';
import { requireAdminClient } from '../../lib/supabase/admin';
import type { VideoJob } from '../../lib/video/job-queue';

const args = process.argv.slice(2);

function valueAfter(flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function requestedLimit(): number | null {
  const raw = valueAfter('--limit');
  if (raw === undefined) return null;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1 || value > 500) {
    throw new Error('--limit must be an integer between 1 and 500');
  }
  return value;
}

const RECOVERABLE_ERRORS = new Set([
  'Paid media authorization blocked: provider_unavailable',
  'Paid media authorization blocked: retry_exhausted',
]);

async function main() {
  const courseSlug = valueAfter('--course')?.trim();
  const limit = requestedLimit();
  if (!courseSlug) throw new Error('--course <slug> is required');

  const db = await requireAdminClient();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,slug,status,is_active')
    .eq('slug', courseSlug)
    .maybeSingle();
  if (courseError || !course) throw new Error(courseError?.message ?? 'Course not found');
  if (course.status === 'published' || course.is_active) {
    throw new Error('Refusing paid narration recovery for a published or active course');
  }

  const { data, error } = await db
    .from('video_jobs')
    .select('*')
    .eq('course_id', course.id)
    .eq('status', 'failed')
    .is('video_url', null)
    .order('queued_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw new Error(error.message);

  const matched = ((data ?? []) as VideoJob[]).filter((job) =>
    RECOVERABLE_ERRORS.has(job.error_message?.trim() ?? ''),
  );
  const selected = limit === null ? matched : matched.slice(0, limit);
  const recoveredJobIds: string[] = [];
  const blocked: Array<{ jobId: string; reason: string }> = [];

  for (const job of selected) {
    try {
      const reset = await resetCanonicalMediaJob(
        {
          courseId: job.course_id,
          lessonId: job.lesson_id,
          assetKind: job.asset_kind,
          assetKey: job.asset_key,
        },
        {
          force: true,
          sourceRepaired: true,
          reason: 'Paid narration queue source repaired by migration 20260922021235',
        },
      );
      recoveredJobIds.push(reset.id);
    } catch (cause) {
      blocked.push({
        jobId: job.id,
        reason: cause instanceof Error ? cause.message : String(cause),
      });
    }
  }

  console.info(
    JSON.stringify({
      ok: blocked.length === 0,
      courseId: course.id,
      courseSlug: course.slug,
      matched: matched.length,
      selected: selected.length,
      recovered: recoveredJobIds.length,
      recoveredJobIds,
      blocked,
      completedMediaTouched: 0,
    }),
  );

  if (blocked.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
