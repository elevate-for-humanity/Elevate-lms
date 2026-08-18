import { after, NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { VideoJob } from '@/lib/video/job-queue';
import { processClaimedVideoJob } from '@/lib/video/process-video-job';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 600;

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
    .select('lesson_id');
  const recoveredLessonIds = (recovered ?? []).map((row) => row.lesson_id).filter(Boolean);
  if (recoveredLessonIds.length > 0) {
    await db
      .from('course_lessons')
      .update({ video_status: 'queued', video_error: null })
      .in('id', recoveredLessonIds);
  }

  const { count: activeCount, error: activeError } = await db
    .from('video_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'rendering');
  if (activeError) {
    return NextResponse.json({ error: 'Unable to inspect the video queue' }, { status: 500 });
  }
  if ((activeCount ?? 0) > 0) {
    return NextResponse.json({ ok: true, started: 0, reason: 'render-in-progress' });
  }

  const { data: candidate, error: queueError } = await db
    .from('video_jobs')
    .select('*')
    .eq('status', 'queued')
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

  await db
    .from('course_lessons')
    .update({ video_status: 'rendering', video_error: null })
    .eq('id', claimed.lesson_id);

  after(async () => {
    await processClaimedVideoJob(claimed as VideoJob).catch((error) => {
      logger.error('[video-worker] Background processor failed', error, { jobId: claimed.id });
    });
  });

  return NextResponse.json(
    { ok: true, started: 1, jobId: claimed.id, lessonId: claimed.lesson_id },
    { status: 202 },
  );
}
