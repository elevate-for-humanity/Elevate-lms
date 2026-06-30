/**
 * GET /api/cron/process-provisioning-jobs
 * Process pending provisioning_jobs rows — retry failed jobs, timeout stale ones.
 */
import { NextResponse } from 'next/server';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STALE_MINUTES = 30;

export const GET = withRuntime({ cron: 'bearer' }, async () => {
  const db = await requireAdminClient();
  const staleCutoff = new Date(Date.now() - STALE_MINUTES * 60 * 1000).toISOString();

  // Timeout stale in-progress jobs
  const { count: timedOut } = await db
    .from('provisioning_jobs')
    .update({ status: 'failed', error: 'Timed out after 30 minutes', updated_at: new Date().toISOString() })
    .eq('status', 'in_progress')
    .lt('updated_at', staleCutoff)
    .select('id', { count: 'exact', head: true });

  if (timedOut) logger.warn('[cron/process-provisioning-jobs] Timed out stale jobs', { count: timedOut });

  // Retry failed jobs with retry_count < 3
  const { data: retryable } = await db
    .from('provisioning_jobs')
    .select('id, job_type, payload, retry_count')
    .eq('status', 'failed')
    .lt('retry_count', 3)
    .order('created_at', { ascending: true })
    .limit(20);

  let retried = 0;
  for (const job of retryable ?? []) {
    await db
      .from('provisioning_jobs')
      .update({ status: 'pending', retry_count: (job.retry_count ?? 0) + 1, updated_at: new Date().toISOString() })
      .eq('id', job.id);
    retried++;
  }

  // Count pending backlog
  const { count: pending } = await db
    .from('provisioning_jobs')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'pending');

  logger.info('[cron/process-provisioning-jobs] Done', { timed_out: timedOut ?? 0, retried, pending_backlog: pending ?? 0 });
  return NextResponse.json({ ok: true, timed_out: timedOut ?? 0, retried, pending_backlog: pending ?? 0 });
});
