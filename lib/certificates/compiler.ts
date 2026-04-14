/**
 * lib/certificates/compiler.ts
 *
 * Gate-validated certificate issuance to program_completion_certificates.
 *
 * This is the canonical path for credential-grade programs. It replaces
 * the legacy lib/certificates/issue-certificate.ts path for programs that
 * use the compiler pipeline (those with certificateRequirements defined).
 *
 * Pre-issue gates (all must pass):
 *   1. All required lessons complete
 *   2. All required quizzes/checkpoints passed
 *   3. All required labs/assignments approved
 *   4. Final exam passed (if requiresFinalExam=true)
 *   5. Minimum hours reached (if minimumHours set)
 *   6. All critical competencies achieved
 *
 * Certificate payload written to program_completion_certificates:
 *   hours_completed, competencies_achieved, instructor_verified,
 *   verification_summary (full CertificateEvidence)
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CertificateEvidence, CertificateRequirements } from '@/lib/course-builder/schema';
import { getLearnerCompetencyStatus, allCriticalCompetenciesAchieved } from '@/lib/course-builder/competency-mapper';
import { computeCertificateHours } from '@/lib/course-builder/hours-engine';
import { logger } from '@/lib/logger';

export type { CertificateEvidence };

// ─── Types ────────────────────────────────────────────────────────────────────

export type CertificateGateParams = {
  userId: string;
  courseId: string;
  programId: string;
  programSlug: string;
  enrollmentId: string;
  requiresFinalExam?: boolean;
  minimumHours?: number;
  certificateRequirements?: CertificateRequirements;
};

export type CertificateGateResult = {
  eligible: boolean;
  blockers: string[];
  evidence: Partial<CertificateEvidence>;
};

export type IssueCertificateParams = CertificateGateParams & {
  studentName: string;
  studentEmail?: string;
  courseTitle: string;
};

export type IssueCertificateResult = {
  success: boolean;
  alreadyIssued: boolean;
  certificateId?: string;
  certificateNumber?: string;
  error?: string;
};

// ─── Gate check ───────────────────────────────────────────────────────────────

/**
 * Evaluates all pre-issue gates and assembles the evidence payload.
 * Returns eligible=false with blockers if any gate fails.
 */
export async function checkCertificateGate(
  db: SupabaseClient,
  params: CertificateGateParams,
): Promise<CertificateGateResult> {
  const blockers: string[] = [];
  const { userId, courseId, programSlug, enrollmentId, requiresFinalExam, minimumHours, certificateRequirements } = params;

  // ── Gate 1: All required lessons complete ─────────────────────────────────
  const { data: requiredLessons } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('is_required', true);

  const requiredIds = (requiredLessons ?? []).map(l => l.id);

  const { data: completedProgress } = await db
    .from('lesson_progress')
    .select('lesson_id')
    .eq('user_id', userId)
    .eq('completed', true)
    .in('lesson_id', requiredIds);

  const completedIds = new Set((completedProgress ?? []).map(r => r.lesson_id));
  const incompleteCount = requiredIds.filter(id => !completedIds.has(id)).length;

  if (incompleteCount > 0) {
    blockers.push(`${incompleteCount} required lesson(s) not yet complete`);
  }

  // ── Gate 2: All checkpoints passed ───────────────────────────────────────
  const { data: checkpointLessons } = await db
    .from('course_lessons')
    .select('id, passing_score')
    .eq('course_id', courseId)
    .in('lesson_type', ['checkpoint', 'quiz']);

  const checkpointIds = (checkpointLessons ?? []).map(l => l.id);

  if (checkpointIds.length > 0) {
    const { data: scores } = await db
      .from('checkpoint_scores')
      .select('lesson_id, score, passed')
      .eq('user_id', userId)
      .in('lesson_id', checkpointIds)
      .eq('passed', true);

    const passedCheckpoints = new Set((scores ?? []).map(s => s.lesson_id));
    const failedCheckpoints = checkpointIds.filter(id => !passedCheckpoints.has(id));

    if (failedCheckpoints.length > 0) {
      blockers.push(`${failedCheckpoints.length} checkpoint(s) not yet passed`);
    }
  }

  // ── Gate 3: All labs/assignments approved ─────────────────────────────────
  const { data: practicalLessons } = await db
    .from('course_lessons')
    .select('id')
    .eq('course_id', courseId)
    .eq('practical_required', true);

  const practicalIds = (practicalLessons ?? []).map(l => l.id);

  if (practicalIds.length > 0) {
    const { data: approvedSubs } = await db
      .from('step_submissions')
      .select('course_lesson_id')
      .eq('user_id', userId)
      .eq('status', 'approved')
      .in('course_lesson_id', practicalIds);

    const approvedLessons = new Set((approvedSubs ?? []).map(s => s.course_lesson_id));
    const unapproved = practicalIds.filter(id => !approvedLessons.has(id));

    if (unapproved.length > 0) {
      blockers.push(`${unapproved.length} practical lesson(s) not yet approved by instructor`);
    }
  }

  // ── Gate 4: Final exam passed ─────────────────────────────────────────────
  let finalExamScore: number | undefined;

  if (requiresFinalExam) {
    const { data: examLesson } = await db
      .from('course_lessons')
      .select('id, passing_score')
      .eq('course_id', courseId)
      .eq('lesson_type', 'exam')
      .order('order_index', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!examLesson) {
      blockers.push('Final exam lesson not found in course');
    } else {
      const { data: examScore } = await db
        .from('checkpoint_scores')
        .select('score, passed')
        .eq('user_id', userId)
        .eq('lesson_id', examLesson.id)
        .eq('passed', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!examScore) {
        blockers.push('Final exam not yet passed');
      } else {
        finalExamScore = examScore.score;
      }
    }
  }

  // ── Gate 5: Minimum hours ─────────────────────────────────────────────────
  let hoursCompleted = 0;

  if (minimumHours) {
    // Sum field_hours_logs + completed lesson durations
    const { data: fieldLogs } = await db
      .from('field_hours_logs')
      .select('minutes')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .eq('verified', true);

    const fieldMinutes = (fieldLogs ?? []).reduce((s, r) => s + r.minutes, 0);

    const { data: completedLessonRows } = await db
      .from('course_lessons')
      .select('duration_minutes')
      .eq('course_id', courseId)
      .in('id', Array.from(completedIds));

    const lessonMinutes = (completedLessonRows ?? []).reduce(
      (s, r) => s + (r.duration_minutes ?? 0), 0,
    );

    hoursCompleted = computeCertificateHours({
      fieldMinutes,
      completedLessonMinutes: lessonMinutes,
    });

    if (hoursCompleted < minimumHours) {
      blockers.push(
        `Hours completed (${hoursCompleted.toFixed(1)}) below minimum (${minimumHours})`,
      );
    }
  }

  // ── Gate 6: Critical competencies achieved ────────────────────────────────
  const competencyStatuses = await getLearnerCompetencyStatus(db, { userId, courseId, programSlug });
  const criticalUnachieved = competencyStatuses.filter(
    s => s.isCritical && s.status !== 'achieved',
  );

  if (criticalUnachieved.length > 0) {
    blockers.push(
      `${criticalUnachieved.length} critical competency(ies) not yet achieved: ${criticalUnachieved.map(c => c.key).join(', ')}`,
    );
  }

  const achievedKeys = competencyStatuses.filter(s => s.status === 'achieved').map(s => s.key);
  const criticalAchievedKeys = competencyStatuses.filter(s => s.isCritical && s.status === 'achieved').map(s => s.key);
  const instructorVerified = competencyStatuses.some(
    s => s.status === 'achieved' && s.requiresInstructorSignoff,
  );

  const evidence: Partial<CertificateEvidence> = {
    hoursCompleted,
    competenciesAchieved: achievedKeys,
    criticalCompetenciesAchieved: criticalAchievedKeys,
    instructorVerified,
    finalExamScore,
    completionDate: new Date().toISOString(),
  };

  return {
    eligible: blockers.length === 0,
    blockers,
    evidence,
  };
}

