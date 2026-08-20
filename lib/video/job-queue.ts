/**
 * Canonical video job state manager for full lesson videos and lesson microclips.
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

export async function createJob(input: CreateJobInput): Promise<VideoJob> {
  const supabase = db();
  const assetKind = input.asset_kind ?? 'lesson';

  const { data, error } = await supabase
    .from('video_jobs')
    .insert({
      lesson_id: input.lesson_id,
      course_id: input.course_id,
      lesson_title: input.lesson_title,
      script: input.script ?? null,
      bullet_points: input.bullet_points ?? [],
      scene_data: input.scene_data ?? null,
      asset_kind: assetKind,
      asset_key: input.asset_key ?? null,
      status: 'queued',
      queued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    logger.error('[VideoJob] Failed to create job: ' + (error?.message ?? 'unknown'));
    throw new Error('Failed to create video job');
  }

  // Only the full lesson video owns course_lessons.video_status/video_url.
  if (assetKind === 'lesson') {
    await supabase
      .from('course_lessons')
      .update({ video_status: 'queued', video_job_id: data.id, video_error: null })
      .eq('id', input.lesson_id);
  }

  logger.info(`[VideoJob] Created ${assetKind} job ${data.id} for lesson ${input.lesson_id}`);
  return data as VideoJob;
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
    .order('created_at', { ascending: false })
    .limit(1)
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
    .update({ status: 'rendering', started_at: now })
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
  },
): Promise<void> {
  const supabase = db();
  const now = new Date().toISOString();
  const { data: job } = await supabase
    .from('video_jobs')
    .update({
      status: 'complete',
      completed_at: now,
      video_url: result.video_url,
      audio_url: result.audio_url ?? null,
      duration_seconds: result.duration_seconds ?? null,
      scene_count: result.scene_count ?? null,
      scene_data: result.scene_data ?? null,
      error_message: null,
    })
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
        scene_data: result.scene_data ?? null,
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

export async function markFailed(jobId: string, errorMessage: string): Promise<void> {
  const supabase = db();
  const { data: job } = await supabase
    .from('video_jobs')
    .update({ status: 'failed', error_message: errorMessage, completed_at: new Date().toISOString() })
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

export async function resetJob(lessonId: string, courseId: string): Promise<VideoJob> {
  const supabase = db();
  const { data: lesson } = await supabase
    .from('course_lessons')
    .select('title, script, bullet_points, scene_data')
    .eq('id', lessonId)
    .maybeSingle();

  return createJob({
    lesson_id: lessonId,
    course_id: courseId,
    lesson_title: lesson?.title ?? 'Untitled',
    script: lesson?.script ?? undefined,
    bullet_points: Array.isArray(lesson?.bullet_points) ? lesson.bullet_points : [],
    scene_data: lesson?.scene_data ?? null,
    asset_kind: 'lesson',
  });
}
