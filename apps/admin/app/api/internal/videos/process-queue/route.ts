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

async function syncLessonQueueState(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  rows: Array<{ lesson_id?: string | null; asset_kind?: string | null }>,
) {
  const lessonIds = rows
    .filter((row) => (row.asset_kind ?? 'lesson') === 'lesson' && row.lesson_id)
    .map((row) => row.lesson_id as string);
  if (!lessonIds.length) return;

  await db
    .from('course_lessons')
    .update({ video_status: 'queued', video_error: null })
    .in('id', lessonIds);
}

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const now = new Date().toISOString();

  // Recover workers that died after claiming a job.
  const staleBefore = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  const { data: recovered } = await db
    .from('video_jobs')
    .update({
      status: 'queued',
      started_at: null,
      completed_at: null,
      error_message: 'Recovered after render worker timeout',
      queued_at: now,
      updated_at: now,
    })
    .eq('status', 'rendering')
    .lt('started_at', staleBefore)
    .select('lesson_id,asset_kind,asset_key');
  await syncLessonQueueState(db, recovered ?? []);

  // One-time recovery path for the historical Edge TTS datacenter 403 failures.
  // Current narration code falls back to authenticated speech, so these jobs are
  // safe to retry instead of remaining permanently dead.
  const retryCutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
  const { data: retried403 } = await db
    .from('video_jobs')
    .update({
      status: 'queued',
      started_at: null,
      completed_at: null,
      error_message: 'Retrying after authenticated narration fallback upgrade',
      queued_at: now,
      updated_at: now,
    })
    .eq('status', 'failed')
    .eq('error_message', 'Unexpected server response: 403')
    .lt('updated_at', retryCutoff)
    .select('lesson_id,asset_kind,asset_key');
  await syncLessonQueueState(db, retried403 ?? []);

  const maxConcurrent = renderConcurrency();
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
      active,
      maxConcurrent,
      recovered: recovered?.length ?? 0,
      retried403: retried403?.length ?? 0,
    });
  }

  const { data: candidates, error: queueError } = await db
    .from('video_jobs')
    .select('*')
    .eq('status', 'queued')
    // Full lesson media is learner-critical and drains before microclips.
    .order('asset_kind', { ascending: true })
    .order('queued_at', { ascending: true })
    .limit(availableSlots);
  if (queueError) {
    return NextResponse.json({ error: 'Unable to read the video queue' }, { status: 500 });
  }
  if (!candidates?.length) {
    return NextResponse.json({
      ok: true,
      started: 0,
      reason: 'queue-empty',
      recovered: recovered?.length ?? 0,
      retried403: retried403?.length ?? 0,
    });
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
    return NextResponse.json({ ok: true, started: 0, reason: 'already-claimed' });
  }

  after(async () => {
    const results = await Promise.allSettled(claimedJobs.map((job) => processClaimedVideoJob(job)));
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.error('[video-worker] Background processor failed', result.reason, {
          jobId: claimedJobs[index]?.id,
        });
      }
    });
  });

  return NextResponse.json(
    {
      ok: true,
      started: claimedJobs.length,
      jobs: claimedJobs.map((job) => ({
        jobId: job.id,
        lessonId: job.lesson_id,
        assetKind: job.asset_kind ?? 'lesson',
        assetKey: job.asset_key ?? null,
      })),
      activeBeforeClaim: active,
      maxConcurrent,
      recovered: recovered?.length ?? 0,
      retried403: retried403?.length ?? 0,
    },
    { status: 202 },
  );
}
