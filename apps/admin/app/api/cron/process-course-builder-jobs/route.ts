import { after, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import {
  processCourseBuild,
  failCourseBuild,
  type CourseBuildJob,
} from '@/lib/jobs/handlers/course-build';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

async function _GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const workerId = `course-builder:${randomUUID()}`;
  const { data, error } = await db.rpc('claim_devstudio_course_job', { p_worker_id: workerId });
  if (error) {
    logger.error('[course-builder-worker] claim failed', error);
    return NextResponse.json({ error: 'Unable to claim course build' }, { status: 500 });
  }
  const job = data?.[0] as CourseBuildJob | undefined;
  if (!job) return NextResponse.json({ processed: 0 });

  const wakeNext = () =>
    after(async () => {
      const url = new URL('/api/cron/process-course-builder-jobs', request.url);
      await fetch(url, {
        headers: { authorization: `Bearer ${process.env.CRON_SECRET}` },
        cache: 'no-store',
      }).catch((cause) =>
        logger.warn('[course-builder-worker] next-job wake-up failed', {
          error: cause instanceof Error ? cause.message : String(cause),
        }),
      );
    });

  try {
    await processCourseBuild(job);
    wakeNext();
    return NextResponse.json({ processed: 1, jobId: job.id, status: 'completed' });
  } catch (cause) {
    await failCourseBuild(job, cause);
    wakeNext();
    logger.error(
      '[course-builder-worker] build failed',
      cause instanceof Error ? cause : new Error(String(cause)),
      { jobId: job.id },
    );
    return NextResponse.json({ processed: 1, jobId: job.id, status: 'retry_or_failed' });
  }
}

export const GET = withRuntime(withApiAudit('/api/cron/process-course-builder-jobs', _GET));
