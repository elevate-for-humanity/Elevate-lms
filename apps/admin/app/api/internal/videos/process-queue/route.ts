import { after, NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import { markRendering, type VideoJob } from '@/lib/video/job-queue';
import { processClaimedVideoJob } from '@/lib/video/process-video-job';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 600;

function renderConcurrency(): number {
  const parsed = Number(process.env.VIDEO_RENDER_CONCURRENCY ?? '2');
  if (!Number.isFinite(parsed)) return 2;
  return Math.max(1, Math.min(Math.trunc(parsed), 4));
}

interface QueueRequestOptions {
  courseId: string | null;
  maxJobs: number | null;
  queueOneDraft: boolean;
}

async function requestedOptions(request: NextRequest): Promise<QueueRequestOptions> {
  try {
    const body = await request.json();
    const value = body && typeof body.courseId === 'string' ? body.courseId.trim() : '';
    const requestedMax = Number(body?.maxJobs);
    return {
      courseId: value || null,
      maxJobs: Number.isFinite(requestedMax)
        ? Math.max(1, Math.min(Math.trunc(requestedMax), 4))
        : null,
      queueOneDraft: body?.queueOneDraft === true,
    };
  } catch {
    return { courseId: null, maxJobs: null, queueOneDraft: false };
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { courseId, maxJobs, queueOneDraft } = await requestedOptions(request);
  if (queueOneDraft && (!courseId || maxJobs !== 1)) {
    return NextResponse.json(
      { error: 'queueOneDraft requires an exact courseId and maxJobs=1' },
      { status: 400 },
    );
  }
  const db = await requireAdminClient();
  const maxConcurrent = renderConcurrency();

  // Capacity is global even when candidate selection is course-scoped. This
  // prevents an acceptance/repair run from overbooking Chromium while another
  // course already owns render slots.
  const { count: activeCount, error: activeError } = await db
    .from('video_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'rendering');
  if (activeError) {
    return NextResponse.json({ error: 'Unable to inspect the video queue' }, { status: 500 });
  }

  const active = activeCount ?? 0;
  const availableSlots = Math.min(
    Math.max(0, maxConcurrent - active),
    maxJobs ?? maxConcurrent,
  );
  if (availableSlots === 0) {
    return NextResponse.json({
      ok: true,
      started: 0,
      reason: 'render-capacity-full',
      courseId,
      active,
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
      return NextResponse.json({ error: 'Unable to inspect the course video queue' }, { status: 500 });
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
        return NextResponse.json({ error: 'Unable to read a draft course video job' }, { status: 500 });
      }
      if (!draft) {
        return NextResponse.json({ ok: true, started: 0, reason: 'no-draft-or-queued-job', courseId });
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
        return NextResponse.json({ error: 'Unable to queue the bounded draft video job' }, { status: 500 });
      }
      queuedDraftJobId = queuedDraft?.id ?? null;
    }
  }

  let candidateQuery = db
    .from('video_jobs')
    .select('*')
    .eq('status', 'queued');
  if (courseId) candidateQuery = candidateQuery.eq('course_id', courseId);
  const { data: candidates, error: queueError } = await candidateQuery
    .order('asset_kind', { ascending: true })
    .order('queued_at', { ascending: true })
    .order('id', { ascending: true })
    .limit(availableSlots);

  if (queueError) {
    return NextResponse.json({ error: 'Unable to read the video queue' }, { status: 500 });
  }
  if (!candidates?.length) {
    return NextResponse.json({ ok: true, started: 0, reason: 'queue-empty', courseId });
  }

  const claimedJobs: VideoJob[] = [];
  for (const candidate of candidates) {
    const startedAt = new Date().toISOString();
    const { data: claimed, error: claimError } = await db
      .from('video_jobs')
      .update({ status: 'rendering', started_at: startedAt, updated_at: startedAt })
      .eq('id', candidate.id)
      .eq('status', 'queued')
      .select('*')
      .maybeSingle();

    if (claimError || !claimed) continue;
    await markRendering(claimed.id);
    claimedJobs.push(claimed as VideoJob);
  }

  if (!claimedJobs.length) {
    return NextResponse.json({ ok: true, started: 0, reason: 'already-claimed', courseId });
  }

  after(async () => {
    const results = await Promise.allSettled(claimedJobs.map((job) => processClaimedVideoJob(job)));
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error('[video-worker] Background processor failed', result.reason, {
          jobId: claimedJobs[index]?.id,
          courseId: claimedJobs[index]?.course_id,
        });
      }
    });
  });

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
      maxConcurrent,
      queuedDraftJobId,
    },
    { status: 202 },
  );
}
