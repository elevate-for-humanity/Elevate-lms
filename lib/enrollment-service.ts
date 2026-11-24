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

import type { SupabaseClient } from '@/lib/supabase';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { ensureDigitalBinder } from '@/lib/enrollment/ensure-digital-binder';
import { paidAccessGrantFields } from '@/lib/enrollment/paid-access.mjs';

export type EnrollmentInput = {
  userId: string;
  programId: string;
  programSlug?: string;
  courseId?: string;
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
 * Idempotent post-payment access repair shared by every paid learner path.
 * Dashboard access is data-driven from the active profile/enrollment; a
 * separate dashboard row is intentionally not created.
 */
export async function ensurePaidEnrollmentAccess(
  supabase: SupabaseClient,
  userId: string,
  enrollmentId: string,
): Promise<void> {
  const now = new Date().toISOString();
  // Read the row first so the access fields are only stamped when the row
  // would then pass the approved-paid login gate (lib/learner/
  // approved-paid-admission.mjs): a verified self-pay payment (paid +
  // payment_reference) or an already-approved row. Deposit-paid, unpaid,
  // agency-pending and state-funded-without-approval rows keep the base
  // activation below and stay grantable through the admin grant-access
  // route — they must not be stamped as if access were granted.
  const { data: enrollmentRow, error: lookupError } = await supabase
    .from('program_enrollments')
    .select('status,payment_status,payment_reference,funding_source,funding_verified,eligibility_status,self_pay_application_verified_at,approved_at,approved_by,access_granted_at,access_status,revoked_at,cancelled_at,suspended_at,refunded_at')
    .eq('id', enrollmentId)
    .eq('user_id', userId)
    .maybeSingle();
  if (lookupError) throw new Error(`ENROLLMENT_ACTIVATION_FAILED: ${lookupError.message}`);
  // The base update below moves the row to active, so evaluate the gate
  // against the post-update status.
  const accessPatch = enrollmentRow
    ? paidAccessGrantFields({ ...enrollmentRow, status: 'active' }, now)
    : null;
  const [{ error: enrollmentError }, { error: profileError }, binder] = await Promise.all([
    supabase.from('program_enrollments').update({
      status: 'active',
      enrollment_state: 'enrolled',
      enrollment_confirmed_at: now,
      updated_at: now,
      ...(accessPatch ?? {}),
    }).eq('id', enrollmentId).eq('user_id', userId),
    supabase.from('profiles').update({
      enrollment_status: 'active',
      portal_type: 'apprentice',
    }).eq('id', userId),
    ensureDigitalBinder({ db: supabase, userId, enrollmentId }),
  ]);

  if (enrollmentError) throw new Error(`ENROLLMENT_ACTIVATION_FAILED: ${enrollmentError.message}`);
  if (profileError) throw new Error(`PROFILE_ACTIVATION_FAILED: ${profileError.message}`);
  if (!binder.binderId) throw new Error('DIGITAL_BINDER_PROVISIONING_FAILED');
}

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
    courseId,
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

  // A verified deposit is still a successful payment and grants enrollment
  // access. Billing status separately records that installments remain.
  const resolvedStatus = status ?? (amountPaidCents > 0 ? 'active' : isDeposit ? 'deposit_paid' : 'active');
  const resolvedPaymentStatus =
    paymentStatus ?? (isDeposit ? 'deposit_paid' : amountPaidCents === 0 ? 'waived' : 'paid');
  const resolvedFundingSource = normalizeFundingSource(fundingSource);

  try {
    const { data: existing } = await supabase
      .from('program_enrollments')
      .select('id, status, access_granted_at, self_pay_application_verified_at')
      .eq('user_id', userId)
      .eq('program_id', programId)
      .maybeSingle();

    if (existing && TERMINAL_STATUSES.has(existing.status)) {
      // Webhooks are retried and manual payments can be reconciled after an
      // enrollment exists. Repair the binder on every verified payment instead
      // of assuming the first provisioning attempt completed every side effect.
      await ensurePaidEnrollmentAccess(supabase, userId, existing.id);
      logger.info(
        `[enrollment-service] Already ${existing.status}: program ${programId} for user ${userId}`,
      );
      return { id: existing.id, action: 'already_active' };
    }

    const now = new Date().toISOString();

    // Record the payment reference on the row: the approved-paid login gate
    // requires payment_reference for a self-pay row, and the previous code
    // only kept the Stripe session/intent in their own columns, so a
    // paid self-pay row still failed the gate.
    const paymentReference = stripeCheckoutSessionId ?? stripePaymentIntentId ?? null;
    // A verified paid self-pay enrollment (paid + reference) gets the
    // access fields in the same write, so the learner is not bounced to
    // /lms/access-pending. Deposit-paid rows deliberately get none: the
    // gate treats a deposit as not-yet-paid, and a deposit must not be
    // stamped as a verified self-pay payment. Existing grant timestamps
    // are preserved on retry/update so a repair is never undone.
    const isVerifiedPaidSelfPay =
      resolvedFundingSource === 'self_pay' &&
      ['paid', 'paid_in_full'].includes(resolvedPaymentStatus) &&
      Boolean(paymentReference);
    const accessFields = isVerifiedPaidSelfPay
      ? {
          access_status: 'active',
          access_granted_at: existing?.access_granted_at ?? now,
          self_pay_application_verified_at: existing?.self_pay_application_verified_at ?? now,
        }
      : {};

    const payload: Record<string, unknown> = {
      user_id: userId,
      program_id: programId,
      ...(programSlug ? { program_slug: programSlug } : {}),
      ...(courseId ? { course_id: courseId } : {}),
      funding_source: resolvedFundingSource,
      status: resolvedStatus,
      payment_status: resolvedPaymentStatus,
      enrollment_state: enrollmentState,
      enrollment_confirmed_at: now,
      next_required_action: nextRequiredAction,
      stripe_checkout_session_id: stripeCheckoutSessionId ?? null,
      stripe_payment_intent_id: stripePaymentIntentId ?? null,
      ...(paymentReference ? { payment_reference: paymentReference } : {}),
      amount_paid_cents: amountPaidCents,
      updated_at: now,
      ...(email ? { email } : {}),
      ...(fullName ? { full_name: fullName } : {}),
      ...(!existing ? { enrolled_at: now } : {}),
      ...accessFields,
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

    // Idempotently activate dashboard routing and create/repair the binder for
    // every verified paid enrollment, including deposits and webhook retries.
    if (userId) {
      try {
        await ensurePaidEnrollmentAccess(supabase, userId, enrollment.id);
        logger.info('[enrollment-service] Paid learner access ready', { enrollmentId: enrollment.id, userId });
      } catch (binderError) {
        // Payment is durable; surface provisioning failure for retry/repair.
        logger.warn('[enrollment-service] Paid learner access repair failed', binderError);
      }
    }

    // Notify program holder when a new HVAC student enrolls
    const HVAC_PROGRAM_ID = '4226f7f6-fbc1-44b5-83e8-b12ea149e4c7';
    if (action === 'created' && programId === HVAC_PROGRAM_ID) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? PLATFORM_DEFAULTS.siteUrl;
      const internalSecret = process.env.INTERNAL_API_SECRET ?? process.env.CRON_SECRET;
      if (internalSecret) {
        fetch(`${baseUrl}/api/program-holder/new-student-notify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-internal-secret': internalSecret },
          body: JSON.stringify({
            studentName: fullName ?? null,
            studentEmail: email ?? null,
            studentPhone: null,
            programName: 'HVAC EPA 608 Certification',
          }),
        }).catch(() => {}); // fire-and-forget — don't block enrollment
      } else {
        logger.warn('[enrollment-service] Program-holder notification skipped: internal secret missing');
      }
    }

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
/**
 * Link barber_subscriptions rows that have user_id = null but match the given
 * email via customer_email. Direct reconciliation — does not depend on
 * program_enrollments.barber_sub_id being populated.
 * Safe to call multiple times.
 */
export async function linkOrphanedBarberSubscriptions(
  supabase: SupabaseClient,
  email: string,
): Promise<{ linked: number }> {
  if (!email) return { linked: 0 };

  const normalizedEmail = email.toLowerCase().trim();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!profile?.id) return { linked: 0 };

  const { data, error } = await supabase
    .from('barber_subscriptions')
    .update({ user_id: profile.id })
    .ilike('customer_email', normalizedEmail)
    .is('user_id', null)
    .select('id');

  if (error) {
    logger.error('[enrollment-service] linkOrphanedBarberSubscriptions failed:', error.message);
    return { linked: 0 };
  }

  const linked = data?.length ?? 0;
  if (linked > 0) {
    logger.info(
      `[enrollment-service] Linked ${linked} orphaned barber_subscription(s) for ${normalizedEmail}`,
    );
  }
  return { linked };
}

/**
 * Link applications rows that have user_id = null but match the given email
 * to the authenticated user's profile. Safe to call multiple times.
 */
export async function linkOrphanedApplications(
  supabase: SupabaseClient,
  email: string,
): Promise<{ linked: number }> {
  if (!email) return { linked: 0 };

  const normalizedEmail = email.toLowerCase().trim();

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', normalizedEmail)
    .maybeSingle();

  if (!profile?.id) return { linked: 0 };

  const { data, error } = await supabase
    .from('applications')
    .update({ user_id: profile.id })
    .ilike('email', normalizedEmail)
    .is('user_id', null)
    .select('id');

  if (error) {
    logger.error('[enrollment-service] linkOrphanedApplications failed:', error.message);
    return { linked: 0 };
  }

  const linked = data?.length ?? 0;
  if (linked > 0) {
    logger.info(
      `[enrollment-service] Linked ${linked} orphaned application(s) for ${normalizedEmail}`,
    );
  }
  return { linked };
}

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
    .maybeSingle();

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
      run(
        `SELECT COUNT(*) AS cnt FROM (SELECT user_id, program_id, COUNT(*) AS c FROM program_enrollments GROUP BY user_id, program_id HAVING COUNT(*) > 1) d`,
      ),
      run(
        `SELECT COUNT(*) AS cnt FROM (SELECT stripe_checkout_session_id, COUNT(*) AS c FROM program_enrollments WHERE stripe_checkout_session_id IS NOT NULL GROUP BY stripe_checkout_session_id HAVING COUNT(*) > 1) d`,
      ),
      run(
        `SELECT COUNT(*) AS cnt FROM (SELECT stripe_payment_intent_id, COUNT(*) AS c FROM program_enrollments WHERE stripe_payment_intent_id IS NOT NULL GROUP BY stripe_payment_intent_id HAVING COUNT(*) > 1) d`,
      ),
    ]);

  return { duplicateUserProgram, duplicateCheckoutSessions, duplicatePaymentIntents };
}
