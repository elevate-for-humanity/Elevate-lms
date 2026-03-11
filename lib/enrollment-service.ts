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
 * - If enrollment exists and is not active: updates it.
 * - If enrollment exists and is active: returns it unchanged.
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

  const resolvedStatus = status || (isDeposit ? 'deposit_paid' : 'active');
  const resolvedPaymentStatus = paymentStatus || (isDeposit ? 'deposit_paid' : (amountPaidCents === 0 ? 'waived' : 'paid'));

  try {
    // Check for existing enrollment first (for action reporting)
    const { data: existing } = await supabase
      .from('program_enrollments')
      .select('id, status')
      .eq('student_id', studentId)
      .eq('program_slug', programSlug)
      .maybeSingle();

    if (existing?.status === 'active' || existing?.status === 'completed') {
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
 * Link any program_enrollments rows that have user_id = null but match
 * a verified profile by email. Called after payment webhooks to close
 * the gap where a user pays after their account is already verified
 * (so auth/confirm never fires again).
 *
 * Safe to call multiple times — only touches null user_id rows.
 */
export async function linkOrphanedEnrollments(
  supabase: SupabaseClient,
  email: string
): Promise<{ linked: number }> {
  if (!email) return { linked: 0 };

  const normalizedEmail = email.toLowerCase().trim();

  // Find verified profile for this email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .single();

  if (!profile?.id) return { linked: 0 };

  // Link any orphaned rows for this email
  const { data, error } = await supabase
    .from('program_enrollments')
    .update({ user_id: profile.id })
    .ilike('email', normalizedEmail)
    .is('user_id', null)
    .select('id');

  if (error) {
    logger.error('[enrollment-service] linkOrphanedEnrollments failed:', error.message);
    return { linked: 0 };
  }

  const linked = data?.length ?? 0;
  if (linked > 0) {
    logger.info(`[enrollment-service] Linked ${linked} orphaned enrollment(s) for ${normalizedEmail}`);
  }
  return { linked };
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
