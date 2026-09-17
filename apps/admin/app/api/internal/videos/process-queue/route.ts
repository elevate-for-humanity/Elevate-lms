import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { VideoJob } from '@/lib/video/job-queue';
import { processClaimedVideoJob } from '@/lib/video/process-video-job';
import { finalizeUnifiedCourseBuildWithClient } from '@/lib/course-builder/build-lifecycle';
import { COURSE_MEDIA_RENDER_LEASE_SECONDS, COURSE_MEDIA_STALE_RENDER_MS } from '@/lib/course-factory/media-manager';
import { getCourseBuilderGenerationControl } from '@/lib/course-builder/generation-control';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 1800;

type VideoWorkerGlobal = typeof globalThis & {
  __elevateActiveVideoBatches?: Set<Promise<void>>;
};

const videoWorkerGlobal = globalThis as VideoWorkerGlobal;
const activeVideoBatches = videoWorkerGlobal.__elevateActiveVideoBatches ?? new Set<Promise<void>>();
videoWorkerGlobal.__elevateActiveVideoBatches = activeVideoBatches;

function boundedConcurrency(value: string | undefined, fallback: number, maximum: number): number {
  const parsed = Number(value ?? fallback);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(1, Math.min(Math.trunc(parsed), maximum));
}

function localRenderConcurrency(): number {
  // One Chromium compositor per service instance avoids the OOM/SIGKILL failure
  // mode. Horizontal service replicas provide safe parallelism.
  return boundedConcurrency(process.env.VIDEO_RENDER_CONCURRENCY, 1, 1);
}

function globalRenderConcurrency(): number {
  // Global database leases cap the fleet. Increase this with the number of
  // isolated Admin renderer replicas; never increase local concurrency.
  return boundedConcurrency(process.env.VIDEO_RENDER_GLOBAL_CONCURRENCY, 2, 12);
}

interface QueueRequestOptions {
  courseId: string | null;
  jobId: string | null;
  maxJobs: number | null;
  queueOneDraft: boolean;
}

