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

async function requestedCourseId(request: NextRequest): Promise<string | null> {
  try {
    const body = await request.json();
    const value = body && typeof body.courseId === 'string' ? body.courseId.trim() : '';
    return value || null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const courseId = await requestedCourseId(request);
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
  const availableSlots = Math.max(0, maxConcurrent - active);
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
    },
    { status: 202 },
  );
}
