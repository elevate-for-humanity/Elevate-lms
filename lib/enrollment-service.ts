import { logger } from '@/lib/logger';
/**
 * Canonical enrollment service.
 * Single write path to program_enrollments.
 *
 * Every route that creates or updates an enrollment MUST call
 * createOrUpdateEnrollment(). No direct .insert() or .upsert()
 * on program_enrollments anywhere else in the codebase.
 *
 * Idempotent on (user_id, program_id) — the live unique constraint.
 * Safe against Stripe retries, double-submissions, and race conditions.
 *
 * Column names match the live DB schema:
 *   user_id        (not student_id — that column does not exist)
 *   program_id     (UUID — unique constraint partner with user_id)
 *   program_slug   (text — secondary lookup field)
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type EnrollmentInput = {
  userId: string;
  programId: string;
  programSlug?: string;
  fundingSource?: string;
  status?: string;
  paymentStatus?: string;
  isDeposit?: boolean;
  amountPaidCents?: number;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  enrollmentState?: string;
  nextRequiredAction?: string;
  email?: string;
  fullName?: string;
};

export type EnrollmentResult = {
  id: string;
  action: 'created' | 'updated' | 'already_active';
  error?: string;
};

const TERMINAL_STATUSES = new Set(['active', 'completed']);

/**
 * Normalise funding_source to the canonical set of values.
 * Prevents 'self-pay' / 'self_pay' / 'Funded' drift across routes.
 */
export function normalizeFundingSource(value?: string | null): string {
  const v = (value ?? '').trim().toLowerCase();
  if (['self-pay', 'self_pay', 'self pay'].includes(v)) return 'self_pay';
  if (['funded', 'funded_program', 'funded program'].includes(v)) return 'funded';
  if (v === 'wioa') return 'wioa';
  if (v === 'jri') return 'jri';
  return v || 'unknown';
}

/**
 * Create or update a program enrollment.
 * Uses UPSERT on (user_id, program_id).
 *
 * - No enrollment exists → creates one.
 * - Enrollment exists and is not terminal → updates it.
 * - Enrollment exists and is active/completed → returns it unchanged.
 * - Never throws. Returns { error } on failure.
 */
export async function createOrUpdateEnrollment(
  supabase: SupabaseClient,
  input: EnrollmentInput,
): Promise<EnrollmentResult> {
  const {
    userId,
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
    email,
    fullName,
  } = input;

  const resolvedStatus =
    status ?? (isDeposit ? 'deposit_paid' : 'active');
  const resolvedPaymentStatus =
    paymentStatus ??
    (isDeposit ? 'deposit_paid' : amountPaidCents === 0 ? 'waived' : 'paid');
  const resolvedFundingSource = normalizeFundingSource(fundingSource);

  try {
    const { data: existing } = await supabase
      .from('program_enrollments')
      .select('id, status')
      .eq('user_id', userId)
      .eq('program_id', programId)
      .maybeSingle();

    if (existing && TERMINAL_STATUSES.has(existing.status)) {
      logger.info(
        `[enrollment-service] Already ${existing.status}: program ${programId} for user ${userId}`,
      );
      return { id: existing.id, action: 'already_active' };
    }

    const now = new Date().toISOString();

    const payload: Record<string, unknown> = {
      user_id: userId,
      program_id: programId,
      ...(programSlug ? { program_slug: programSlug } : {}),
      funding_source: resolvedFundingSource,
      status: resolvedStatus,
      payment_status: resolvedPaymentStatus,
      enrollment_state: enrollmentState,
      enrollment_confirmed_at: now,
      next_required_action: nextRequiredAction,
      stripe_checkout_session_id: stripeCheckoutSessionId ?? null,
      stripe_payment_intent_id: stripePaymentIntentId ?? null,
      amount_paid_cents: amountPaidCents,
      updated_at: now,
      ...(email ? { email } : {}),
      ...(fullName ? { full_name: fullName } : {}),
      ...(!existing ? { enrolled_at: now } : {}),
    };

    const { data: enrollment, error } = await supabase
      .from('program_enrollments')
      .upsert(payload, {
        onConflict: 'user_id,program_id',
        ignoreDuplicates: false,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('[enrollment-service] Upsert failed:', error.message);
      return { id: '', action: 'created', error: 'ENROLLMENT_UPSERT_FAILED' };
    }

    const action = existing ? 'updated' : 'created';
    logger.info(
      `[enrollment-service] ${action}: ${enrollment.id} (program ${programId} for user ${userId})`,
    );
    return { id: enrollment.id, action };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[enrollment-service] Unexpected error:', msg);
    return { id: '', action: 'created', error: 'ENROLLMENT_UNEXPECTED_ERROR' };
  }
}

/**
 * Link program_enrollments rows that have user_id = null but match
 * a verified profile by email. Called after payment webhooks to close
 * the gap where a user pays before their account is confirmed.
 *
 * Safe to call multiple times — only touches null user_id rows.
 */
export async function linkOrphanedEnrollments(
  supabase: SupabaseClient,
  email: string,
): Promise<{ linked: number }> {
  if (!email) return { linked: 0 };

  const normalizedEmail = email.toLowerCase().trim();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .single();

  if (!profile?.id) return { linked: 0 };

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
    logger.info(
      `[enrollment-service] Linked ${linked} orphaned enrollment(s) for ${normalizedEmail}`,
    );
  }
  return { linked };
}

/**
 * Integrity check — all counts should be 0 in a healthy system.
 */
export async function checkEnrollmentIntegrity(supabase: SupabaseClient): Promise<{
  duplicateUserProgram: number;
  duplicateCheckoutSessions: number;
  duplicatePaymentIntents: number;
}> {
  const run = async (query: string): Promise<number> => {
    const { data, error } = await supabase.rpc('exec_sql', { query });
    if (error) return -1;
    return parseInt(data?.[0]?.cnt ?? '0', 10);
  };

  const [duplicateUserProgram, duplicateCheckoutSessions, duplicatePaymentIntents] =
    await Promise.all([
      run(`SELECT COUNT(*) AS cnt FROM (SELECT user_id, program_id, COUNT(*) AS c FROM program_enrollments GROUP BY user_id, program_id HAVING COUNT(*) > 1) d`),
      run(`SELECT COUNT(*) AS cnt FROM (SELECT stripe_checkout_session_id, COUNT(*) AS c FROM program_enrollments WHERE stripe_checkout_session_id IS NOT NULL GROUP BY stripe_checkout_session_id HAVING COUNT(*) > 1) d`),
      run(`SELECT COUNT(*) AS cnt FROM (SELECT stripe_payment_intent_id, COUNT(*) AS c FROM program_enrollments WHERE stripe_payment_intent_id IS NOT NULL GROUP BY stripe_payment_intent_id HAVING COUNT(*) > 1) d`),
    ]);

  return { duplicateUserProgram, duplicateCheckoutSessions, duplicatePaymentIntents };
}
