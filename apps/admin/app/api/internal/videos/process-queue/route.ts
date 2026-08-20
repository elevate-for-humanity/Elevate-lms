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

export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const staleBefore = new Date(Date.now() - 45 * 60 * 1000).toISOString();
  const { data: recovered } = await db
    .from('video_jobs')
    .update({
      status: 'queued',
      started_at: null,
      error_message: 'Recovered after render worker timeout',
      updated_at: new Date().toISOString(),
    })
    .eq('status', 'rendering')
    .lt('started_at', staleBefore)
    .select('lesson_id,asset_kind,asset_key');

  const recoveredLessonIds = (recovered ?? [])
    .filter((row) => (row.asset_kind ?? 'lesson') === 'lesson')
    .map((row) => row.lesson_id)
    .filter(Boolean);
  if (recoveredLessonIds.length > 0) {
    await db
      .from('course_lessons')
      .update({ video_status: 'queued', video_error: null })
      .in('id', recoveredLessonIds);
  }

  const maxConcurrent = renderConcurrency();
  const { count: activeCount, error: activeError } = await db
    .from('video_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'rendering');
  if (activeError) {
    return NextResponse.json({ error: 'Unable to inspect the video queue' }, { status: 500 });
  }
  if ((activeCount ?? 0) >= maxConcurrent) {
    return NextResponse.json({
      ok: true,
      started: 0,
      reason: 'render-capacity-full',
      active: activeCount ?? 0,
      maxConcurrent,
    });
  }

  const { data: candidate, error: queueError } = await db
    .from('video_jobs')
    .select('*')
    .eq('status', 'queued')
    // Alphabetically, lesson sorts before microclip. Preserve learner-critical
    // full lesson media priority while the short-clip queue drains behind it.
    .order('asset_kind', { ascending: true })
    .order('queued_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (queueError) {
    return NextResponse.json({ error: 'Unable to read the video queue' }, { status: 500 });
  }
  if (!candidate) return NextResponse.json({ ok: true, started: 0, reason: 'queue-empty' });

  const startedAt = new Date().toISOString();
  const { data: claimed, error: claimError } = await db
    .from('video_jobs')
    .update({ status: 'rendering', started_at: startedAt, updated_at: startedAt })
    .eq('id', candidate.id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();
  if (claimError || !claimed) {
    return NextResponse.json({ ok: true, started: 0, reason: 'already-claimed' });
  }

  await markRendering(claimed.id);

  after(async () => {
    await processClaimedVideoJob(claimed as VideoJob).catch((error) => {
      logger.error('[video-worker] Background processor failed', error, { jobId: claimed.id });
    });
  });

  return NextResponse.json(
    {
      ok: true,
      started: 1,
      jobId: claimed.id,
      lessonId: claimed.lesson_id,
      assetKind: claimed.asset_kind ?? 'lesson',
      assetKey: claimed.asset_key ?? null,
      activeBeforeClaim: activeCount ?? 0,
      maxConcurrent,
    },
    { status: 202 },
  );
}