async function requestedOptions(request: NextRequest): Promise<QueueRequestOptions> {
  try {
    const body = await request.json();
    const value = body && typeof body.courseId === 'string' ? body.courseId.trim() : '';
    const jobValue = body && typeof body.jobId === 'string' ? body.jobId.trim() : '';
    const requestedMax = Number(body?.maxJobs);
    return {
      courseId: value || null,
      jobId: jobValue || null,
      maxJobs: Number.isFinite(requestedMax)
        ? Math.max(1, Math.min(Math.trunc(requestedMax), 4))
        : null,
      queueOneDraft: body?.queueOneDraft === true,
    };
  } catch {
    return { courseId: null, jobId: null, maxJobs: null, queueOneDraft: false };
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const options = await requestedOptions(request);
  const { courseId, maxJobs } = options;
  const { jobId, queueOneDraft } = options;
  if (queueOneDraft && (!courseId || maxJobs !== 1)) {
    return NextResponse.json(
      { error: 'queueOneDraft requires an exact courseId and maxJobs=1' },
      { status: 400 },
    );
  }
  if (jobId && (!queueOneDraft || !courseId || maxJobs !== 1)) {
    return NextResponse.json(
      { error: 'jobId requires an exact courseId, queueOneDraft=true, and maxJobs=1' },
      { status: 400 },
    );
  }
  const db = await requireAdminClient();
  const generationControl = await getCourseBuilderGenerationControl(db);
  const globallyPaused = generationControl.paused;
  const allowedCourseIds = new Set(generationControl.allowedCourseIds);

  // A closed global gate may carry a narrow allowlist. Explicit and scheduled
  // requests can only reach those courses; every other backlog remains paused.
  if (globallyPaused && courseId && !allowedCourseIds.has(courseId)) {
    return NextResponse.json({
      ok: true,
      started: 0,
      reason: 'course-builder-generation-paused',
      courseId,
    });
  }
  if (
    globallyPaused &&
    !courseId &&
    (jobId || queueOneDraft || generationControl.allowedCourseIds.length === 0)
  ) {
    return NextResponse.json({
      ok: true,
      started: 0,
      reason: 'course-builder-generation-paused',
      courseId,
    });
  }
  const maxConcurrent = globalRenderConcurrency();
  const localConcurrent = localRenderConcurrency();

  if (courseId) {
    const { data: course, error: courseError } = await db
      .from('courses')
      .select('generation_paused')
      .eq('id', courseId)
      .maybeSingle();
    if (courseError) {
      return NextResponse.json(
        { error: 'Unable to inspect course generation state' },
        { status: 500 },
      );
    }
    if (!course || course.generation_paused === true) {
      return NextResponse.json({
        ok: true,
        started: 0,
        reason: 'course-generation-paused',
        courseId,
      });
    }
  }

  // Capacity is global even when candidate selection is course-scoped. This
  // prevents an acceptance/repair run from overbooking Chromium while another
  // course already owns render slots.
  const now = new Date();
  const staleBefore = new Date(now.getTime() - COURSE_MEDIA_STALE_RENDER_MS).toISOString();
  const { count: activeCount, error: activeError } = await db
    .from('video_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'rendering')
    // A crashed worker may leave status=rendering behind after its lease has
    // expired. It must remain available for audited recovery, but it no longer
    // owns scarce renderer capacity. Legacy rows without a lease count as
    // active only inside the same stale-render safety window.
    .or(
      `lease_expires_at.gt.${now.toISOString()},and(lease_expires_at.is.null,started_at.gt.${staleBefore})`,
    );
  if (activeError) {
    return NextResponse.json({ error: 'Unable to inspect the video queue' }, { status: 500 });
  }

  const active = activeCount ?? 0;
  const localActive = activeVideoBatches.size;
  const availableSlots = Math.min(
    Math.max(0, maxConcurrent - active),
    Math.max(0, localConcurrent - localActive),
    maxJobs ?? maxConcurrent,
  );
  if (availableSlots === 0) {
    return NextResponse.json({
      ok: true,
      started: 0,
      reason: 'render-capacity-full',
      courseId,
      active,
      localActive,
      localConcurrent,
      maxConcurrent,
    });
  }

  // A bounded acceptance run may promote exactly one existing draft asset only
  // after global render capacity is available. Bulk course recovery remains a
  // separate, intentionally paused operation.
  let queuedDraftJobId: string | null = null;
  if (queueOneDraft && courseId) {
    const { count: queuedCount, error: queuedCountError } = await db
      .from('video_jobs')
      .select('id', { count: 'exact', head: true })
      .eq('course_id', courseId)
      .eq('status', 'queued');
    if (queuedCountError) {
      return NextResponse.json(
        { error: 'Unable to inspect the course video queue' },
        { status: 500 },
      );
    }

    if ((queuedCount ?? 0) === 0) {
      const { data: draft, error: draftError } = await db
        .from('video_jobs')
        .select('id')
        .eq('course_id', courseId)
        .eq('status', 'draft')
        .order('asset_kind', { ascending: true })
        .order('created_at', { ascending: true })
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (draftError) {
        return NextResponse.json(
          { error: 'Unable to read a draft course video job' },
          { status: 500 },
        );
      }
      if (!draft) {
        return NextResponse.json({
          ok: true,
          started: 0,
          reason: 'no-draft-or-queued-job',
          courseId,
        });
      }

      const now = new Date().toISOString();
      const { data: queuedDraft, error: queueDraftError } = await db
        .from('video_jobs')
        .update({ status: 'queued', queued_at: now, updated_at: now })
        .eq('id', draft.id)
        .eq('course_id', courseId)
        .eq('status', 'draft')
        .select('id')
        .maybeSingle();
      if (queueDraftError) {
        return NextResponse.json(
          { error: 'Unable to queue the bounded draft video job' },
          { status: 500 },
        );
      }
      queuedDraftJobId = queuedDraft?.id ?? null;
    }
  }

  // Postgres owns the concurrency boundary. FOR UPDATE SKIP LOCKED prevents
  // separate Admin instances from rendering the same canonical asset.
  let claimedRows: VideoJob[] = [];
  if (courseId && jobId) {
    const claimedAt = new Date();
    const { data: claimed, error: claimError } = await db
      .from('video_jobs')
      .update({
        status: 'rendering',
        started_at: claimedAt.toISOString(),
        completed_at: null,
        heartbeat_at: claimedAt.toISOString(),
        lease_token: randomUUID(),
        lease_expires_at: new Date(claimedAt.getTime() + COURSE_MEDIA_RENDER_LEASE_SECONDS * 1000).toISOString(),
        updated_at: claimedAt.toISOString(),
      })
      .eq('id', jobId)
      .eq('course_id', courseId)
      .eq('status', 'queued')
      .lt('retry_count', 3)
      .is('dead_lettered_at', null)
      .select('*')
      .maybeSingle();
    if (claimError) {
      logger.error('[video-worker] Exact queue claim failed', claimError, { courseId, jobId });
      return NextResponse.json(
        { error: 'Unable to claim the requested video job' },
        { status: 500 },
      );
    }
    if (claimed) claimedRows = [claimed as VideoJob];
  } else if (courseId) {
    const { data, error: claimError } = await db.rpc('claim_video_jobs', {
      p_limit: availableSlots,
      p_course_id: courseId,
      p_lease_seconds: COURSE_MEDIA_RENDER_LEASE_SECONDS,
    });
    if (claimError) {
      logger.error('[video-worker] Atomic queue claim failed', claimError);
      return NextResponse.json({ error: 'Unable to claim the video queue' }, { status: 500 });
    }
    claimedRows = (data ?? []) as VideoJob[];
  } else {
    // The database lease remains the concurrency authority, while the course
    // pause flag is the cost-control authority. Claim per unpaused course so a
    // large paused backlog cannot consume renderer or GPU capacity.
    let eligibleCourseQuery = db
      .from('courses')
      .select('id')
      .eq('generation_paused', false)
      .order('updated_at', { ascending: true });
    if (globallyPaused) {
      eligibleCourseQuery = eligibleCourseQuery.in('id', generationControl.allowedCourseIds);
    }
    const { data: eligibleCourses, error: eligibleCourseError } = await eligibleCourseQuery;
    if (eligibleCourseError) {
      return NextResponse.json({ error: 'Unable to inspect unpaused courses' }, { status: 500 });
    }
    for (const course of eligibleCourses ?? []) {
      const remaining = availableSlots - claimedRows.length;
      if (remaining <= 0) break;
      const { data, error: claimError } = await db.rpc('claim_video_jobs', {
        p_limit: remaining,
        p_course_id: course.id,
        p_lease_seconds: COURSE_MEDIA_RENDER_LEASE_SECONDS,
      });
      if (claimError) {
        logger.error('[video-worker] Atomic course-scoped queue claim failed', claimError, {
          courseId: course.id,
        });
        return NextResponse.json({ error: 'Unable to claim the video queue' }, { status: 500 });
      }
      claimedRows.push(...((data ?? []) as VideoJob[]));
    }
  }
  if (!claimedRows?.length) {
    return NextResponse.json({ ok: true, started: 0, reason: 'queue-empty', courseId });
  }
  const claimedJobs = claimedRows as VideoJob[];

  // Do not attach a long Remotion render to the lifetime of this HTTP request.
  // Northflank/Next can terminate a request after roughly 15 minutes even when
  // the service process remains healthy, which sends SIGTERM to the compositor
  // and strands its leased row. Keep a process-global strong reference to the
  // batch instead. The database lease is still the ownership authority and the
  // background loop will observe render-capacity-full until this batch exits.
  const batch = (async () => {
    const results = await Promise.allSettled(claimedJobs.map((job) => processClaimedVideoJob(job)));
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error('[video-worker] Processor failed', result.reason, {
          jobId: claimedJobs[index]?.id,
          courseId: claimedJobs[index]?.course_id,
        });
      }
    });
    const courseIds = [...new Set(claimedJobs.map((job) => job.course_id).filter(Boolean))];
    for (const completedCourseId of courseIds) {
      try {
        const finalization = await finalizeUnifiedCourseBuildWithClient({
          db,
          courseId: completedCourseId,
        });
        logger.info('[video-worker] Unified draft course finalization checked', {
          courseId: completedCourseId,
          state: finalization.state,
        });
      } catch (finalizationError) {
        logger.error('[video-worker] Automated course finalization failed', finalizationError, {
          courseId: completedCourseId,
        });
      }
    }
  })();
  activeVideoBatches.add(batch);
  void batch.finally(() => activeVideoBatches.delete(batch));

  return NextResponse.json(
    {
      ok: true,
      courseId,
      started: claimedJobs.length,
      jobs: claimedJobs.map((job) => ({
        jobId: job.id,
        courseId: job.course_id,
        lessonId: job.lesson_id,
        assetKind: job.asset_kind ?? 'lesson',
        assetKey: job.asset_key ?? null,
        retryCount: job.retry_count ?? 0,
      })),
      activeBeforeClaim: active,
      localActiveBeforeClaim: localActive,
      localConcurrent,
      maxConcurrent,
      queuedDraftJobId,
      accepted: claimedJobs.length,
    },
    { status: 200 },
  );
}
