import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export interface CourseAccessResult {
  hasAccess: boolean;
  enrollment?: any;
  reason?: string;
}

/**
 * Verify user has access to a course
 * Use this in course pages before rendering content
 */
export async function verifyCourseAccess(courseId: string): Promise<CourseAccessResult> {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?redirect=/courses/${courseId}`);
  }

  // Check enrollment
  const { data: enrollmentRow, error: enrollError } = await supabase
    .from('program_enrollments')
    .select(
      `
      *,
      course:courses(*)
    `,
    )
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .maybeSingle();

  let enrollment = enrollmentRow;
  if (enrollError || !enrollment) {
    // Direct course enrollments are a canonical enrollment source too:
    // loadLearnerCourseIds lists them, and verified paid store fulfillment
    // (lib/store/fulfill-hvac-course.ts) creates ONLY a course_enrollments
    // row. Previously this boundary consulted program_enrollments alone,
    // so a directly-enrolled learner was reported as not enrolled and
    // bounced to the enroll page. Direct rows exist only from verified
    // paid fulfillment or the active-program sync trigger, and revoked
    // rows are excluded, so no payment check is bypassed here.
    const { data: direct, error: directError } = await supabase
      .from('course_enrollments')
      .select('id, status, revoked_at')
      .eq('student_id', user.id)
      .eq('course_id', courseId)
      .is('revoked_at', null)
      .in('status', ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'])
      .limit(1)
      .maybeSingle();
    if (directError || !direct) {
      // Program-linked enrollment: an active program_enrollments row whose
      // program_id is linked to this course in program_courses, even when
      // course_id is null on the row. Resolve that row and let the
      // approved-paid check below govern it.
      const { data: programRows } = await supabase
        .from('program_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .is('revoked_at', null)
        .in('status', ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'])
        .not('program_id', 'is', null);
      const programIds = [...new Set((programRows ?? []).map((row) => row.program_id).filter(Boolean))];
      if (programIds.length) {
        const { data: link } = await supabase
          .from('program_courses')
          .select('program_id')
          .in('program_id', programIds)
          .eq('course_id', courseId)
          .limit(1)
          .maybeSingle();
        const linked = link
          ? (programRows ?? []).find((row) => row.program_id === link.program_id)
          : undefined;
        if (linked) {
          enrollment = linked;
        } else {
          return {
            hasAccess: false,
            reason: 'not_enrolled',
          };
        }
      } else {
        return {
          hasAccess: false,
          reason: 'not_enrolled',
        };
      }
    }
    // A resolved program link must fall through to the approved-paid check.
    // Only an actual, successfully read direct row can take this branch.
    // (Direct course_enrollments rows carry no end_date column — verified
    // paid fulfillment creates them with student_id/course_id/status only —
    // so there is no expiry to enforce here. Selecting a nonexistent
    // end_date made PostgREST error and the direct path never admitted
    // anyone; it also failed the schema-drift gate.)
    if (!directError && direct) {
      return { hasAccess: true, enrollment: direct };
    }
  }

  // Enforce program-level approval and verified payment at the content
  // boundary, not only at the dashboard UI. Pending, unpaid or revoked
  // enrollments must never render training content.
  const { isApprovedPaidEnrollment } = await import('@/lib/learner/approved-paid-admission.mjs');
  if (!isApprovedPaidEnrollment(enrollment)) {
    return { hasAccess: false, enrollment, reason: 'enrollment_not_approved_or_paid' };
  }

  if (enrollment.end_date && new Date(enrollment.end_date) < new Date()) {
    return { hasAccess: false, enrollment, reason: 'expired' };
  }

  // Update last accessed
  await supabase
    .from('program_enrollments')
    .update({ last_accessed: new Date().toISOString() })
    .eq('id', enrollment.id);

  return {
    hasAccess: true,
    enrollment,
  };
}

/**
 * Require course access - redirects if no access
 */
export async function requireCourseAccess(courseId: string) {
  const result = await verifyCourseAccess(courseId);

  if (!result.hasAccess) {
    switch (result.reason) {
      case 'not_enrolled':
        redirect(`/courses/${courseId}/enroll`);
        break;
      case 'expired':
        redirect(`/courses/${courseId}/renew`);
        break;
      case 'payment_failed':
        redirect(`/courses/${courseId}/payment`);
        break;
      default:
        redirect(`/courses/${courseId}`);
    }
  }

  return result.enrollment;
}
