import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { classifyVideoFailure, type VideoAssetKind, type VideoJob } from '@/lib/video/job-queue';
import { MEDIA_QUALITY_GATE_VERSION, mediaQualityFailures, type MediaQualityEvidence } from '@/lib/video/media-quality-gate';

export const COURSE_MEDIA_MAX_RETRIES = 3;
export const COURSE_MEDIA_STALE_RENDER_MS = 45 * 60 * 1000;
export const COURSE_MEDIA_RETRY_BASE_MS = 60 * 1000;
export const COURSE_MEDIA_RETRY_MAX_BACKOFF_MS = 15 * 60 * 1000;

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
  lessonStateMismatches: number;
  microclipStateMismatches: number;
  invalidQualityEvidence: number;
  completePackage: boolean;
}

export function hasCanonicalMediaQualityEvidence(value: unknown): value is MediaQualityEvidence {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const evidence = value as MediaQualityEvidence;
  return evidence.gateVersion === MEDIA_QUALITY_GATE_VERSION && mediaQualityFailures(evidence).length === 0;
}

export function canonicalMediaIdentityKey(
  job: Pick<VideoJob, 'course_id' | 'lesson_id' | 'asset_kind' | 'asset_key'>,
) {
  return `${job.course_id}:${job.lesson_id}:${job.asset_kind ?? 'lesson'}:${job.asset_key ?? ''}`;
}

export function isCourseMediaFailureRetryable(message: string | null): boolean {
  if (!message) return true;
  return !['configuration', 'authorization', 'not_found', 'content'].includes(
    classifyVideoFailure(message),
  );
}

export function courseMediaRetryDelayMs(retryCount: number): number {
  const exponent = Math.max(0, Math.min(retryCount, COURSE_MEDIA_MAX_RETRIES));
  return Math.min(COURSE_MEDIA_RETRY_BASE_MS * (2 ** exponent), COURSE_MEDIA_RETRY_MAX_BACKOFF_MS);
}

