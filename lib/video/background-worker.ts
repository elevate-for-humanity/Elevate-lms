import 'server-only';

import { logger } from '@/lib/logger';
import { getSecret } from '@/lib/secrets';
import { recoverCourseMediaJobs } from '@/lib/course-factory/media-manager';

const START_DELAY_MS = 15_000;
const TICK_DELAY_MS = 30_000;
const ERROR_DELAY_MS = 60_000;

type WorkerGlobal = typeof globalThis & {
  __elevateAdminVideoWorkerStarted?: boolean;
};

const workerGlobal = globalThis as WorkerGlobal;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function kickCanonicalWorker(): Promise<void> {
  const secret = process.env.CRON_SECRET?.trim() || await getSecret('CRON_SECRET');
  if (!secret?.trim()) {
    logger.warn('[video-background-worker] CRON_SECRET is unavailable; queue tick skipped');
    return;
  }

  // Retry/recovery policy belongs to Course Factory. The renderer endpoint only
  // claims queued canonical jobs and executes them.
  const maintenance = await recoverCourseMediaJobs();
  if (maintenance.recovered.length || maintenance.blocked.length) {
    logger.info('[video-background-worker] Course Factory media maintenance', maintenance);
  }

  // Keep Remotion and all Node-only rendering dependencies isolated in the
  // Node API route. Instrumentation only makes a localhost HTTP request.
  const port = process.env.PORT?.trim() || '3000';
  const response = await fetch(`http://127.0.0.1:${port}/api/internal/videos/process-queue`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${secret}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({}),
    cache: 'no-store',
  });

  const text = await response.text();
  if (!response.ok) {
    logger.warn('[video-background-worker] canonical worker tick rejected', {
      status: response.status,
      body: text.slice(0, 500),
    });
    return;
  }

  logger.info('[video-background-worker] canonical worker tick accepted', {
    status: response.status,
    body: text.slice(0, 500),
  });
}

async function runLoop(): Promise<void> {
  await sleep(START_DELAY_MS);
  logger.info('[video-background-worker] Admin queue trigger loop started');

  for (;;) {
    try {
      await kickCanonicalWorker();
      await sleep(TICK_DELAY_MS);
    } catch (error) {
      logger.error(
        '[video-background-worker] trigger loop error',
        error instanceof Error ? error : new Error(String(error)),
      );
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
    logger.error(
      '[video-background-worker] fatal trigger loop error',
      error instanceof Error ? error : new Error(String(error)),
    );
  });
}
