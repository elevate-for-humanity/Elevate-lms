/**
 * Enqueue helper for the LMS job_queue table.
 *
 * Separate from the existing provisioning_jobs queue (Stripe/license flows).
 * This queue handles certificate side effects: email, notifications, verification.
 *
 * Idempotency: the dedupe index on (type, payload->>'certificateId') silently
 * ignores duplicate enqueues for the same certificate. Safe to call on retry.
 */

import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// ── Job type registry ─────────────────────────────────────────────────────

export type LmsJobType = 'certificate_issued' | 'welcome_email';

export interface CertificateIssuedPayload {
  certificateId: string;
  learnerId: string;
  learnerEmail?: string;
  learnerName?: string;
  programId?: string;
  courseId?: string;
  credentialName?: string;
  certificateUrl?: string;
}

export interface WelcomeEmailPayload {
  enrollmentId: string;
  userId: string;
  email: string;
  firstName: string;
  programName: string;
  /** 'day1' = getting-started guide, 'day3' = check-in */
  step: 'day1' | 'day3';
}

export type LmsJobPayload = CertificateIssuedPayload | WelcomeEmailPayload;

// ── Enqueue ───────────────────────────────────────────────────────────────

const PG_UNIQUE_VIOLATION = '23505';

/**
 * Enqueue a background job into job_queue.
 *
 * Returns the job id on success, or the string 'duplicate' if the dedupe
 * index prevented a second enqueue for the same certificate.
 * Never throws on duplicate — that is expected behavior under retries.
 */
export async function enqueueJob(
  db: SupabaseClient,
  type: LmsJobType,
  payload: LmsJobPayload,
): Promise<string> {
  const { data, error } = await db
    .from('job_queue')
    .insert({ type, payload })
    .select('id')
    .single();

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      logger.info('Job already enqueued (dedupe)', {
        type,
        certificateId: (payload as CertificateIssuedPayload).certificateId,
      });
      return 'duplicate';
    }
    // Non-dedupe errors are logged but do not throw — a failed enqueue must
    // never cause the certificate issuance response to fail.
    logger.error('Failed to enqueue job (non-fatal)', error as Error, { type });
    return 'error';
  }

  logger.info('Job enqueued', { jobId: data.id, type });
  return data.id;
}
