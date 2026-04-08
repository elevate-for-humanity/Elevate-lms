/**
 * POST /api/jobs/process
 *
 * Background job processor for the LMS job_queue table.
 * Intended to be called by a cron job (Netlify scheduled function or external cron).
 *
 * Security: requires Authorization: Bearer <CRON_SECRET> header.
 *
 * Processing model:
 *   - Claims up to 25 pending jobs (run_after <= now)
 *   - Marks each 'processing' before executing to prevent double-claim
 *   - On success: status = 'completed', processed_at = now()
 *   - On failure: attempts++, run_after += 5 min, last_error stored
 *   - After 5 attempts: status = 'failed' (visible in admin/jobs)
 */


import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { CertificateIssuedPayload } from '@/lib/jobs/enqueue';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

const MAX_ATTEMPTS = 5;
const RETRY_DELAY_MINUTES = 5;
const BATCH_SIZE = 25;

// ── Auth ──────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    logger.error('CRON_SECRET not configured');
    return false;
  }
  const auth = req.headers.get('authorization') ?? '';
  return auth === `Bearer ${secret}`;
}

// ── Job handlers ──────────────────────────────────────────────────────────

async function handleCertificateIssued(
  db: ReturnType<typeof createAdminClient>,
  payload: CertificateIssuedPayload
): Promise<void> {
  const { certificateId, learnerId, learnerEmail, learnerName, credentialName, certificateUrl } = payload;

  // 1. Send credential email (if learner email is available)
  if (learnerEmail) {
    try {
      const { emailService } = await import('@/lib/notifications/email');
      await emailService.sendCertificateNotification(
        learnerEmail,
        learnerName ?? 'Learner',
        credentialName ?? 'Certificate of Completion',
        certificateUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/certificates/${certificateId}`
      );
      logger.info('Certificate email sent', { certificateId, email: learnerEmail });
    } catch (err) {
      // Re-throw so the job retries — email failure is a real failure
      throw new Error(`Email send failed: ${err instanceof Error ? err.message : 'unknown'}`);
    }
  }

  // 2. Create in-app notification
  const { error: notifError } = await db
    .from('notifications')
    .insert({
      user_id: learnerId,
      type: 'achievement',
      title: 'Certificate Issued!',
      message: `Your certificate for ${credentialName ?? 'your course'} is ready.`,
      action_url: certificateUrl ?? `/certificates/${certificateId}`,
    });

  if (notifError) {
    // Notification failure is non-fatal — log and continue
    logger.error('Notification insert failed (non-fatal)', notifError as Error, { certificateId });
  }

  logger.info('certificate_issued job completed', { certificateId });
}

// ── Main handler ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<NextResponse> {
  await hydrateProcessEnv();
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  const now = new Date().toISOString();

  // Claim a batch of pending jobs due for processing.
  // Mark them 'processing' immediately to prevent double-claim by concurrent runs.
  const { data: jobs, error: claimError } = await db
    .from('job_queue')
    .select('id, type, payload, attempts')
    .eq('status', 'pending')
    .lte('run_after', now)
    .order('created_at', { ascending: true })
    .limit(BATCH_SIZE);

  if (claimError) {
    logger.error('Failed to fetch jobs', claimError as Error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }

  if (!jobs || jobs.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  // Mark all claimed jobs as 'processing' before executing
  const jobIds = jobs.map((j) => j.id);
  await db
    .from('job_queue')
    .update({ status: 'processing' })
    .in('id', jobIds);

  const results = { completed: 0, failed: 0, retrying: 0 };

  for (const job of jobs) {
    try {
      if (job.type === 'certificate_issued') {
        await handleCertificateIssued(db, job.payload as CertificateIssuedPayload);
      } else {
        logger.error('Unknown job type', new Error(`Unknown job type: ${job.type}`), { jobId: job.id });
        throw new Error(`Unknown job type: ${job.type}`);
      }

      // Success
      await db
        .from('job_queue')
        .update({ status: 'completed', processed_at: new Date().toISOString() })
        .eq('id', job.id);

      results.completed++;

    } catch (err) {
      const attempts = (job.attempts as number) + 1;
      const message = err instanceof Error ? err.message : 'Unknown error';

      if (attempts > MAX_ATTEMPTS) {
        // Permanently failed — requires manual intervention via admin/jobs
        await db
          .from('job_queue')
          .update({ status: 'failed', attempts, last_error: message })
          .eq('id', job.id);

        logger.error('Job permanently failed', new Error(message), { jobId: job.id, type: job.type, attempts });
        results.failed++;
      } else {
        // Schedule retry with exponential-ish backoff
        const retryAfter = new Date(Date.now() + RETRY_DELAY_MINUTES * 60 * 1000 * attempts).toISOString();
        await db
          .from('job_queue')
          .update({ status: 'pending', attempts, run_after: retryAfter, last_error: message })
          .eq('id', job.id);

        logger.error('Job failed — will retry', new Error(message), { jobId: job.id, type: job.type, attempts, retryAfter });
        results.retrying++;
      }
    }
  }

  logger.info('Job batch processed', { ...results, total: jobs.length });
  return NextResponse.json({ ok: true, processed: jobs.length, ...results });
}
