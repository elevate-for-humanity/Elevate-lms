/**
 * Canonical video job state manager for full lesson videos and lesson microclips.
 *
 * This module owns low-level state transitions only. Retry/recovery policy lives
 * in lib/course-factory/media-manager.ts.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export type VideoJobStatus = 'draft' | 'queued' | 'rendering' | 'complete' | 'failed';
export type VideoAssetKind = 'lesson' | 'microclip';

export interface VideoJob {
  id: string;
  lesson_id: string;
  course_id: string;
  status: VideoJobStatus;
  asset_kind: VideoAssetKind;
  asset_key: string | null;
  video_url: string | null;
  audio_url: string | null;
  error_message: string | null;
  retry_count: number;
  last_provider: string | null;
  last_provider_model: string | null;
  last_failure_at: string | null;
  scene_count: number | null;
  duration_seconds: number | null;
  lesson_title: string;
  script: string | null;
  bullet_points: string[];
  scene_data: unknown | null;
  queued_at: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJobInput {
  lesson_id: string;
  course_id: string;
  lesson_title: string;
  script?: string;
  bullet_points?: string[];
  scene_data?: unknown;
  asset_kind?: VideoAssetKind;
  asset_key?: string;
}

function db() {
  return createAdminClient();
}

async function findCanonicalJob(
  supabase: ReturnType<typeof db>,
  input: Pick<CreateJobInput, 'course_id' | 'lesson_id' | 'asset_kind' | 'asset_key'>,
): Promise<VideoJob | null> {
  const assetKind = input.asset_kind ?? 'lesson';
  let query = supabase
    .from('video_jobs')
    .select('*')
    .eq('course_id', input.course_id)
    .eq('lesson_id', input.lesson_id)
    .eq('asset_kind', assetKind);
  query = input.asset_key ? query.eq('asset_key', input.asset_key) : query.is('asset_key', null);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data as VideoJob | null;
}

async function syncLessonJobLink(
  supabase: ReturnType<typeof db>,
  job: VideoJob,
): Promise<void> {
  if (job.asset_kind !== 'lesson') return;
  await supabase
    .from('course_lessons')
    .update({
      video_job_id: job.id,
      video_status: job.status,
      video_error: job.status === 'failed' ? job.error_message : null,
      ...(job.status === 'complete' && job.video_url ? { video_url: job.video_url } : {}),
    })
    .eq('id', job.lesson_id);
}

/**
 * Create-or-return the single canonical job for an asset.
 *
 * Database uniqueness is the final concurrency authority. A pre-read avoids
 * unnecessary insert errors; a 23505 race is resolved by reading the winner.
 * Failed jobs are returned unchanged and must be retried by Course Factory
 * policy rather than silently replaced with a new identity.
 */
export async function createJob(input: CreateJobInput): Promise<VideoJob> {
  const supabase = db();
  const assetKind = input.asset_kind ?? 'lesson';
  const existing = await findCanonicalJob(supabase, input);
  if (existing) {
    await syncLessonJobLink(supabase, existing);
    return existing;
  }

  const now = new Date().toISOString();
  const payload = {
    lesson_id: input.lesson_id,
    course_id: input.course_id,
    lesson_title: input.lesson_title,
    script: input.script ?? null,
    bullet_points: input.bullet_points ?? [],
    scene_data: input.scene_data ?? null,
    asset_kind: assetKind,
    asset_key: input.asset_key ?? null,
    status: 'queued' as const,
    queued_at: now,
    retry_count: 0,
  };

  const { data, error } = await supabase.from('video_jobs').insert(payload).select().single();
  if (error || !data) {
    if (error?.code === '23505') {
      const winner = await findCanonicalJob(supabase, input);
      if (winner) {
        await syncLessonJobLink(supabase, winner);
        return winner;
      }
    }
    logger.error('[VideoJob] Failed to create canonical job: ' + (error?.message ?? 'unknown'));
    throw new Error('Failed to create canonical video job');
  }

  const job = data as VideoJob;
  await syncLessonJobLink(supabase, job);
  logger.info(`[VideoJob] Created ${assetKind} job ${job.id} for lesson ${input.lesson_id}`);
  return job;
}

export async function getJob(jobId: string): Promise<VideoJob | null> {
  const { data, error } = await db().from('video_jobs').select('*').eq('id', jobId).maybeSingle();
  if (error) {
    logger.error('[VideoJob] getJob error: ' + error.message);
    return null;
  }
  return data as VideoJob | null;
}

export async function getJobByLesson(lessonId: string): Promise<VideoJob | null> {
  const { data } = await db()
    .from('video_jobs')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('asset_kind', 'lesson')
    .is('asset_key', null)
    .maybeSingle();
  return data as VideoJob | null;
}

