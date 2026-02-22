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
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect(`/login?redirect=/courses/${courseId}`);
  }

  // Check enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from('program_enrollments')
    .select(`
      *,
      course:courses(*)
    `)
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();

  if (enrollError || !enrollment) {
    return {
      hasAccess: false,
      reason: 'not_enrolled',
    };
  }

  // Check enrollment status
  if (enrollment.status !== 'active') {
    return {
      hasAccess: false,
      enrollment,
      reason: `enrollment_${enrollment.status}`,
    };
  }

  // Check expiration
  if (enrollment.end_date && new Date(enrollment.end_date) < new Date()) {
    return {
      hasAccess: false,
      enrollment,
      reason: 'expired',
    };
  }

  // Check payment status
  if (enrollment.payment_status === 'failed') {
    return {
      hasAccess: false,
      enrollment,
      reason: 'payment_failed',
    };
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
