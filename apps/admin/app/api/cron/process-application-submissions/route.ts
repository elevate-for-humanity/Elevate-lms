/**
 * Process application_submitted jobs from the job queue.
 * 
 * This cron job handles post-submission automation:
 * - Creates admission checklist
 * - Generates tasks for recruiters
 * - Triggers PARIS AI analysis
 * - Updates CRM leads
 * 
 * Runs every 5 minutes via GitHub Actions cron or Supabase pg_cron.
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { setAuditContext } from '@/lib/audit-context';
import { processApplicationSubmitted, type ApplicationSubmittedPayload } from '@/lib/admissions/process-application-submitted';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

async function _GET(req: NextRequest) {
  // Scheduler-only endpoint: no anonymous applicant/CRM processing.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = await requireAdminClient();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    await setAuditContext(db, { systemActor: 'cron:process-application-submissions' });

    const now = new Date().toISOString();
    // Include only overdue processing leases: a previous worker may have
    // crashed, but a current owner must never be interrupted.
    const { data: jobs, error: jobsError } = await db
      .from('job_queue')
      .select('*')
      .eq('type', 'application_submitted')
      .in('status', ['pending', 'processing'])
      .lte('run_after', now)
      .order('created_at', { ascending: true })
      .limit(10);

    if (jobsError) {
      logger.error('[process-application-submissions] Failed to fetch jobs', new Error(jobsError.message));
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs?.length) {
      return NextResponse.json({ processed: 0, failed: 0, message: 'No due jobs' });
    }

    let processed = 0;
    let failed = 0;
    let skipped = 0;

    for (const job of jobs) {
      const previousAttempts = Number(job.attempts ?? 0);
      const maxAttempts = Number(job.max_attempts ?? 3);
      if (previousAttempts >= maxAttempts) {
        // Attempt budgets are durable. Do not reset or replay exhausted jobs.
        skipped++;
        continue;
      }

      const attempt = previousAttempts + 1;
      const leaseUntil = new Date(Date.now() + 3 * 60 * 1000).toISOString();
      const { data: claimed, error: claimError } = await db.from('job_queue')
        .update({ status: 'processing', attempts: attempt, run_after: leaseUntil })
        .eq('id', job.id)
        .eq('status', job.status)
        .eq('attempts', previousAttempts)
        .lte('run_after', now)
        .select('id')
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) {
        skipped++; // Another execution owns this job.
        continue;
      }

      try {
        const payload = job.payload as ApplicationSubmittedPayload;
        if (!payload?.applicationId || !payload?.email) {
          throw new Error('Application submission job lacks canonical identity fields');
        }
        const result = await processApplicationSubmitted(db, payload);
        if (!result.success) throw Object.assign(new Error(result.error || 'ADMISSIONS_PROCESSOR_UNAVAILABLE'), { retryable: result.retryable });

        const { data: completed, error: completeError } = await db.from('job_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            error: null,
            last_error: null,
          })
          .eq('id', job.id).eq('status', 'processing').eq('attempts', attempt)
          .select('id').maybeSingle();
        if (completeError) throw completeError;
        if (!completed) throw new Error('Application job completion lease lost');
        processed++;
      } catch (jobError) {
        const message = jobError instanceof Error ? jobError.message : String(jobError);
        // Do not log applicant email or full name. Retain the cumulative attempt
        // count and expose terminal failure rather than fabricate completion.
        logger.error('[process-application-submissions] Job failed', undefined, {
          jobId: job.id, attempt, maxAttempts,
        });
        const exhausted = attempt >= maxAttempts ||
          (jobError instanceof Error && 'retryable' in jobError && jobError.retryable === false);
        const { error: failureUpdateError } = await db.from('job_queue')
          .update({
            status: exhausted ? 'failed' : 'pending',
            run_after: exhausted ? leaseUntil : new Date(Date.now() + attempt * 5 * 60 * 1000).toISOString(),
            completed_at: exhausted ? new Date().toISOString() : null,
            last_error: message,
            error: message,
          })
          .eq('id', job.id).eq('status', 'processing').eq('attempts', attempt);
        if (failureUpdateError) throw failureUpdateError;
        failed++;
      }
    }

    logger.info('[process-application-submissions] Batch complete', { processed, failed, skipped, total: jobs.length });

    return NextResponse.json({ processed, failed, skipped, total: jobs.length }, { status: failed ? 503 : 200 });
  } catch (error) {
    logger.error('[process-application-submissions] Cron failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}

export const GET = _GET;
