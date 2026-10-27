#!/usr/bin/env npx tsx
import { randomUUID } from 'node:crypto';

import { getInstructorById, getInstructorForCourse } from '../../lib/ai-instructors';
import { requireAdminClient } from '../../lib/supabase/admin';
import { enforceInstructionalQuality } from '../../lib/video/instructional-quality-gate';
import { markComplete, type VideoJob } from '../../lib/video/job-queue';
import { enforceMediaQuality } from '../../lib/video/media-quality-gate';
import type { MediaStoryboard } from '../../lib/video/media-director';

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

function isEmptyEvidence(value: unknown): boolean {
  return !value || (typeof value === 'object' && Object.keys(value).length === 0);
}

async function main() {
  const courseId = requiredUuid('--course-id');
  const jobId = requiredUuid('--job-id');
  const db = await requireAdminClient();
  const [{ data: course, error: courseError }, { data: rawJob, error: jobError }] =
    await Promise.all([
      db.from('courses').select('id,title').eq('id', courseId).maybeSingle(),
      db.from('video_jobs').select('*').eq('id', jobId).eq('course_id', courseId).maybeSingle(),
    ]);
  if (courseError) throw new Error(courseError.message);
  if (jobError) throw new Error(jobError.message);
  if (!course) throw new Error(`Course ${courseId} was not found`);
  if (!rawJob) throw new Error(`Video job ${jobId} was not found in course ${courseId}`);

  const job = rawJob as VideoJob;
  if (
    job.asset_kind !== 'lesson' ||
    job.status !== 'complete' ||
    job.review_status !== 'pending_review' ||
    !job.video_url ||
    !isEmptyEvidence(job.quality_evidence)
  ) {
    throw new Error('Candidate is not an unverified completed lesson render');
  }
  const storyboard = job.scene_data as MediaStoryboard | null;
  if (!storyboard || !Array.isArray(storyboard.scenes) || storyboard.scenes.length === 0) {
    throw new Error('Candidate has no persisted storyboard');
  }

  const { data: lesson, error: lessonError } = await db
    .from('course_lessons')
    .select('lesson_type,evidence_type,video_config,script,script_text,learning_objectives')
    .eq('id', job.lesson_id)
    .maybeSingle();
  if (lessonError) throw new Error(lessonError.message);
  if (!lesson) throw new Error(`Lesson ${job.lesson_id} was not found`);
  const videoConfig =
    lesson.video_config && typeof lesson.video_config === 'object'
      ? (lesson.video_config as Record<string, unknown>)
      : {};
  const script =
    [job.script, lesson.script_text, lesson.script]
      .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
      ?.trim() ?? '';
  if (!script) throw new Error('Candidate has no canonical narration script');
  const configuredInstructorId = [videoConfig.instructorId, videoConfig.instructor_id]
    .find((value): value is string => typeof value === 'string' && value.trim().length > 0)
    ?.trim();
  const instructor = configuredInstructorId
    ? getInstructorById(configuredInstructorId)
    : getInstructorForCourse(course.title);
  if (!instructor) throw new Error('Candidate instructor could not be resolved');

  const instructionalQuality = enforceInstructionalQuality({
    courseTitle: course.title,
    lessonTitle: job.lesson_title,
    lessonType: lesson.lesson_type,
    evidenceType: lesson.evidence_type,
    script,
    learningObjectives: Array.isArray(lesson.learning_objectives)
      ? lesson.learning_objectives.filter(
          (value): value is string => typeof value === 'string' && value.trim().length > 0,
        )
      : job.bullet_points,
    instructor,
    storyboard,
  });
  const qualityEvidence = await enforceMediaQuality({
    videoUrl: job.video_url,
    expectedDurationSeconds: job.duration_seconds ?? 0,
    expectedSceneCount: job.scene_count ?? storyboard.scenes.length,
    sceneData: storyboard,
    provider: job.last_provider ?? 'remotion',
    providerModel: job.last_provider_model ?? 'SlideLesson',
    expectedScript: storyboard.scenes
      .map((scene) => scene.dialogue?.trim() || scene.action.trim())
      .filter(Boolean)
      .join(' '),
    instructionalQuality,
  });

  const sourceContract =
    storyboard.source_contract && typeof storyboard.source_contract === 'object'
      ? (storyboard.source_contract as Record<string, unknown>)
      : {};
  const expectedFingerprint =
    typeof sourceContract.fingerprint === 'string' ? sourceContract.fingerprint : '';
  if (
    !expectedFingerprint ||
    videoConfig.source_fingerprint !== expectedFingerprint ||
    videoConfig.narration_locked !== true
  ) {
    throw new Error('MEDIA_SOURCE_VERSION_MISMATCH');
  }

  // Acquire a short, guarded completion lease only after every quality check
  // passes. A failed quality check leaves the durable candidate untouched.
  const leaseToken = randomUUID();
  const now = new Date();
  const { data: leased, error: leaseError } = await db
    .from('video_jobs')
    .update({
      status: 'rendering',
      review_status: 'not_ready',
      lease_token: leaseToken,
      lease_expires_at: new Date(now.getTime() + 15 * 60_000).toISOString(),
      heartbeat_at: now.toISOString(),
      completed_at: null,
      updated_at: now.toISOString(),
    })
    .eq('id', job.id)
    .eq('status', 'complete')
    .eq('review_status', 'pending_review')
    .eq('video_url', job.video_url)
    .select('id')
    .maybeSingle();
  if (leaseError) throw new Error(leaseError.message);
  if (!leased) throw new Error('Candidate changed while audiovisual QA was running');

  await markComplete(
    job.id,
    {
      video_url: job.video_url,
      ...(job.audio_url ? { audio_url: job.audio_url } : {}),
      duration_seconds: job.duration_seconds ?? qualityEvidence.actualDurationSeconds,
      scene_count: job.scene_count ?? storyboard.scenes.length,
      scene_data: storyboard,
      provider: job.last_provider ?? 'remotion',
      provider_model: job.last_provider_model ?? 'SlideLesson',
      quality_evidence: qualityEvidence,
    },
    leaseToken,
  );

  console.info(
    JSON.stringify({
      ok: true,
      courseId,
      jobId,
      lessonId: job.lesson_id,
      videoUrl: job.video_url,
      quality: qualityEvidence,
    }),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? (error.stack ?? error.message) : error);
  process.exit(1);
});