// ─── Issue certificate ────────────────────────────────────────────────────────

/**
 * Issues a certificate to program_completion_certificates after all gates pass.
 * Idempotent — returns existing certificate if already issued.
 */
export async function issueProgramCertificate(
  db: SupabaseClient,
  params: IssueCertificateParams,
): Promise<IssueCertificateResult> {
  const { userId, courseId, programId, enrollmentId, studentName, studentEmail, courseTitle } = params;

  // Idempotency check
  const { data: existing } = await db
    .from('program_completion_certificates')
    .select('id, certificate_number')
    .eq('user_id', userId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (existing) {
    logger.info('[cert-compiler] Certificate already issued', { userId, courseId, certId: existing.id });
    return { success: true, alreadyIssued: true, certificateId: existing.id, certificateNumber: existing.certificate_number };
  }

  // Run gate check
  const gate = await checkCertificateGate(db, params);

  if (!gate.eligible) {
    logger.warn('[cert-compiler] Certificate gate failed', { userId, courseId, blockers: gate.blockers });
    return {
      success: false,
      alreadyIssued: false,
      error: `Certificate not eligible: ${gate.blockers.join('; ')}`,
    };
  }

  const evidence = gate.evidence as CertificateEvidence;
  const certNumber = `EFH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
  const now = new Date().toISOString();

  const { data: cert, error: certErr } = await db
    .from('program_completion_certificates')
    .insert({
      user_id:                userId,
      program_id:             programId,
      course_id:              courseId,
      enrollment_id:          enrollmentId,
      certificate_number:     certNumber,
      issued_at:              now,
      completion_date:        now.split('T')[0],
      hours_completed:        evidence.hoursCompleted,
      competencies_achieved:  evidence.competenciesAchieved,
      instructor_verified:    evidence.instructorVerified,
      verification_summary:   evidence,
    })
    .select('id, certificate_number')
    .single();

  if (certErr) {
    logger.error('[cert-compiler] Insert failed', { userId, courseId, error: certErr.message });
    return { success: false, alreadyIssued: false, error: certErr.message };
  }

  // Update enrollment
  await db
    .from('program_enrollments')
    .update({ status: 'completed', completed_at: now, updated_at: now })
    .eq('id', enrollmentId);

  // In-app notification
  const verifyUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org'}/verify/${certNumber.split('-').pop()?.toLowerCase()}`;
  await db.from('notifications').insert({
    user_id:    userId,
    type:       'achievement',
    title:      'Certificate Issued!',
    message:    `Congratulations! Your certificate for ${courseTitle} is ready.`,
    action_url: verifyUrl,
  });

  // Email (non-fatal)
  if (studentEmail) {
    try {
      const { emailService } = await import('@/lib/notifications/email');
      await emailService.sendCertificateNotification(studentEmail, studentName, courseTitle, verifyUrl);
    } catch (e) {
      logger.warn('[cert-compiler] Email failed (non-fatal)', { error: (e as Error).message });
    }
  }

  logger.info('[cert-compiler] Certificate issued', { userId, courseId, certId: cert.id, certNumber });

  return {
    success: true,
    alreadyIssued: false,
    certificateId: cert.id,
    certificateNumber: cert.certificate_number,
  };
}
