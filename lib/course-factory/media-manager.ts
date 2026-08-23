import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import type { VideoAssetKind, VideoJob } from '@/lib/video/job-queue';

export const COURSE_MEDIA_MAX_RETRIES = 3;
export const COURSE_MEDIA_STALE_RENDER_MS = 45 * 60 * 1000;

export interface CourseMediaIdentity {
  courseId: string;
  lessonId: string;
  assetKind: VideoAssetKind;
  assetKey?: string | null;
}

export interface CourseMediaState {
  courseId: string;
  requiredLessonVideos: number;
  requiredMicroclips: number;
  expectedTotal: number;
  jobsTotal: number;
  queued: number;
  rendering: number;
  failed: number;
  complete: number;
  duplicateIdentities: number;
  playable: number;
  unreachable: Array<{ jobId: string; url: string; reason: string }>;
  staleRendering: number;
  completePackage: boolean;
}

function identityKey(job: Pick<VideoJob, 'course_id' | 'lesson_id' | 'asset_kind' | 'asset_key'>) {
  return `${job.course_id}:${job.lesson_id}:${job.asset_kind ?? 'lesson'}:${job.asset_key ?? ''}`;
}

function retryableFailure(message: string | null): boolean {
  const text = (message ?? '').toLowerCase();
  if (!text) return true;
  if (text.includes('unauthorized') || text.includes('forbidden') || text.includes('invalid api key')) return false;
  if (text.includes('missing course') || text.includes('lesson not found')) return false;
  return true;
}

export async function resetCanonicalMediaJob(
  identity: CourseMediaIdentity,
  options: { force?: boolean; reason?: string } = {},
): Promise<VideoJob> {
  const db = await requireAdminClient();
  let query = db
    .from('video_jobs')
    .select('*')
    .eq('course_id', identity.courseId)
    .eq('lesson_id', identity.lessonId)
    .eq('asset_kind', identity.assetKind);
  query = identity.assetKey
    ? query.eq('asset_key', identity.assetKey)
    : query.is('asset_key', null);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  if (!data) throw new Error('Canonical media job not found');

  const job = data as VideoJob;
  if (job.status === 'complete' && !options.force) return job;
  if ((job.retry_count ?? 0) >= COURSE_MEDIA_MAX_RETRIES && !options.force) {
    throw new Error(`Retry limit reached for media job ${job.id}`);
  }
  if (job.status === 'failed' && !retryableFailure(job.error_message) && !options.force) {
    throw new Error(`Media job ${job.id} requires operator repair before retry`);
  }

  const now = new Date().toISOString();
  const nextRetry = (job.retry_count ?? 0) + 1;
  const { data: reset, error: resetError } = await db
    .from('video_jobs')
    .update({
      status: 'queued',
      retry_count: nextRetry,
      queued_at: now,
      started_at: null,
      completed_at: null,
      video_url: options.force ? null : job.video_url,
      audio_url: options.force ? null : job.audio_url,
      error_message: options.reason ?? job.error_message,
      updated_at: now,
    })
    .eq('id', job.id)
    .select('*')
    .single();
  if (resetError || !reset) throw resetError ?? new Error('Unable to reset canonical media job');

  if (identity.assetKind === 'lesson') {
    await db.from('course_lessons').update({ video_status: 'queued', video_error: null }).eq('id', identity.lessonId);
  }
  return reset as VideoJob;
}

