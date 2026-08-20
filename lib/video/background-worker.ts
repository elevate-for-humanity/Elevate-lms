import 'server-only';

import { logger } from '@/lib/logger';
import { requireAdminClient } from '@/lib/supabase/admin';
import type { VideoJob } from './job-queue';
import { processClaimedVideoJob } from './process-video-job';

const IDLE_DELAY_MS = 30_000;
const ERROR_DELAY_MS = 60_000;
const STALE_RENDER_MS = 45 * 60 * 1000;

type WorkerGlobal = typeof globalThis & {
  __elevateAdminVideoWorkerStarted?: boolean;
};

const workerGlobal = globalThis as WorkerGlobal;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function recoverStaleRender(): Promise<void> {
  const db = await requireAdminClient();
  const staleBefore = new Date(Date.now() - STALE_RENDER_MS).toISOString();
  const { data: recovered, error } = await db
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

  if (error) {
    logger.warn('[video-background-worker] stale render recovery failed', { error: error.message });
    return;
  }

  const lessonIds = (recovered ?? []).map((row) => row.lesson_id).filter(Boolean);
  if (lessonIds.length > 0) {
    await db
      .from('course_lessons')
      .update({ video_status: 'queued', video_error: null })
      .in('id', lessonIds);
    logger.info('[video-background-worker] recovered stale renders', { count: lessonIds.length });
  }
}

async function claimNextJob(): Promise<VideoJob | null> {
  const db = await requireAdminClient();

  const { count: activeCount, error: activeError } = await db
    .from('video_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'rendering');
  if (activeError) throw activeError;
  if ((activeCount ?? 0) > 0) return null;

  const { data: candidate, error: queueError } = await db
    .from('video_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('queued_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (queueError) throw queueError;
  if (!candidate) return null;

  const now = new Date().toISOString();
  const { data: claimed, error: claimError } = await db
    .from('video_jobs')
    .update({ status: 'rendering', started_at: now, updated_at: now, error_message: null })
    .eq('id', candidate.id)
    .eq('status', 'queued')
    .select('*')
    .maybeSingle();

  if (claimError || !claimed) return null;

  await db
    .from('course_lessons')
    .update({ video_status: 'rendering', video_error: null })
    .eq('id', claimed.lesson_id);

  return claimed as VideoJob;
}

async function runLoop(): Promise<void> {
  await recoverStaleRender();
  logger.info('[video-background-worker] Admin queue loop started');

  for (;;) {
    try {
      const job = await claimNextJob();
      if (!job) {
        await sleep(IDLE_DELAY_MS);
        continue;
      }

      logger.info('[video-background-worker] processing job', {
        jobId: job.id,
        lessonId: job.lesson_id,
      });
      await processClaimedVideoJob(job);
    } catch (error) {
      logger.error('[video-background-worker] loop error', error instanceof Error ? error : new Error(String(error)));
      await sleep(ERROR_DELAY_MS);
    }
  }
}

export function startAdminVideoWorker(): void {
  if (workerGlobal.__elevateAdminVideoWorkerStarted) return;
  if (process.env.NODE_ENV === 'test' || process.env.DISABLE_ADMIN_VIDEO_WORKER === 'true') return;

  workerGlobal.__elevateAdminVideoWorkerStarted = true;
  void runLoop().catch((error) => {
    workerGlobal.__elevateAdminVideoWorkerStarted = false;
    logger.error('[video-background-worker] fatal worker error', error instanceof Error ? error : new Error(String(error)));
  });
}
