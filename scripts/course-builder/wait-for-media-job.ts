#!/usr/bin/env npx tsx
import { hasCanonicalMediaQualityEvidence } from '../../lib/course-factory/media-manager';
import { requireAdminClient } from '../../lib/supabase/admin';
import type { VideoJob } from '../../lib/video/job-queue';
import type { MediaQualityEvidence } from '../../lib/video/media-quality-gate';

const args = process.argv.slice(2);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function valueAfter(flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function requiredUuid(flag: string): string {
  const value = valueAfter(flag)?.trim();
  if (!value || !UUID_PATTERN.test(value)) throw new Error(`${flag} requires a valid UUID`);
  return value;
}

function timeoutMinutes(): number {
  const raw = valueAfter('--timeout-minutes');
  if (raw === undefined) return 45;
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value < 1 || value > 180) {
    throw new Error('--timeout-minutes must be an integer between 1 and 180');
  }
  return value;
}

async function requirePlayable(url: string): Promise<void> {
  const response = await fetch(url, {
    headers: { Range: 'bytes=0-1' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error(`Rendered video is not playable (HTTP ${response.status})`);
  await response.body?.cancel();
}

async function main() {
  const jobId = requiredUuid('--job-id');
  const courseId = requiredUuid('--course-id');
  const deadline = Date.now() + timeoutMinutes() * 60_000;
  const db = await requireAdminClient();

  while (Date.now() < deadline) {
    const { data, error } = await db
      .from('video_jobs')
      .select('*')
      .eq('id', jobId)
      .eq('course_id', courseId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) throw new Error(`Media job ${jobId} was not found in course ${courseId}`);

    const job = data as VideoJob;
    if (job.status === 'failed') {
      throw new Error(`Media job ${jobId} failed: ${job.error_message ?? 'unknown failure'}`);
    }
    if (job.status === 'complete') {
      if (!job.video_url) throw new Error(`Media job ${jobId} completed without a video URL`);
      if (!hasCanonicalMediaQualityEvidence(job.quality_evidence)) {
        throw new Error(`Media job ${jobId} completed without passing canonical audiovisual QA`);
      }
      await requirePlayable(job.video_url);
      const evidence = job.quality_evidence as MediaQualityEvidence;
      console.info(
        JSON.stringify({
          ok: true,
          jobId: job.id,
          courseId: job.course_id,
          lessonId: job.lesson_id,
          videoUrl: job.video_url,
          quality: {
            gateVersion: evidence.gateVersion,
            durationSeconds: evidence.actualDurationSeconds,
            narrationCoverage: evidence.narrationCoverage,
            captionUrl: evidence.captionUrl,
            transcriptUrl: evidence.transcriptUrl,
            visualEvidenceCoverage: evidence.visualEvidenceCoverage,
            sourceEvidenceCoverage: evidence.sourceEvidenceCoverage,
            exactVisualSourceCoverage: evidence.exactVisualSourceCoverage,
            sceneChanges: evidence.sceneChanges,
            longestFreezeSeconds: evidence.longestFreezeSeconds,
            longestBlackSeconds: evidence.longestBlackSeconds,
          },
        }),
      );
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 15_000));
  }

  throw new Error(`Timed out waiting for media job ${jobId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
