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

function databaseCode(error: unknown): string | null {
  const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
  return /^(?:[0-9A-Z]{5}|PGRST[0-9]{3})$/.test(code) ? code : null;
}

function queueFailureCode(stage: string, error: unknown): string {
  return `ADMISSIONS_QUEUE_${stage}_${databaseCode(error) || 'UNAVAILABLE'}`;
}

function retryableQueueFailure(error: unknown): boolean {
  const code = databaseCode(error);
  return !code || /^(08|40|53)/.test(code) ||
    ['55P03', '57014', '57P01', '57P02', '57P03', 'PGRST000', 'PGRST001', 'PGRST002', 'PGRST003'].includes(code);
}

async function _GET(req: NextRequest) {
  // Scheduler-only endpoint: no anonymous applicant/CRM processing.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || req.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let batchStage = 'DATABASE';
  try {
    const db = await requireAdminClient();
    if (!db) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 503 });
    }
    batchStage = 'AUDIT';
    await setAuditContext(db, { systemActor: 'cron:process-application-submissions' });

    const now = new Date().toISOString();
    // Include only overdue processing leases: a previous worker may have
    // crashed, but a current owner must never be interrupted.
    batchStage = 'FETCH';
    const { data: jobs, error: jobsError } = await db
      .from('job_queue')
      .select('*')
      .eq('type', 'application_submitted')
      .in('status', ['pending', 'processing'])
      .lte('run_after', now)
      .order('created_at', { ascending: true })
      .order('id', { ascending: true })
      .limit(50);

    if (jobsError) {
      logger.error('[process-application-submissions] Failed to fetch jobs', undefined, {
        code: queueFailureCode('FETCH', jobsError),
      });
      return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
    }

    if (!jobs?.length) {
      return NextResponse.json({ processed: 0, failed: 0, message: 'No due jobs' });
    }

    let processed = 0;
    let failed = 0;
    let skipped = 0;
    let claims = 0;
    let terminalized = 0;

    for (const job of jobs) {
      const previousAttempts = Number(job.attempts ?? 0);
      const maxAttempts = Number(job.max_attempts ?? 3);
      if (previousAttempts >= maxAttempts) {
        // Exhausted due rows must leave the eligible prefix or they starve
        // later submissions. Retain their budget and original error evidence.
        // An owner changing the lease or budget wins this snapshot CAS.
        batchStage = 'TERMINALIZE';
        const { data: stopped, error: stopError } = await db.from('job_queue')
          .update({
            status: 'failed',
            completed_at: job.completed_at || now,
            last_error: job.last_error || 'ADMISSIONS_ATTEMPT_BUDGET_EXHAUSTED',
            error: job.error || 'ADMISSIONS_ATTEMPT_BUDGET_EXHAUSTED',
          })
          .eq('id', job.id).eq('status', job.status)
          .eq('attempts', previousAttempts).eq('max_attempts', maxAttempts)
          .eq('run_after', job.run_after).lte('run_after', now)
          .select('id').maybeSingle();
        if (stopError) throw stopError;
        if (stopped) { failed++; terminalized++; } else skipped++;
        continue;
      }
      // Scan beyond an exhausted prefix without increasing the processing
      // budget or claiming work that this invocation cannot complete.
      if (claims >= 10) { skipped++; continue; }

      const attempt = previousAttempts + 1;
      const leaseUntil = new Date(Date.now() + 3 * 60 * 1000).toISOString();
      batchStage = 'CLAIM';
      const { data: claimed, error: claimError } = await db.from('job_queue')
        .update({ status: 'processing', attempts: attempt, run_after: leaseUntil })
        .eq('id', job.id)
        .eq('status', job.status)
        .eq('attempts', previousAttempts)
        .eq('max_attempts', maxAttempts)
        .eq('run_after', job.run_after)
        .lte('run_after', now)
        .select('id')
        .maybeSingle();
      if (claimError) throw claimError;
      if (!claimed) {
        skipped++; // Another execution owns this job.
        continue;
      }
      claims++;

      let jobStage = 'PAYLOAD';
      let processorFailure: { code: string; retryable: boolean } | null = null;
      try {
        const payload = job.payload as ApplicationSubmittedPayload;
        if (typeof payload?.applicationId !== 'string' || !payload.applicationId ||
            typeof payload.email !== 'string' || !payload.email) {
          throw new Error('Application submission job lacks canonical identity fields');
        }
        jobStage = 'PROCESSOR';
        const result = await processApplicationSubmitted(db, payload);
        if (!result.success) {
          processorFailure = {
            code: /^ADMISSIONS_[A-Z0-9_]{1,100}$/.test(result.error || '') ? result.error! : 'ADMISSIONS_PROCESSOR_UNAVAILABLE',
            retryable: result.retryable !== false,
          };
          throw new Error('ADMISSIONS_PROCESSOR_FAILED');
        }

        jobStage = 'COMPLETE';
        const { data: completed, error: completeError } = await db.from('job_queue')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            error: null,
            last_error: null,
          })
          .eq('id', job.id).eq('status', 'processing').eq('attempts', attempt).eq('run_after', leaseUntil)
          .select('id').maybeSingle();
        if (completeError) throw completeError;
        if (!completed) throw new Error('Application job completion lease lost');
        processed++;
      } catch (jobError) {
        const code = processorFailure?.code || (jobStage === 'PAYLOAD'
          ? 'ADMISSIONS_QUEUE_PAYLOAD_INVALID' : queueFailureCode(jobStage, jobError));
        // Do not log applicant email or full name. Retain the cumulative attempt
        // count and expose terminal failure rather than fabricate completion.
        logger.error('[process-application-submissions] Job failed', undefined, {
          jobId: job.id, attempt, maxAttempts, code,
        });
        const retryable = processorFailure?.retryable ?? (jobStage !== 'PAYLOAD' && retryableQueueFailure(jobError));
        const exhausted = attempt >= maxAttempts || !retryable;
        batchStage = 'FAILURE_UPDATE';
        const { data: recordedFailure, error: failureUpdateError } = await db.from('job_queue')
          .update({
            status: exhausted ? 'failed' : 'pending',
            run_after: exhausted ? leaseUntil : new Date(Date.now() + attempt * 5 * 60 * 1000).toISOString(),
            completed_at: exhausted ? new Date().toISOString() : null,
            last_error: code,
            error: code,
          })
          .eq('id', job.id).eq('status', 'processing').eq('attempts', attempt).eq('run_after', leaseUntil)
          .select('id').maybeSingle();
        if (failureUpdateError) throw failureUpdateError;
        if (!recordedFailure) skipped++; // A newer owner retains its state.
        failed++;
      }
    }

    logger.info('[process-application-submissions] Batch complete', { processed, failed, skipped, terminalized, claims, total: jobs.length });

    return NextResponse.json({ processed, failed, skipped, terminalized, claims, total: jobs.length }, { status: failed ? 503 : 200 });
  } catch (error) {
    logger.error('[process-application-submissions] Cron failed', undefined, {
      stage: batchStage, code: queueFailureCode(batchStage, error),
    });
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}

export const GET = _GET;
