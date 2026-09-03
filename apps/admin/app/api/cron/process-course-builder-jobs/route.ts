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
// AI enrichment for a full regulated course can exceed the serverless default.
// Admin is self-hosted, so keep the request alive while the durable DB lease is
// renewed by the worker heartbeat.
export const maxDuration = 3600;

async function _GET(request: Request) {
  if (
    !process.env.CRON_SECRET ||
    request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = await requireAdminClient();
  const workerId = `course-builder:${randomUUID()}`;

  // Count eligible work before claiming. A 2xx `processed: 0` while eligible
  // rows exist is a broken queue signal, not a successful no-op. Keeping this
  // check in the worker makes deployment/cron wake failures observable.
  const now = new Date().toISOString();
  const { count: eligibleBefore, error: eligibleError } = await db
    .from('devstudio_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('tool_name', 'build_course')
    .eq('status', 'queued')
    .lte('run_at', now);
  if (eligibleError) {
    logger.error('[course-builder-worker] eligibility check failed', eligibleError);
    return NextResponse.json({ error: 'Unable to inspect course-build queue' }, { status: 500 });
  }

  const { data, error } = await db.rpc('claim_devstudio_course_job', { p_worker_id: workerId });
  if (error) {
    logger.error('[course-builder-worker] claim failed', error);
    return NextResponse.json({ error: 'Unable to claim course build' }, { status: 500 });
  }
  let job = data?.[0] as CourseBuildJob | undefined;
  if (!job) {
    if ((eligibleBefore ?? 0) > 0) {
      // PostgREST has occasionally returned an empty SETOF response even though
      // the same function is healthy when executed directly. Use an optimistic,
      // compare-and-set claim as a second atomic path. The status predicate means
      // concurrent workers cannot both acquire the same row.
      logger.warn('[course-builder-worker] RPC claim returned no row; using CAS fallback', {
        eligibleBefore,
        workerId,
      });

      const { data: candidate, error: candidateError } = await db
        .from('devstudio_jobs')
        .select('id, attempts, progress')
        .eq('tool_name', 'build_course')
        .eq('status', 'queued')
        .lte('run_at', now)
        .order('run_at', { ascending: true })
        .order('started_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      if (candidateError) {
        logger.error('[course-builder-worker] fallback candidate lookup failed', candidateError);
        return NextResponse.json({ error: 'Unable to select course-build job' }, { status: 500 });
      }

      if (candidate?.id) {
        const { data: claimed, error: fallbackError } = await db
          .from('devstudio_jobs')
          .update({
            status: 'running',
            stage: 'init',
            progress: Math.max(Number(candidate.progress ?? 0), 1),
            attempts: Number(candidate.attempts ?? 0) + 1,
            locked_at: now,
            locked_by: workerId,
            error: null,
            updated_at: now,
          })
          .eq('id', candidate.id)
          .eq('status', 'queued')
          .select('*')
          .maybeSingle();
        if (fallbackError) {
          logger.error('[course-builder-worker] fallback claim failed', fallbackError);
          return NextResponse.json({ error: 'Unable to claim course-build job' }, { status: 500 });
        }
        job = claimed as CourseBuildJob | undefined;
      }

      if (!job) {
        return NextResponse.json(
          { error: 'Eligible course-build jobs were not claimed', eligible: eligibleBefore },
          { status: 503 },
        );
      }
    }
    if (!job) return NextResponse.json({ processed: 0, eligible: 0 });
  }

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
    return NextResponse.json({
      processed: 1,
      jobId: job.id,
      status: 'completed',
      eligibleBefore,
    });
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
