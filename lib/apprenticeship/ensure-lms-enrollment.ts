import type { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

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
    enrollmentPatch.access_granted_at = now;
    enrollmentPatch.enrollment_state = 'active';
    enrollmentPatch.status = 'active';
  }

  const { error: enrollmentError } = await db
    .from('program_enrollments')
    .update(enrollmentPatch)
    .eq('user_id', input.userId)
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
