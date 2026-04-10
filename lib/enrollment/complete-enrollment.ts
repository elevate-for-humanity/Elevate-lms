import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { setAuditContext } from '@/lib/audit-context';

export interface EnrollmentData {
  userId: string;
  courseId: string;
  programId?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentAmount?: number;
  paymentMethod?: string;
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

/**
 * Canonical enrollment flow.
 *
 * Reads from:  courses (canonical), program_enrollments (canonical)
 * Writes to:   program_enrollments (canonical)
 *
 * Does NOT touch training_courses, training_enrollments, or course_progress.
 */
export async function completeEnrollment(data: EnrollmentData): Promise<EnrollmentResult> {
  const admin = await getAdminClient();
  const supabase = admin || (await createClient());

  try {
    // Step 1: Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', data.userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    // Step 2: Verify course exists and is published — canonical table only
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, title, slug, status, is_active')
      .eq('id', data.courseId)
      .single();

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
      // Idempotent: already enrolled — return success with existing ID
      return {
        success: true,
        enrollmentId: existing.id,
        courseAccessUrl: `/lms/courses/${data.courseId}`,
      };
    }

    // Step 4: Resolve latest published course version
    const { data: version } = await supabase
      .from('course_versions')
      .select('id')
      .eq('course_id', data.courseId)
      .eq('is_published', true)
      .order('version_number', { ascending: false })
      .limit(1)
      .maybeSingle()
      .catch(() => ({ data: null })) as { data: { id: string } | null };

    // Step 5: Resolve program_slug — required by DB trigger on program_enrollments
    // Look up the course slug directly (courses.slug matches programs.slug for canonical courses)
    const programSlug = course.slug ?? data.programId ?? null;

    // Step 6: Create enrollment — canonical table
    await setAuditContext(supabase, { actorUserId: data.userId, systemActor: 'enrollment_flow' });
    const enrollmentStatus = data.requireApproval ? 'pending_approval' : 'active';
    const { data: enrollment, error: enrollError } = await supabase
      .from('program_enrollments')
      .insert({
        user_id:           data.userId,
        course_id:         data.courseId,
        program_id:        data.programId ?? null,
        program_slug:      programSlug,
        course_version_id: version?.id ?? null,
        status:            enrollmentStatus,
        progress_percent:  0,
        enrolled_at:       new Date().toISOString(),
        funding_source:    data.paymentMethod ?? null,
      })
      .select('id')
      .single();

    if (enrollError || !enrollment) {
      logger.error('Enrollment creation failed', enrollError);
      return { success: false, error: 'Failed to create enrollment' };
    }

    // Step 6: Audit log (fire-and-forget)
    supabase
      .from('audit_logs')
      .insert({
        user_id:       data.userId,
        action:        'enrollment_created',
        resource_type: 'enrollment',
        resource_id:   enrollment.id,
        metadata: {
          course_id:    data.courseId,
          course_title: course.title,
          version_id:   version?.id ?? null,
          table:        'program_enrollments',
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
  const admin = await getAdminClient();
  const supabase = admin || (await createClient());

  const { data: enrollment } = await supabase
    .from('program_enrollments')
    .select('status')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (!enrollment) return false;
  return ['active', 'completed', 'confirmed'].includes(enrollment.status);
}