function retryBackoffElapsed(job: VideoJob, now = Date.now()): boolean {
  if (job.status !== 'failed') return true;
  const last = job.last_failure_at ?? job.updated_at ?? job.completed_at;
  if (!last) return true;
  return now - new Date(last).getTime() >= courseMediaRetryDelayMs(job.retry_count ?? 0);
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
  // Force may bypass backoff and terminal classification for an operator repair,
  // but it must never bypass the hard retry ceiling. Otherwise deterministic
  // renderer failures loop forever and repeatedly consume paid GPU capacity.
  if ((job.retry_count ?? 0) >= COURSE_MEDIA_MAX_RETRIES) {
    throw new Error(`Retry limit reached for media job ${job.id}`);
  }
  if (job.status === 'failed' && !isCourseMediaFailureRetryable(job.error_message) && !options.force) {
    throw new Error(`Media job ${job.id} requires operator repair before retry`);
  }
  if (job.status === 'failed' && !retryBackoffElapsed(job) && !options.force) {
    throw new Error(`Retry backoff has not elapsed for media job ${job.id}`);
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
      // An authorized retry invalidates any partial/stale output. Completed jobs
      // are returned above and never reach this reset unless force=true.
      video_url: null,
      audio_url: null,
      error_message: options.reason ?? job.error_message,
      review_status: 'not_ready',
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      // Production enforces quality_evidence NOT NULL. A retry has no valid
      // evidence yet, so reset it to the canonical empty JSON object.
      quality_evidence: {},
      lease_token: null,
      lease_expires_at: null,
      heartbeat_at: null,
      failure_class: null,
      next_retry_at: null,
      dead_lettered_at: null,
      updated_at: now,
    })
    .eq('id', job.id)
    .select('*')
    .single();
  if (resetError || !reset) throw resetError ?? new Error('Unable to reset canonical media job');

  if (identity.assetKind === 'lesson') {
    await db
      .from('course_lessons')
      // Keep the approved learner-facing asset live while its replacement is rendered.
      .update({ video_error: null })
      .eq('id', identity.lessonId);
  } else if (identity.assetKey) {
    const { data: lesson, error: lessonError } = await db
      .from('course_lessons')
      .select('content_json')
      .eq('id', identity.lessonId)
      .maybeSingle();
    if (lessonError) throw lessonError;
    const content = lesson?.content_json && typeof lesson.content_json === 'object'
      ? structuredClone(lesson.content_json as Record<string, any>)
      : {};
    const experience = content.experience && typeof content.experience === 'object'
      ? content.experience as Record<string, any>
      : {};
    const clips = Array.isArray(experience.quickClips) ? experience.quickClips : [];
    experience.quickClips = clips.map((clip: Record<string, any>) =>
      String(clip.id) === identity.assetKey
        ? { ...clip, status: 'queued', videoUrl: null, audioUrl: null, error: null }
        : clip,
    );
    content.experience = experience;
    const { error: updateError } = await db
      .from('course_lessons')
      .update({ content_json: content })
      .eq('id', identity.lessonId);
    if (updateError) throw updateError;
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

  const now = Date.now();
  const staleBefore = now - COURSE_MEDIA_STALE_RENDER_MS;
  const recovered: string[] = [];
  const blocked: Array<{ jobId: string; reason: string }> = [];

  for (const row of (data ?? []) as VideoJob[]) {
    const leaseExpired = row.status === 'rendering' && row.lease_expires_at
      ? new Date(row.lease_expires_at).getTime() < now
      : false;
    const legacyStale = row.status === 'rendering' && !row.lease_expires_at && row.started_at
      ? new Date(row.started_at).getTime() < staleBefore
      : false;
    const stale = leaseExpired || legacyStale;
    const eligibleFailed =
      row.status === 'failed' &&
      isCourseMediaFailureRetryable(row.error_message) &&
      (input.force === true || retryBackoffElapsed(row, now));
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
          reason: stale
            ? 'Recovered stale rendering job through Course Factory policy'
            : row.error_message ?? 'Retrying failed media job',
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

async function verifyPlayableRows(rows: VideoJob[]) {
  const unreachable: Array<{ jobId: string; url: string; reason: string }> = [];
  let playable = 0;
  const concurrency = 8;
  for (let index = 0; index < rows.length; index += concurrency) {
    const batch = rows.slice(index, index + concurrency);
    const results = await Promise.all(batch.map(async (row) => ({ row, result: await checkPlayable(String(row.video_url)) })));
    for (const { row, result } of results) {
      if (result.ok) playable += 1;
      else unreachable.push({ jobId: row.id, url: String(row.video_url), reason: result.reason ?? 'unreachable' });
    }
  }
  return { playable, unreachable };
}

export async function getCourseMediaState(courseId: string, options: { verifyUrls?: boolean } = {}): Promise<CourseMediaState> {
  const db = await requireAdminClient();
  const [{ data: lessons, error: lessonError }, { data: jobs, error: jobError }] = await Promise.all([
    db.from('course_lessons').select('id,content_json,video_status,video_url,video_job_id').eq('course_id', courseId),
    db.from('video_jobs').select('*').eq('course_id', courseId),
  ]);
  if (lessonError) throw lessonError;
  if (jobError) throw jobError;

  const rows = (jobs ?? []) as VideoJob[];
  const lessonJobs = new Map<string, VideoJob>();
  const microJobs = new Map<string, VideoJob>();
  const identities = new Set<string>();
  let duplicates = 0;
  for (const row of rows) {
    const key = canonicalMediaIdentityKey(row);
    if (identities.has(key)) duplicates += 1;
    identities.add(key);
    if ((row.asset_kind ?? 'lesson') === 'lesson') lessonJobs.set(row.lesson_id, row);
    else microJobs.set(`${row.lesson_id}:${row.asset_key ?? ''}`, row);
  }

  let requiredMicroclips = 0;
  let lessonStateMismatches = 0;
  let microclipStateMismatches = 0;
  for (const lesson of lessons ?? []) {
    const lessonJob = lessonJobs.get(lesson.id);
    const lessonUrl = typeof lesson.video_url === 'string' ? lesson.video_url.trim() : '';
    const jobUrl = typeof lessonJob?.video_url === 'string' ? lessonJob.video_url.trim() : '';
    if (
      !lessonJob ||
      lesson.video_job_id !== lessonJob.id ||
      lesson.video_status !== lessonJob.status ||
      (lessonJob.status === 'complete' && lessonUrl !== jobUrl)
    ) {
      lessonStateMismatches += 1;
    }

    const content = lesson.content_json && typeof lesson.content_json === 'object'
      ? lesson.content_json as Record<string, any>
      : {};
    const experience = content.experience && typeof content.experience === 'object'
      ? content.experience as Record<string, any>
      : {};
    const clips = Array.isArray(experience.quickClips) ? experience.quickClips.slice(0, 2) : [];
    requiredMicroclips += clips.length;
    for (const clip of clips) {
      const key = typeof clip?.id === 'string' ? clip.id : '';
      if (!key) {
        microclipStateMismatches += 1;
        continue;
      }
      const job = microJobs.get(`${lesson.id}:${key}`);
      if (!job) {
        microclipStateMismatches += 1;
        continue;
      }
      const clipStatus = typeof clip.status === 'string' ? clip.status : null;
      const clipUrl = typeof clip.videoUrl === 'string' ? clip.videoUrl.trim() : '';
      const canonicalUrl = typeof job.video_url === 'string' ? job.video_url.trim() : '';
      if (clipStatus !== job.status || (job.status === 'complete' && clipUrl !== canonicalUrl)) {
        microclipStateMismatches += 1;
      }
    }
  }

  const requiredLessonVideos = lessons?.length ?? 0;
  const expectedTotal = requiredLessonVideos + requiredMicroclips;
  const now = Date.now();
  const staleRendering = rows.filter(
    (row) => row.status === 'rendering' && (
      row.lease_expires_at
        ? new Date(row.lease_expires_at).getTime() < now
        : Boolean(row.started_at && now - new Date(row.started_at).getTime() > COURSE_MEDIA_STALE_RENDER_MS)
    ),
  ).length;
  const completeRows = rows.filter((row) => row.status === 'complete' && Boolean(row.video_url));
  const invalidQualityEvidence = completeRows.filter((row) =>
    row.review_status !== 'approved' || !hasCanonicalMediaQualityEvidence(row.quality_evidence),
  ).length;
  let playable = options.verifyUrls ? 0 : completeRows.length;
  let unreachable: Array<{ jobId: string; url: string; reason: string }> = [];

  if (options.verifyUrls) {
    const verified = await verifyPlayableRows(completeRows);
    playable = verified.playable;
    unreachable = verified.unreachable;
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
    lessonStateMismatches,
    microclipStateMismatches,
    invalidQualityEvidence,
    completePackage:
      rows.length === expectedTotal &&
      duplicates === 0 &&
      queued === 0 && rendering === 0 && failed === 0 && staleRendering === 0 &&
      lessonStateMismatches === 0 && microclipStateMismatches === 0 &&
      invalidQualityEvidence === 0 &&
      complete === expectedTotal && playable === expectedTotal && unreachable.length === 0,
  };
}
