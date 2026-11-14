/**
 * Auto-enrollment helper.
 *
 * Called at the point of MOU signing for partner shops (barbershop + cosmetology).
 * Partners don't pay tuition — enrollment is triggered by completing the MOU.
 *
 * Flow:
 *  1. Provision account (find or create profile, send login credentials email).
 *  2. Upsert a program_enrollments row (status=active, payment_status=waived).
 *  3. Link the enrollment back to the partner record.
 *
 * Returns the enrollment ID on success, or an error string on failure.
 */

import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { provisionAccount } from '@/lib/enrollment/provision-account';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface AutoEnrollInput {
  db: SupabaseClient;
  email: string;
  fullName: string;
  phone?: string | null;
  programId: string;
  programSlug: string;
  programName: string;
  courseId?: string | null;
  /** ID of the partners row to back-link (optional) */
  partnerId?: string | null;
  /** ID of the applications row to back-link (optional) */
  applicationId?: string | null;
  /** Funding source — defaults to 'waived' for partner completions */
  fundingSource?: string;
}

export interface AutoEnrollResult {
  enrollmentId: string | null;
  userId: string | null;
  isNewUser: boolean;
  error?: string;
}

export async function autoEnroll(input: AutoEnrollInput): Promise<AutoEnrollResult> {
  const {
    db,
    email,
    fullName,
    phone,
    programId,
    programSlug,
    programName,
    courseId,
    partnerId,
    applicationId,
    fundingSource = 'waived',
  } = input;

  const normalizedEmail = email.toLowerCase().trim();
  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl).trim();

  // ── Step 1: Provision account (find or create + send credentials email) ──
  const provision = await provisionAccount({
    db,
    email: normalizedEmail,
    fullName,
    phone,
    programName,
    programSlug,
    postLoginUrl: `${siteUrl}/apprentice`,
  });

  if (provision.error || !provision.userId) {
    return {
      enrollmentId: null,
      userId: null,
      isNewUser: provision.isNewUser,
      error: provision.error ?? 'Account provisioning failed',
    };
  }

  const userId = provision.userId;

  // ── Step 2: Upsert program_enrollments ───────────────────────────────────
  const enrollmentPayload: Record<string, unknown> = {
    user_id: userId,
    program_id: programId,
    program_slug: programSlug,
    status: 'active',
    payment_status: fundingSource === 'waived' ? 'waived' : 'pending',
    funding_source: fundingSource,
    enrollment_state: 'enrolled',
    next_required_action: 'ORIENTATION',
    email: normalizedEmail,
    full_name: fullName,
    phone: phone ?? null,
    enrolled_at: new Date().toISOString(),
  };

  if (courseId) enrollmentPayload.course_id = courseId;
  if (applicationId) enrollmentPayload.application_id = applicationId;

  const { data: enrollment, error: enrollErr } = await db
    .from('program_enrollments')
    .upsert(enrollmentPayload, { onConflict: 'user_id,program_id', ignoreDuplicates: false })
    .select('id')
    .maybeSingle();

  if (enrollErr || !enrollment?.id) {
    logger.error('[auto-enroll] program_enrollments upsert failed', undefined, {
      userId,
      programId,
      error: enrollErr?.message,
    });
    return {
      enrollmentId: null,
      userId,
      isNewUser: provision.isNewUser,
      error: `Enrollment upsert failed: ${enrollErr?.message}`,
    };
  }

  const enrollmentId = enrollment.id;

  // ── Step 3: Back-link enrollment to partner / application record ──────────
  if (partnerId) {
    await db
      .from('partners')
      .update({ enrollment_id: enrollmentId, updated_at: new Date().toISOString() })
      .eq('id', partnerId)
      .then(({ error }) => {
        if (error) logger.warn('[auto-enroll] partner back-link failed', { partnerId, error: error.message });
      });
  }

  if (applicationId) {
    await db
      .from('applications')
      .update({ enrollment_id: enrollmentId, status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', applicationId)
      .then(({ error }) => {
        if (error) logger.warn('[auto-enroll] application back-link failed', { applicationId, error: error.message });
      });
  }

  logger.info('[auto-enroll] Enrollment complete', {
    userId,
    programId,
    enrollmentId,
    isNewUser: provision.isNewUser,
  });
  return { enrollmentId, userId, isNewUser: provision.isNewUser };
}
