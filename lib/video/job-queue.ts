/**
 * lib/video/job-queue.ts
 *
 * Video job state manager. Wraps Supabase reads/writes for video_jobs
 * and keeps course_lessons.video_status in sync.
 *
 * Used by:
 *   POST /api/videos/generate    — createJob()
 *   GET  /api/videos/status/:id  — getJob()
 *   POST /api/videos/regenerate  — resetJob()
 *   Render worker                — markRendering(), markComplete(), markFailed()
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

// ── Types ─────────────────────────────────────────────────────────────────────

export type VideoJobStatus = 'draft' | 'queued' | 'rendering' | 'complete' | 'failed';

export interface VideoJob {
  id: string;
  lesson_id: string;
  course_id: string;
  status: VideoJobStatus;
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
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function db() {
  return createAdminClient();
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Create a new video job in 'queued' status.
 * Also sets course_lessons.video_status = 'queued'.
 */
export async function createJob(input: CreateJobInput): Promise<VideoJob> {
  const supabase = db();

  const { data, error } = await supabase
    .from('video_jobs')
    .insert({
      lesson_id: input.lesson_id,
      course_id: input.course_id,
      lesson_title: input.lesson_title,
      script: input.script ?? null,
      bullet_points: input.bullet_points ?? [],
      scene_data: input.scene_data ?? null,
      status: 'queued',
      queued_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error || !data) {
    logger.error('[VideoJob] Failed to create job: ' + (error?.message ?? 'unknown'));
    throw new Error('Failed to create video job');
  }

  // Sync lesson status
  await supabase
    .from('course_lessons')
    .update({
      video_status: 'queued',
      video_job_id: data.id,
      video_error: null,
    })
    .eq('id', input.lesson_id);

  logger.info(`[VideoJob] Created job ${data.id} for lesson ${input.lesson_id}`);
  return data as VideoJob;
}

// ── Read ──────────────────────────────────────────────────────────────────────

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
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as VideoJob | null;
}

// ── State transitions ─────────────────────────────────────────────────────────

export async function markRendering(jobId: string): Promise<void> {
  const supabase = db();
  const now = new Date().toISOString();

  const { data: job } = await supabase
    .from('video_jobs')
    .update({ status: 'rendering', started_at: now })
    .eq('id', jobId)
    .select('lesson_id')
    .single();

  if (job?.lesson_id) {
    await supabase
      .from('course_lessons')
      .update({ video_status: 'rendering' })
      .eq('id', job.lesson_id);
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
    .select('lesson_id')
    .single();

  if (job?.lesson_id) {
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
  }

  logger.info(`[VideoJob] Complete: ${jobId} → ${result.video_url}`);
}

export async function markFailed(jobId: string, errorMessage: string): Promise<void> {
  const supabase = db();

  const { data: job } = await supabase
    .from('video_jobs')
    .update({
      status: 'failed',
      error_message: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq('id', jobId)
    .select('lesson_id')
    .single();

  if (job?.lesson_id) {
    await supabase
      .from('course_lessons')
      .update({
        video_status: 'failed',
        video_error: errorMessage,
      })
      .eq('id', job.lesson_id);
  }

  logger.error('[VideoJob] Failed: ' + jobId + ' — ' + errorMessage);
}

/**
 * Reset a failed/complete job back to queued for regeneration.
 * Creates a new job row (preserves history) and returns it.
 */
export async function resetJob(lessonId: string, courseId: string): Promise<VideoJob> {
  const supabase = db();

  // Get current lesson data to carry forward
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
  });
}
