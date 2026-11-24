import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { paidAccessGrantFields } from '@/lib/enrollment/paid-access.mjs';

/** Keep every apprenticeship enrollment connected to its resolved RTI course. */
export async function ensureApprenticeshipLmsEnrollment(
  db: SupabaseClient,
  input: { userId: string; programSlug: string; courseId: string; grantAccess: boolean },
) {
  const now = new Date().toISOString();
  const { data: course, error: courseError } = await db
    .from('courses')
    .select('id,slug')
    .eq('id', input.courseId)
    .maybeSingle();
  if (courseError || !course) {
    logger.warn('[apprenticeship/enrollment] resolved RTI course is unavailable', {
      programSlug: input.programSlug,
      courseId: input.courseId,
      error: courseError?.message,
    });
    return;
  }

  const enrollmentPatch: Record<string, unknown> = {
    course_id: input.courseId,
    updated_at: now,
  };
  if (input.grantAccess) {
    // Stamp the access fields only when the row would then pass the
    // approved-paid gate (verified self-pay payment, or an already-approved
    // row). Stamping access_granted_at on a row that cannot pass the gate
    // would leave it permanently stuck: the gate still fails, and the
    // manual grant-access route 409s once access_granted_at is set.
    // The oracle patch also adds self_pay_application_verified_at when
    // the row qualifies as verified self-pay — access_status +
    // access_granted_at alone are not enough for a self-pay row.
    const { data: enrollmentRow } = await db
      .from('program_enrollments')
      .select('status,payment_status,payment_reference,funding_source,funding_verified,eligibility_status,self_pay_application_verified_at,approved_at,approved_by,access_granted_at,access_status,revoked_at,cancelled_at,suspended_at,refunded_at')
      .or(`user_id.eq.${input.userId},student_id.eq.${input.userId}`)
      .eq('program_slug', input.programSlug)
      .maybeSingle();
    const accessPatch = enrollmentRow
      ? paidAccessGrantFields({ ...enrollmentRow, status: 'active' }, now)
      : null;
    if (accessPatch) {
      Object.assign(enrollmentPatch, accessPatch, {
        enrollment_state: 'active',
        status: 'active',
      });
    } else {
      logger.warn('[apprenticeship/enrollment] grantAccess skipped: enrollment does not qualify for approved-paid access', {
        programSlug: input.programSlug,
        userId: input.userId,
      });
    }
  }

  const { error: enrollmentError } = await db
    .from('program_enrollments')
    .update(enrollmentPatch)
    .or(`user_id.eq.${input.userId},student_id.eq.${input.userId}`)
    .eq('program_slug', input.programSlug);
  if (enrollmentError) throw enrollmentError;

  const { error: progressError } = await db.from('lms_progress').upsert(
    {
      user_id: input.userId,
      course_id: input.courseId,
      course_slug: course.slug || input.programSlug,
      status: 'in_progress',
      started_at: now,
      last_activity_at: now,
    },
    { onConflict: 'user_id,course_id' },
  );
  if (progressError) throw progressError;
}
