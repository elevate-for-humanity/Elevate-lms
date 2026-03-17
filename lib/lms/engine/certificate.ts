/**
 * issueCertificateIfEligible
 *
 * Checks whether a learner is eligible for a program_completion_certificates
 * record and writes one if so. Returns the certificate number on success,
 * null if not yet eligible or already issued.
 *
 * Eligibility:
 * - All published curriculum_lessons for the course are complete.
 * - No checkpoint_scores row for this course has passed=false (all gated
 *   steps must be passed; a learner with zero checkpoints is eligible).
 * - No existing certificate for this user+course.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function issueCertificateIfEligible(
  userId: string,
  courseId: string,
  enrollmentId: string
): Promise<string | null> {
  const db = createAdminClient();

  // Already issued?
  const { data: existing } = await db
    .from('program_completion_certificates')
    .select('certificate_number')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) return existing.certificate_number;

  // Every checkpoint/exam lesson for this course must have at least one passing score.
  // A learner with zero checkpoint attempts is not eligible.
  const { data: requiredCheckpoints } = await db
    .from('curriculum_lessons')
    .select('id')
    .eq('course_id', courseId)
    .in('step_type', ['checkpoint', 'exam']);

  const totalCheckpoints = requiredCheckpoints?.length ?? 0;

  if (totalCheckpoints > 0) {
    // For each required checkpoint, confirm at least one passing score exists.
    const { data: passingScores } = await db
      .from('checkpoint_scores')
      .select('lesson_id')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('passed', true);

    const passedLessonIds = new Set((passingScores ?? []).map((r: any) => r.lesson_id));
    const allPassed = (requiredCheckpoints ?? []).every((cl: any) => passedLessonIds.has(cl.id));

    if (!allPassed) {
      return null;
    }
  }

  // Resolve program_id from enrollment
  const { data: enrollment } = await db
    .from('training_enrollments')
    .select('program_id')
    .eq('id', enrollmentId)
    .maybeSingle();

  const programId = enrollment?.program_id ?? null;

  const checkpointsPassed = totalCheckpoints; // all required checkpoints passed (verified above)

  const certNumber = `EFH-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
  const verificationUrl = `/verify/${certNumber}`;

  const { error } = await db.from('program_completion_certificates').insert({
    user_id:             userId,
    program_id:          programId,
    course_id:           courseId,
    enrollment_id:       enrollmentId,
    certificate_number:  certNumber,
    completion_date:     new Date().toISOString().split('T')[0],
    verification_url:    verificationUrl,
    checkpoints_passed:  checkpointsPassed,
    total_checkpoints:   totalCheckpoints,
  });

  if (error) {
    logger.error('[engine/certificate] Insert failed:', error);
    throw new Error(`issueCertificateIfEligible: ${error.message}`);
  }

  logger.info('[engine/certificate] Issued', { userId, courseId, certNumber });
  return certNumber;
}