export async function recoverCourseMediaJobs(input: { courseId?: string | null; force?: boolean } = {}) {
  const db = await requireAdminClient();
  let query = db
    .from('video_jobs')
    .select('*')
    .in('status', ['failed', 'rendering']);
  if (input.courseId) query = query.eq('course_id', input.courseId);
  const { data, error } = await query;
  if (error) throw error;

  const staleBefore = Date.now() - COURSE_MEDIA_STALE_RENDER_MS;
  const recovered: string[] = [];
  const blocked: Array<{ jobId: string; reason: string }> = [];

  for (const row of (data ?? []) as VideoJob[]) {
    const stale = row.status === 'rendering' && row.started_at && new Date(row.started_at).getTime() < staleBefore;
    const eligibleFailed = row.status === 'failed' && retryableFailure(row.error_message);
    if (!stale && !eligibleFailed) continue;
    try {
      await resetCanonicalMediaJob(
        {
          courseId: row.course_id,
          lessonId: row.lesson_id,
          assetKind: row.asset_kind ?? 'lesson',
          assetKey: row.asset_key,
        },
        {
          force: input.force,
          reason: stale ? 'Recovered stale rendering job through Course Factory policy' : row.error_message ?? 'Retrying failed media job',
        },
      );
      recovered.push(row.id);
    } catch (resetError) {
      blocked.push({ jobId: row.id, reason: resetError instanceof Error ? resetError.message : String(resetError) });
    }
  }
  return { recovered, blocked };
}

async function checkPlayable(url: string): Promise<{ ok: boolean; reason?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(url, {
      headers: { Range: 'bytes=0-1023' },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!(response.ok || response.status === 206)) return { ok: false, reason: `HTTP ${response.status}` };
    const type = response.headers.get('content-type') ?? '';
    if (type && !type.includes('video') && !type.includes('octet-stream')) {
      return { ok: false, reason: `unexpected content-type ${type}` };
    }
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) };
  }
}

export async function getCourseMediaState(courseId: string, options: { verifyUrls?: boolean } = {}): Promise<CourseMediaState> {
  const db = await requireAdminClient();
  const [{ data: lessons, error: lessonError }, { data: jobs, error: jobError }] = await Promise.all([
    db.from('course_lessons').select('id,content_json,video_status,video_url').eq('course_id', courseId),
    db.from('video_jobs').select('*').eq('course_id', courseId),
  ]);
  if (lessonError) throw lessonError;
  if (jobError) throw jobError;

  let requiredMicroclips = 0;
  for (const lesson of lessons ?? []) {
    const content = lesson.content_json && typeof lesson.content_json === 'object'
      ? lesson.content_json as Record<string, any>
      : {};
    const experience = content.experience && typeof content.experience === 'object'
      ? content.experience as Record<string, any>
      : {};
    requiredMicroclips += Array.isArray(experience.quickClips) ? Math.min(2, experience.quickClips.length) : 0;
  }

  const rows = (jobs ?? []) as VideoJob[];
  const identities = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    const key = identityKey(row);
    if (identities.has(key)) duplicates += 1;
    identities.add(key);
  }

  const requiredLessonVideos = lessons?.length ?? 0;
  const expectedTotal = requiredLessonVideos + requiredMicroclips;
  const now = Date.now();
  const staleRendering = rows.filter(
    (row) => row.status === 'rendering' && row.started_at && now - new Date(row.started_at).getTime() > COURSE_MEDIA_STALE_RENDER_MS,
  ).length;
  const completeRows = rows.filter((row) => row.status === 'complete' && Boolean(row.video_url));
  const unreachable: Array<{ jobId: string; url: string; reason: string }> = [];
  let playable = options.verifyUrls ? 0 : completeRows.length;

  if (options.verifyUrls) {
    for (const row of completeRows) {
      const url = String(row.video_url);
      const result = await checkPlayable(url);
      if (result.ok) playable += 1;
      else unreachable.push({ jobId: row.id, url, reason: result.reason ?? 'unreachable' });
    }
  }

  const queued = rows.filter((row) => row.status === 'queued').length;
  const rendering = rows.filter((row) => row.status === 'rendering').length;
  const failed = rows.filter((row) => row.status === 'failed').length;
  const complete = completeRows.length;
  return {
    courseId,
    requiredLessonVideos,
    requiredMicroclips,
    expectedTotal,
    jobsTotal: rows.length,
    queued,
    rendering,
    failed,
    complete,
    duplicateIdentities: duplicates,
    playable,
    unreachable,
    staleRendering,
    completePackage:
      rows.length === expectedTotal &&
      duplicates === 0 &&
      queued === 0 && rendering === 0 && failed === 0 && staleRendering === 0 &&
      complete === expectedTotal && playable === expectedTotal && unreachable.length === 0,
  };
}
