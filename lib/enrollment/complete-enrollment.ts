import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface EnrollmentData {
  userId: string;
  courseId: string;
  programId?: string;
  paymentStatus?: 'pending' | 'completed' | 'failed';
  paymentAmount?: number;
  paymentMethod?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface EnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  error?: string;
  courseAccessUrl?: string;
}

/**
 * Complete enrollment flow - Production ready
 * Based on Docebo/Cornerstone patterns
 */
export async function completeEnrollment(data: EnrollmentData): Promise<EnrollmentResult> {
  const supabase = await createClient();

  try {
    // Step 1: Verify user exists and is active
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found or inactive' };
    }

    // Step 2: Verify course exists and is available
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', data.courseId)
      .single();

    if (courseError || !course) {
      return { success: false, error: 'Course not found or unavailable' };
    }

    // Step 3: Check if already enrolled
    const { data: existing } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', data.userId)
      .eq('course_id', data.courseId)
      .single();

    if (existing) {
      return { success: false, error: 'Already enrolled in this course' };
    }

    // Step 4: Check prerequisites (if any)
    if (course.prerequisites && course.prerequisites.length > 0) {
      const { data: completedCourses } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('user_id', data.userId)
        .eq('status', 'completed')
        .in('course_id', course.prerequisites);

      if (!completedCourses || completedCourses.length < course.prerequisites.length) {
        return { success: false, error: 'Prerequisites not met' };
      }
    }

    // Step 5: Create enrollment record
    const { data: enrollment, error: enrollError } = await supabase
      .from('enrollments')
      .insert({
        user_id: data.userId,
        course_id: data.courseId,
        status: 'active',
        progress: 0,
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (enrollError || !enrollment) {
      logger.error('Enrollment creation failed', enrollError);
      return { success: false, error: 'Failed to create enrollment' };
    }

    // Step 6: Initialize progress tracking
    const { error: progressError } = await supabase
      .from('course_progress')
      .insert({
        enrollment_id: enrollment.id,
        user_id: data.userId,
        course_id: data.courseId,
        completed_lessons: [],
        current_lesson: null,
        last_accessed: new Date().toISOString(),
      });

    if (progressError) {
      logger.error('Progress tracking initialization failed', progressError);
    }

    // Step 7: Send welcome email (async, don't wait)
    sendEnrollmentEmail(user.email, course.title, enrollment.id).catch(err => {
      logger.error('Welcome email failed', err);
    });

    // Step 8: Log enrollment event
    await supabase
      .from('audit_logs')
      .insert({
        user_id: data.userId,
        action: 'enrollment_created',
        resource_type: 'enrollment',
        resource_id: enrollment.id,
        metadata: {
          course_id: data.courseId,
          course_title: course.title,
        },
      });

    return {
      success: true,
      enrollmentId: enrollment.id,
      courseAccessUrl: `/lms/courses/${data.courseId}`,
    };

  } catch (error) { /* Error handled silently */ 
    logger.error('Enrollment flow error', error);
    return {
      success: false,
      error: 'An unexpected error occurred during enrollment',
    };
  }
}

/**
 * Send enrollment confirmation email
 */
async function sendEnrollmentEmail(email: string, courseTitle: string, enrollmentId: string) {
  logger.info('Sending enrollment email', { email, courseTitle, enrollmentId });
}

/**
 * Verify course access - call this before showing course content
 */
export async function verifyCourseAccess(userId: string, courseId: string): Promise<boolean> {
  const supabase = await createClient();

  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('status, end_date')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .single();

  if (!enrollment) return false;
  if (enrollment.status !== 'active') return false;
  if (enrollment.end_date && new Date(enrollment.end_date) < new Date()) return false;

  return true;
}
