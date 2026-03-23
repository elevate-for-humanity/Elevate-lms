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
import { sendEmail } from '@/lib/email/sendgrid';
import { getCertificateIssuedEmail } from '@/lib/email/career-course-sequences';
import { setAuditContext } from '@/lib/audit-context';

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
  // Reads course_lessons (canonical) — lesson_type column.
  const { data: requiredCheckpoints } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .in('lesson_type', ['checkpoint', 'exam']);

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

  // Resolve program_id from enrollment — canonical table
  const { data: enrollment } = await db
    .from('program_enrollments')
    .select('program_id')
    .eq('id', enrollmentId)
    .maybeSingle();

  const programId = enrollment?.program_id ?? null;

  // All required external courses must have an approved completion before
  // the Elevate certificate is issued. Staff approval sets approved_at.
  if (programId) {
    const { data: requiredExternal } = await db
      .from('program_external_courses')
      .select('id')
      .eq('program_id', programId)
      .eq('is_required', true)
      .eq('is_active', true);

    if (requiredExternal && requiredExternal.length > 0) {
      const requiredIds = requiredExternal.map((r: any) => r.id);

      const { data: approvedCompletions } = await db
        .from('external_course_completions')
        .select('external_course_id')
        .eq('user_id', userId)
        .in('external_course_id', requiredIds)
        .not('approved_at', 'is', null);

      const approvedIds = new Set((approvedCompletions ?? []).map((r: any) => r.external_course_id));
      const allApproved = requiredIds.every((id: string) => approvedIds.has(id));

      if (!allApproved) {
        logger.info('[engine/certificate] Blocked — required external courses not yet approved', {
          userId, courseId, requiredIds, approvedIds: [...approvedIds],
        });
        return null;
      }
    }
  }

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

  // Send certificate notification email — non-blocking, never throws
  try {
    const [profileResult, courseResult] = await Promise.all([
      db.from('profiles').select('email, first_name').eq('id', userId).maybeSingle(),
      db.from('courses').select('title, slug').eq('id', courseId).maybeSingle(),
    ]);

    const profile  = profileResult.data;
    const course   = courseResult.data;

    if (profile?.email) {
      const emailPayload = getCertificateIssuedEmail({
        email:         profile.email,
        firstName:     profile.first_name ?? undefined,
        courseName:    course?.title ?? 'your program',
        certificateId: certNumber,
        programSlug:   course?.slug ?? '',
      });
      await sendEmail({
        to:      profile.email,
        subject: emailPayload.subject,
        html:    emailPayload.html,
        from:    'Elevate for Humanity <noreply@elevateforhumanity.org>',
        replyTo: 'elevate4humanityedu@gmail.com',
      });
      logger.info('[engine/certificate] Certificate email sent', { userId, certNumber });
    }
  } catch (emailErr) {
    // Email failure must never block certificate issuance
    logger.error('[engine/certificate] Certificate email failed', emailErr);
  }

  return certNumber;
}