async function updateMicroclipExperience(
  lessonId: string,
  assetKey: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const supabase = db();
  const { data: lesson, error } = await supabase
    .from('course_lessons')
    .select('content_json, content')
    .eq('id', lessonId)
    .maybeSingle();
  if (error || !lesson) throw new Error(error?.message ?? 'Lesson not found for microclip update');

  const source =
    lesson.content_json && typeof lesson.content_json === 'object'
      ? (lesson.content_json as Record<string, any>)
      : lesson.content && typeof lesson.content === 'object'
        ? (lesson.content as Record<string, any>)
        : {};
  const contentJson = structuredClone(source);
  const experience = contentJson.experience && typeof contentJson.experience === 'object'
    ? contentJson.experience as Record<string, any>
    : {};
  const clips = Array.isArray(experience.quickClips) ? experience.quickClips : [];
  experience.quickClips = clips.map((clip: Record<string, any>) =>
    String(clip.id) === assetKey ? { ...clip, ...patch } : clip,
  );
  contentJson.experience = experience;

  const { error: updateError } = await supabase
    .from('course_lessons')
    .update({ content_json: contentJson })
    .eq('id', lessonId);
  if (updateError) throw updateError;
}

export async function markRendering(jobId: string): Promise<void> {
  const supabase = db();
  const now = new Date().toISOString();
  const { data: job } = await supabase
    .from('video_jobs')
    .update({ status: 'rendering', started_at: now, completed_at: null, updated_at: now })
    .eq('id', jobId)
    .select('lesson_id, asset_kind, asset_key')
    .single();

  if (job?.lesson_id && job.asset_kind === 'lesson') {
    await supabase.from('course_lessons').update({ video_status: 'rendering' }).eq('id', job.lesson_id);
  } else if (job?.lesson_id && job.asset_kind === 'microclip' && job.asset_key) {
    await updateMicroclipExperience(job.lesson_id, job.asset_key, { status: 'rendering', error: null });
  }
}

export async function markComplete(
  jobId: string,
  result: {
    video_url: string;
    audio_url?: string;
    duration_seconds?: number;
    scene_count?: number;
    scene_data?: unknown;
    provider?: string;
    provider_model?: string;
  },
): Promise<void> {
  const supabase = db();
  const now = new Date().toISOString();
  const completionPatch: Record<string, unknown> = {
    status: 'complete',
    completed_at: now,
    updated_at: now,
    video_url: result.video_url,
    audio_url: result.audio_url ?? null,
    duration_seconds: result.duration_seconds ?? null,
    scene_count: result.scene_count ?? null,
    error_message: null,
    last_provider: result.provider ?? null,
    last_provider_model: result.provider_model ?? null,
    provider: result.provider ?? null,
  };
  // A renderer that returns no replacement storyboard must not erase the
  // canonical plan that was attached when the job was queued.
  if (result.scene_data != null) completionPatch.scene_data = result.scene_data;
  const { data: job } = await supabase
    .from('video_jobs')
    .update(completionPatch)
    .eq('id', jobId)
    .select('lesson_id, asset_kind, asset_key')
    .single();

  if (job?.lesson_id && job.asset_kind === 'lesson') {
    await supabase
      .from('course_lessons')
      .update({
        video_status: 'complete',
        video_url: result.video_url,
        video_error: null,
        video_generated_at: now,
        duration_seconds: result.duration_seconds ?? null,
        ...(result.scene_data != null ? { scene_data: result.scene_data } : {}),
      })
      .eq('id', job.lesson_id);
  } else if (job?.lesson_id && job.asset_kind === 'microclip' && job.asset_key) {
    await updateMicroclipExperience(job.lesson_id, job.asset_key, {
      status: 'complete',
      videoUrl: result.video_url,
      audioUrl: result.audio_url ?? null,
      renderedDurationSeconds: result.duration_seconds ?? null,
      generatedAt: now,
      error: null,
    });
  }

  logger.info(`[VideoJob] Complete: ${jobId} → ${result.video_url}`);
}

export async function markFailed(
  jobId: string,
  errorMessage: string,
  evidence: { provider?: string; provider_model?: string } = {},
): Promise<void> {
  const supabase = db();
  const now = new Date().toISOString();
  const { data: job } = await supabase
    .from('video_jobs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: now,
      updated_at: now,
      last_failure_at: now,
      last_provider: evidence.provider ?? null,
      last_provider_model: evidence.provider_model ?? null,
    })
    .eq('id', jobId)
    .select('lesson_id, asset_kind, asset_key')
    .single();

  if (job?.lesson_id && job.asset_kind === 'lesson') {
    await supabase
      .from('course_lessons')
      .update({ video_status: 'failed', video_error: errorMessage })
      .eq('id', job.lesson_id);
  } else if (job?.lesson_id && job.asset_kind === 'microclip' && job.asset_key) {
    await updateMicroclipExperience(job.lesson_id, job.asset_key, { status: 'failed', error: errorMessage });
  }

  logger.error('[VideoJob] Failed: ' + jobId + ' — ' + errorMessage);
}
