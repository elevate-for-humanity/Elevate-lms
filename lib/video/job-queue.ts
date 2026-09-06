/**
 * Canonical video job state manager for full lesson videos and lesson microclips.
 *
 * This module owns low-level state transitions only. Retry/recovery policy lives
 * in lib/course-factory/media-manager.ts.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { MediaQualityEvidence } from './media-quality-gate';

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
  lease_token: string | null;
  lease_expires_at: string | null;
  heartbeat_at: string | null;
  failure_class: VideoFailureClass | null;
  next_retry_at: string | null;
  dead_lettered_at: string | null;
  review_status: 'not_ready' | 'pending_review' | 'approved' | 'rejected';
  previous_video_url: string | null;
  quality_evidence: MediaQualityEvidence | null;
  procedure_schema: unknown | null;
}

export type VideoFailureClass =
  | 'transient'
  | 'configuration'
  | 'authorization'
  | 'storage'
  | 'renderer'
  | 'quality'
  | 'content'
  | 'not_found'
  | 'unknown';

export function classifyVideoFailure(message: string): VideoFailureClass {
  const text = message.toLowerCase();
  if (/413|request entity too large|upload|storage|bucket|tus/.test(text)) return 'storage';
  if (/unauthorized|forbidden|invalid api key|401|403/.test(text)) return 'authorization';
  if (/not configured|missing .*key|missing .*url|configuration/.test(text)) return 'configuration';
  if (/lesson not found|course not found|not found/.test(text)) return 'not_found';
  if (/quality|frozen|black frame|visual change|narration coverage|caption/.test(text)) return 'quality';
  if (/storyboard|script|scene|content/.test(text)) return 'content';
  if (/render|ffmpeg|remotion|chromium|gpu|cuda|codec/.test(text)) return 'renderer';
  if (/timeout|timed out|rate limit|429|502|503|504|network|connection|econn/.test(text)) return 'transient';
  return 'unknown';
}

export async function heartbeatJob(job: Pick<VideoJob, 'id' | 'lease_token'>): Promise<boolean> {
  if (!job.lease_token) return false;
  const { data, error } = await db().rpc('heartbeat_video_job', {
    p_job_id: job.id,
    p_lease_token: job.lease_token,
    p_lease_seconds: 900,
  });
  if (error) throw error;
  return data === true;
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
    // A curriculum refresh may replace narration and scene direction while
    // retaining the canonical asset identity. Never render a stale queued job.
    if (existing.status !== 'rendering') {
      const { data: refreshed, error: refreshError } = await supabase
        .from('video_jobs')
        .update({
          lesson_title: input.lesson_title,
          script: input.script ?? null,
          bullet_points: input.bullet_points ?? [],
          scene_data: input.scene_data ?? null,
          // Draft is an authoring state. Once Course Builder supplies the
          // canonical lesson payload, the same durable job must become
          // claimable by the renderer instead of remaining stranded.
          ...(existing.status === 'draft'
            ? {
                status: 'queued' as const,
                queued_at: new Date().toISOString(),
                error_message: null,
                review_status: 'not_ready' as const,
              }
            : {}),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('*')
        .single();
      if (refreshError || !refreshed) {
        throw refreshError ?? new Error('Unable to refresh video job source');
      }
      await syncLessonJobLink(supabase, refreshed as VideoJob);
      return refreshed as VideoJob;
    }
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
    .update({ status: 'rendering', started_at: now, completed_at: null, error_message: null, updated_at: now })
    .eq('id', jobId)
    .select('lesson_id, asset_kind, asset_key')
    .single();

  if (job?.lesson_id && job.asset_kind === 'microclip' && job.asset_key) {
    await updateMicroclipExperience(job.lesson_id, job.asset_key, { status: 'rendering', error: null });
  }
}


export async function markCandidate(
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
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = {
    // A candidate is durable evidence, but it remains non-promoted until
    // markComplete records successful quality evidence.
    video_url: result.video_url,
    audio_url: result.audio_url ?? null,
    duration_seconds: result.duration_seconds ?? null,
    scene_count: result.scene_count ?? null,
    last_provider: result.provider ?? null,
    last_provider_model: result.provider_model ?? null,
    provider: result.provider ?? null,
    review_status: 'not_ready',
    quality_evidence: {},
    updated_at: now,
  };
  if (result.scene_data != null) {
    patch.scene_data = result.scene_data;
    patch.procedure_schema = result.scene_data;
  }
  const { error } = await db().from('video_jobs').update(patch).eq('id', jobId);
  if (error) throw error;
  logger.info(`[VideoJob] Candidate persisted before quality review: ${jobId}`);
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
    quality_evidence?: MediaQualityEvidence;
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
    // process-video-job calls markComplete only after the canonical rendered-
    // media gate succeeds. That gate is the automated approval authority.
    review_status: 'approved',
    reviewed_by: null,
    reviewed_at: null,
    review_notes: null,
    quality_evidence: result.quality_evidence ?? null,
    procedure_schema: result.scene_data ?? null,
    lease_token: null,
    lease_expires_at: null,
    heartbeat_at: now,
    failure_class: null,
    next_retry_at: null,
    dead_lettered_at: null,
  };
  // A renderer that returns no replacement storyboard must not erase the
  // canonical plan that was attached when the job was queued.
  if (result.scene_data != null) completionPatch.scene_data = result.scene_data;
  const { data: job } = await supabase
    .from('video_jobs')
    .update(completionPatch)
    .eq('id', jobId)
    .select('course_id, lesson_id, asset_kind, asset_key, script')
    .single();

  if (job?.lesson_id && job.asset_kind === 'lesson') {
    const { data: lesson } = await supabase.from('course_lessons').select('video_url').eq('id', job.lesson_id).maybeSingle();
    await supabase.from('video_jobs').update({ previous_video_url: lesson?.video_url ?? null }).eq('id', jobId);
    const candidateVersion = {
      course_id: job.course_id,
      lesson_id: job.lesson_id,
      video_job_id: jobId,
      video_url: result.video_url,
      duration_seconds: result.duration_seconds ?? null,
      scene_count: result.scene_count ?? null,
      quality_evidence: result.quality_evidence ?? {},
      procedure_schema: result.scene_data ?? {},
      transcript: job.script ?? null,
      caption_url: result.scene_data && typeof result.scene_data === 'object'
        ? (result.scene_data as Record<string, unknown>).captionUrl ?? null
        : null,
      transcript_url: result.scene_data && typeof result.scene_data === 'object'
        ? (result.scene_data as Record<string, unknown>).transcriptUrl ?? null
        : null,
      // lesson_video_versions uses active as the promoted learner-facing state.
      status: 'active',
      approved_at: now,
    };
    const { data: existingVersion } = await supabase
      .from('lesson_video_versions').select('id').eq('video_job_id', jobId).maybeSingle();
    const versionResult = existingVersion?.id
      ? await supabase.from('lesson_video_versions').update(candidateVersion).eq('id', existingVersion.id)
      : await supabase.from('lesson_video_versions').insert(candidateVersion);
    if (versionResult.error) throw versionResult.error;
    const { error: lessonPromotionError } = await supabase.from('course_lessons').update({
      video_url: result.video_url,
      video_status: 'complete',
      video_error: null,
      video_generated_at: now,
      media_origin: 'generated',
      media_quality_status: 'approved',
      media_quality_evidence: result.quality_evidence ?? {},
      media_verified_at: now,
      // This is the only transition that completes a unified lesson build.
      // The video has already passed narration, visual, caption, and media
      // quality gates and still matches the locked source fingerprint.
      generation_status: 'generated',
      scene_data: result.scene_data ?? null,
      duration_seconds: result.duration_seconds ?? null,
      updated_at: now,
    }).eq('id', job.lesson_id);
    if (lessonPromotionError) throw lessonPromotionError;
  } else if (job?.lesson_id && job.asset_kind === 'microclip' && job.asset_key) {
    await updateMicroclipExperience(job.lesson_id, job.asset_key, {
      status: 'approved',
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
  const failureClass = classifyVideoFailure(errorMessage);
  const { data: current } = await supabase
    .from('video_jobs')
    .select('retry_count')
    .eq('id', jobId)
    .maybeSingle();
  const retryCount = Number(current?.retry_count ?? 0);
  const terminalFailure =
    retryCount >= 3 ||
    ['configuration', 'authorization', 'not_found', 'content'].includes(failureClass);
  const nextRetryAt = terminalFailure
    ? null
    : new Date(Date.now() + Math.min(60_000 * (2 ** retryCount), 15 * 60_000)).toISOString();
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
      lease_token: null,
      lease_expires_at: null,
      heartbeat_at: now,
      failure_class: failureClass,
      next_retry_at: nextRetryAt,
      dead_lettered_at: terminalFailure ? now : null,
    })
    .eq('id', jobId)
    .select('lesson_id, asset_kind, asset_key')
    .single();

  if (job?.lesson_id && job.asset_kind === 'microclip' && job.asset_key) {
    await updateMicroclipExperience(job.lesson_id, job.asset_key, { status: 'failed', error: errorMessage });
  }

  logger.error('[VideoJob] Failed: ' + jobId + ' — ' + errorMessage);
}
