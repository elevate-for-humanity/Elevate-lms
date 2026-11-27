import 'server-only';
import { resolveCourseEnrollment } from '@/lib/enrollment/resolve-course-enrollment';
import { getInstructorCurriculumLicenseStatus } from '@/lib/legal/instructorCurriculumLicense';

const accessStatuses = ['active', 'enrolled', 'in_progress', 'confirmed', 'completed'];

/** Enrollment establishes capacity, never overrides lesson pacing/payment checks. */
export async function hasHvacLearnerEnrollment(db: any, userId: string, courseId: string) {
  const enrollment = await resolveCourseEnrollment(userId, courseId);
  if (enrollment && accessStatuses.includes(enrollment.status)) return true;
  const result = await db
    .from('course_enrollments')
    .select('id')
    .eq('student_id', userId)
    .eq('course_id', courseId)
    .in('status', accessStatuses)
    .is('revoked_at', null)
    .limit(1)
    .maybeSingle();
  if (result.error) throw new Error('HVAC_COURSE_ENROLLMENT_UNAVAILABLE');
  return !!result.data;
}

/** Learners keep assessments; teaching requires a current, assigned license. */
export async function getHvacAccessMode(db: any, userId: string, courseId: string) {
  if (await hasHvacLearnerEnrollment(db, userId, courseId))
    return { mode: 'learner' as const, licenseReference: null };
  const license = await getInstructorCurriculumLicenseStatus(db, userId, { courseId });
  return license.authorized
    ? { mode: 'instructor' as const, licenseReference: license.licenseReference }
    : { mode: 'denied' as const, licenseReference: null };
}
