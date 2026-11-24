import 'server-only';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { setAuditContext } from '@/lib/audit-context';
import { ensureDigitalBinder } from './ensure-digital-binder';
import { grantPaidEnrollmentAccess } from './paid-access.mjs';

export interface EnrollmentData {
  userId: string;
  courseId: string;
  programId?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentAmount?: number;
  paymentMethod?: string;
  /** Payment reference (invoice / checkout session id) — required for the
   *  approved-paid login gate to recognise a self-pay payment. */
  paymentReference?: string;
  /** Canonical funding source ('self_pay', 'wioa', 'wrg', ...). When
   *  omitted, paymentMethod is used as before. */
  fundingSource?: string;
  startDate?: Date;
  endDate?: Date;
  /** When true, enrollment is created as pending_approval instead of active */
  requireApproval?: boolean;
}

export interface EnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  error?: string;
  courseAccessUrl?: string;
}

async function authorizeEnrollmentAccess(targetUserId: string) {
  const sessionDb = await createClient();
  const { data: { user } } = await sessionDb.auth.getUser();
  if (!user) throw new Error('Authentication required');
  if (user.id === targetUserId) return;
  const { data: profile } = await sessionDb.from('profiles').select('role').eq('id', user.id).maybeSingle();
  if (!['admin', 'super_admin', 'staff'].includes(profile?.role ?? '')) {
    throw new Error('Enrollment authorization required');
  }
}

/**
 * Canonical enrollment flow.
 *
 * Reads from:  courses (canonical), program_enrollments (canonical)
 * Writes to:   program_enrollments (canonical)
 *
 * Does not touch retired enrollment aliases or course progress.
 */
