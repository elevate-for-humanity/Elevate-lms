import type { SupabaseClient } from '@supabase/supabase-js';
import { BARBER_COURSE_ID, BARBER_PROGRAM_SLUG } from '@/lib/barber/constants';
import { PRESTIGE_ELEVATION_BARBER_CURRICULUM } from '@/lib/barber/branding';
import { logger } from '@/lib/logger';
import { paidAccessGrantFields } from '@/lib/enrollment/paid-access.mjs';

export async function ensureBarberLmsEnrollment(
  db: SupabaseClient,
  userId: string,
  options?: { grantAccess?: boolean },
): Promise<void> {
  const now = new Date().toISOString();

  const { data: course } = await db
    .from('courses')
    .select('id, slug')
    .eq('id', BARBER_COURSE_ID)
    .maybeSingle();

  if (!course) {
    logger.warn('[ensureBarberLmsEnrollment] Barber course not found', { BARBER_COURSE_ID });
    return;
  }

  const patch: Record<string, unknown> = {
    course_id: BARBER_COURSE_ID,
    program_slug: BARBER_PROGRAM_SLUG,
    updated_at: now,
  };
  if (options?.grantAccess) {
    // Stamp the access fields only when the row would then pass the
    // approved-paid gate (verified self-pay payment, or an already-approved
    // row). The previous code set access_granted_at without access_status
    // at all, so a "granted" barber learner still bounced to
    // /lms/access-pending — and a half-granted row (access_granted_at set,
    // gate still failing) can never be repaired by the manual grant-access
    // route, which 409s once access_granted_at is set.
    const { data: enrollmentRow } = await db
      .from('program_enrollments')
      .select('status,payment_status,payment_reference,funding_source,funding_verified,eligibility_status,self_pay_application_verified_at,approved_at,approved_by,access_granted_at,access_status,revoked_at,cancelled_at,suspended_at,refunded_at')
      .eq('user_id', userId)
      .eq('program_slug', BARBER_PROGRAM_SLUG)
      .maybeSingle();
    const accessPatch = enrollmentRow
      ? paidAccessGrantFields({ ...enrollmentRow, status: 'active' }, now)
      : null;
    if (accessPatch) {
      Object.assign(patch, accessPatch, {
        enrollment_state: 'active',
        status: 'active',
      });
    } else {
      logger.warn('[ensureBarberLmsEnrollment] grantAccess skipped: enrollment does not qualify for approved-paid access', { userId });
    }
  }

  const { error: peError } = await db
    .from('program_enrollments')
    .update(patch)
    .eq('user_id', userId)
    .eq('program_slug', BARBER_PROGRAM_SLUG);

  if (peError) {
    logger.warn('[ensureBarberLmsEnrollment] enrollment update failed', peError);
  }

  const { error: progressError } = await db.from('lms_progress').upsert(
    {
      user_id: userId,
      course_id: BARBER_COURSE_ID,
      course_slug: course.slug ?? 'barber-apprenticeship-v1',
      status: 'in_progress',
      started_at: now,
      last_activity_at: now,
    },
    { onConflict: 'user_id,course_id' },
  );

  if (progressError) {
    logger.warn('[ensureBarberLmsEnrollment] lms_progress upsert failed', progressError);
  }
}

export async function publishBarberCourseCatalog(db: SupabaseClient): Promise<void> {
  const { error } = await db
    .from('courses')
    .update({
      title: 'Prestige Elevation™ Barbering RTI',
      short_description:
        'DOL registered barber apprenticeship RTI — 8 modules, video lessons, checkpoints, and Indiana licensure prep.',
      status: 'published',
      is_active: true,
      thumbnail_url: PRESTIGE_ELEVATION_BARBER_CURRICULUM,
      updated_at: new Date().toISOString(),
    })
    .eq('id', BARBER_COURSE_ID);

  if (error) throw new Error(error.message);
}
