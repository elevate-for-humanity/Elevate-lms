import { logger } from '@/lib/logger';
/**
 * Canonical enrollment service.
 * Single write path to program_enrollments.
 *
 * Every route that creates or updates an enrollment MUST call
 * createOrUpdateEnrollment(). No direct .insert() or .upsert()
 * on program_enrollments anywhere else in the codebase.
 *
 * Idempotent on (student_id, program_slug).
 * Safe against Stripe retries, double-submissions, and race conditions.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type EnrollmentInput = {
  studentId: string;
  programId?: string;
  programSlug: string;
  fundingSource: string;
  status?: string;
  paymentStatus?: string;
  isDeposit?: boolean;
  amountPaidCents?: number;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  enrollmentState?: string;
  nextRequiredAction?: string;
};

export type EnrollmentResult = {
  id: string;
  action: 'created' | 'updated' | 'already_active';
  error?: string;
};

/**
 * Create or update a program enrollment.
 * Uses UPSERT on (student_id, program_slug).
 *
 * - If no enrollment exists: creates one.
 * - If enrollment exists and is not ACTIVE: updates it.
 * - If enrollment exists and is ACTIVE: returns it unchanged.
 * - Never throws. Returns { error } on failure.
 */
export async function createOrUpdateEnrollment(
  supabase: SupabaseClient,
  input: EnrollmentInput
): Promise<EnrollmentResult> {
  const {
    studentId,
    programId,
    programSlug,
    fundingSource,
    isDeposit = false,
    amountPaidCents = 0,
    stripeCheckoutSessionId,
    stripePaymentIntentId,
    status,
    paymentStatus,
    enrollmentState = 'confirmed',
    nextRequiredAction = 'ORIENTATION',
  } = input;

  const resolvedStatus = status || (isDeposit ? 'DEPOSIT_PAID' : 'ACTIVE');
  const resolvedPaymentStatus = paymentStatus || (isDeposit ? 'DEPOSIT_PAID' : (amountPaidCents === 0 ? 'WAIVED' : 'PAID'));

  try {
    // Check for existing enrollment first (for action reporting)
    const { data: existing } = await supabase
      .from('program_enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('program_slug', programSlug)
      .maybeSingle();

    if (existing?.status === 'ACTIVE' || existing?.status === 'COMPLETED') {
      // Already active/completed — don't downgrade, just return
      logger.info(`[enrollment-service] Already ${existing.status}: ${programSlug} for ${studentId}`);
      return { id: existing.id, action: 'already_active' };
    }

    const now = new Date().toISOString();

    const { data: enrollment, error } = await supabase
      .from('program_enrollments')
      .upsert({
        student_id: studentId,
        program_id: programId || programSlug,
        program_slug: programSlug,
        funding_source: fundingSource,
        status: resolvedStatus,
        payment_status: resolvedPaymentStatus,
        enrollment_state: enrollmentState,
        enrollment_confirmed_at: now,
        next_required_action: nextRequiredAction,
        stripe_checkout_session_id: stripeCheckoutSessionId || null,
        stripe_payment_intent_id: stripePaymentIntentId || null,
        amount_paid_cents: amountPaidCents,
        enrolled_at: existing ? undefined : now,
        updated_at: now,
      }, {
        onConflict: 'student_id,program_slug',
        ignoreDuplicates: false,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('[enrollment-service] Upsert failed:', error);
      return { id: '', action: 'created', error: 'Operation failed' };
    }

    const action = existing ? 'updated' : 'created';
    logger.info(`[enrollment-service] ${action}: ${enrollment.id} (${programSlug} for ${studentId})`);
    return { id: enrollment.id, action };
  } catch (err) {
    const message = 'Operation failed';
    logger.error('[enrollment-service] Unexpected error:', message);
    return { id: '', action: 'created', error: message };
  }
}

/**
 * Integrity check: returns counts of any duplicate enrollments.
 * All counts should be 0 in a healthy system.
 */
export async function checkEnrollmentIntegrity(supabase: SupabaseClient): Promise<{
  duplicateStudentProgram: number;
  duplicateCheckoutSessions: number;
  duplicatePaymentIntents: number;
}> {
  const { data: dupStudentProgram } = await supabase.rpc('exec_sql', {
    query: `
      SELECT COUNT(*) as cnt FROM (
        SELECT student_id, program_slug, COUNT(*) as c
        FROM program_enrollments
        GROUP BY student_id, program_slug
        HAVING COUNT(*) > 1
      ) dupes
    `
  });

  const { data: dupSessions } = await supabase.rpc('exec_sql', {
    query: `
      SELECT COUNT(*) as cnt FROM (
        SELECT stripe_checkout_session_id, COUNT(*) as c
        FROM program_enrollments
        WHERE stripe_checkout_session_id IS NOT NULL
        GROUP BY stripe_checkout_session_id
        HAVING COUNT(*) > 1
      ) dupes
    `
  });

  const { data: dupIntents } = await supabase.rpc('exec_sql', {
    query: `
      SELECT COUNT(*) as cnt FROM (
        SELECT stripe_payment_intent_id, COUNT(*) as c
        FROM program_enrollments
        WHERE stripe_payment_intent_id IS NOT NULL
        GROUP BY stripe_payment_intent_id
        HAVING COUNT(*) > 1
      ) dupes
    `
  });

  return {
    duplicateStudentProgram: parseInt(dupStudentProgram?.[0]?.cnt || '0'),
    duplicateCheckoutSessions: parseInt(dupSessions?.[0]?.cnt || '0'),
    duplicatePaymentIntents: parseInt(dupIntents?.[0]?.cnt || '0'),
  };
}