export async function completeEnrollment(data: EnrollmentData): Promise<EnrollmentResult> {
  await authorizeEnrollmentAccess(data.userId);
  const admin = await requireAdminClient();
  const supabase = admin || (await createClient());

  try {
    // Step 1: Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', data.userId)
      .maybeSingle();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Step 2: Verify course exists and is published — canonical table only
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug, status, is_active')
      .eq('id', data.courseId)
      .maybeSingle();

    if (courseError || !course) {
      return { success: false, error: 'Course not found' };
    }

    if (course.status !== 'published' || !course.is_active) {
      return { success: false, error: 'Course is not available for enrollment' };
    }

    // Step 3: Check for existing enrollment — canonical table only
    const { data: existing } = await supabase
      .from('program_enrollments')
      .select('id, status')
      .eq('user_id', data.userId)
      .eq('course_id', data.courseId)
      .maybeSingle();

    if (existing) {
      // Idempotent: already enrolled — return success with existing ID.
      // If payment was verified for this call and the row predates the
      // access fields, repair it now (oracle-gated: only a row that would
      // then pass the approved-paid gate gets access fields). Non-fatal.
      if (data.paymentStatus === 'completed' && !data.requireApproval) {
        try {
          await grantPaidEnrollmentAccess(supabase, existing.id);
        } catch (repairError) {
          logger.warn('[completeEnrollment] Paid access repair failed', repairError);
        }
      }
      return {
        success: true,
        enrollmentId: existing.id,
        courseAccessUrl: `/lms/courses/${data.courseId}`,
      };
    }

    // Step 4: Resolve latest published course version
    const { data: version } = (await supabase
      .from('course_versions')
      .select('id')
      .eq('course_id', data.courseId)
      .eq('is_published', true)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()
      .catch(() => ({ data: null }))) as { data: { id: string } | null };

    // Step 5: Resolve program_slug — required by DB trigger on program_enrollments
    // Look up the course slug directly (courses.slug matches programs.slug for canonical courses)
    const programSlug = course.slug ?? data.programId ?? null;

    // Step 6: Create enrollment — canonical table
    await setAuditContext(supabase, { actorUserId: data.userId, systemActor: 'enrollment_flow' });
    const enrollmentStatus = data.requireApproval ? 'pending_approval' : 'active';
    // A verified completed payment creates a paid enrollment, not an
    // access-pending one: the approved-paid login gate needs payment_status
    // 'paid' + access_status + access_granted_at, and for self-pay rows
    // also self_pay_application_verified_at + payment_reference. Without
    // them the learner signs in and bounces to /lms/access-pending.
    // requireApproval rows get none of this — approval is their gate.
    const paidEnrollment = data.paymentStatus === 'completed' && !data.requireApproval;
    const now = new Date().toISOString();
    const fundingSource = data.fundingSource ?? data.paymentMethod ?? null;
    const isVerifiedSelfPay =
      paidEnrollment &&
      String(fundingSource ?? '').trim().toLowerCase().replace('-', '_') === 'self_pay' &&
      Boolean(data.paymentReference);
    const { data: enrollment, error: enrollError } = await supabase
      .from('program_enrollments')
      .insert({
        user_id: data.userId,
        course_id: data.courseId,
        program_id: data.programId ?? null,
        program_slug: programSlug,
        course_version_id: version?.id ?? null,
        status: enrollmentStatus,
        progress_percent: 0,
        enrolled_at: now,
        funding_source: fundingSource,
        ...(paidEnrollment
          ? {
              payment_status: 'paid',
              access_status: 'active',
              access_granted_at: now,
            }
          : {}),
        ...(isVerifiedSelfPay
          ? {
              self_pay_application_verified_at: now,
              payment_reference: data.paymentReference,
            }
          : {}),
      })
      .select('id')
      .maybeSingle();

    if (enrollError || !enrollment) {
      logger.error('Enrollment creation failed', enrollError);
      return { success: false, error: 'Failed to create enrollment' };
    }

    // Step 6b: Mirror the enrollment into course_enrollments so the learner
    // exists in BOTH canonical enrollment tables. Readers such as the
    // lessons syllabus endpoint consult course_enrollments alone, and the
    // DB sync trigger only fires when program_id is set and the course is
    // listed in lms_courses for that program — a course-only enrollment
    // (programId null) or a program whose courses are not in lms_courses
    // otherwise leaves the student with no course row and "not enrolled"
    // at every course_enrollments-only boundary. Idempotent: the trigger
    // may already have created the row. Non-fatal: a mirror failure must
    // not fail an otherwise-created enrollment. Pending-approval rows are
    // NOT mirrored — they are not enrollments yet.
    if (enrollmentStatus === 'active') {
      const { error: mirrorError } = await supabase
        .from('course_enrollments')
        .upsert(
          { student_id: data.userId, course_id: data.courseId, status: 'active' },
          { onConflict: 'student_id,course_id', ignoreDuplicates: true },
        );
      if (mirrorError) {
        logger.warn('[completeEnrollment] course_enrollments mirror failed', mirrorError);
      }
    }

    // Step 7: Create Digital Binder for the student
    try {
      const { binderId, created } = await ensureDigitalBinder({
        db: supabase,
        userId: data.userId,
        enrollmentId: enrollment.id,
      });
      if (created) {
        logger.info('[completeEnrollment] Digital binder created', { binderId, enrollmentId: enrollment.id });
      }
    } catch (binderError) {
      // Non-fatal: log but don't fail enrollment
      logger.warn('[completeEnrollment] Digital binder creation failed', binderError);
    }

    // Step 8: Audit log (fire-and-forget)
    supabase
      .from('audit_logs')
      .insert({
        user_id: data.userId,
        action: 'enrollment_created',
        resource_type: 'enrollment',
        resource_id: enrollment.id,
        metadata: {
          course_id: data.courseId,
          course_title: course.title,
          version_id: version?.id ?? null,
          table: 'program_enrollments',
        },
      })
      .then(() => {})
      .catch((err: unknown) => logger.error('Audit log failed', err));

    return {
      success: true,
      enrollmentId: enrollment.id,
      courseAccessUrl: `/lms/courses/${data.courseId}`,
    };
  } catch (error) {
    logger.error('Enrollment flow error', error);
    return { success: false, error: 'An unexpected error occurred during enrollment' };
  }
}

/**
 * Verify course access — reads program_enrollments (canonical).
 */
export async function verifyCourseAccess(userId: string, courseId: string): Promise<boolean> {
  await authorizeEnrollmentAccess(userId);
  const admin = await requireAdminClient();
  const supabase = admin || (await createClient());

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (enrollment) return ['active', 'completed', 'confirmed'].includes(enrollment.status);
  // Direct course enrollments (e.g. verified paid store fulfillment) live
  // only in course_enrollments; see lib/guards/course-access.ts.
  const { data: direct } = await supabase
    .from('course_enrollments')
    .select('status')
    .eq('student_id', userId)
    .eq('course_id', courseId)
    .is('revoked_at', null)
    .maybeSingle();
  if (!direct) return false;
  return ['active', 'completed', 'confirmed'].includes(direct.status);
}
