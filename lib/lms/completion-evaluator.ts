/**
 * Completion rule evaluator.
 *
 * Reads completion_rules rows for a course or program and evaluates
 * whether the learner has satisfied them. Falls back to sensible
 * defaults when no rules are configured so existing courses keep
 * working without migration.
 *
 * Called by:
 *   - /api/courses/[courseId]/complete  (course completion check)
 *   - /api/lessons/[lessonId]/complete  (program completion check after course done)
 */

import { createAdminClient, createAuditedAdminClient } from '@/lib/supabase/admin';

export type EntityType = 'course' | 'program';

interface CompletionRule {
  rule_type: string;
  config: Record<string, unknown>;
}

interface CourseCompletionContext {
  totalLessons: number;
  completedLessons: number;
  requiredLessons: number;
  completedRequiredLessons: number;
  minScore?: number;
  achievedScore?: number;
}

interface ProgramCompletionContext {
  totalRequiredCourses: number;
  completedCourses: number;
}

/**
 * Evaluate whether a learner has completed a course.
 * Falls back to "all lessons complete" if no rules are configured.
 */
export async function evaluateCourseCompletion(
  courseId: string,
  context: CourseCompletionContext
): Promise<boolean> {
  const db = await createAuditedAdminClient({ systemActor: 'course_completion_eval' });
  const { data: rules } = await db
    .from('completion_rules')
    .select('rule_type, config')
    .eq('entity_type', 'course')
    .eq('entity_id', courseId)
    .eq('is_active', true);

  // Default: all lessons must be completed
  if (!rules || rules.length === 0) {
    return context.totalLessons > 0 &&
           context.completedLessons >= context.totalLessons;
  }

  return rules.every((rule: CompletionRule) => evaluateCourseRule(rule, context));
}

function evaluateCourseRule(
  rule: CompletionRule,
  ctx: CourseCompletionContext
): boolean {
  switch (rule.rule_type) {
    case 'all_lessons':
      return ctx.totalLessons > 0 && ctx.completedLessons >= ctx.totalLessons;

    case 'required_lessons':
      return ctx.requiredLessons > 0 &&
             ctx.completedRequiredLessons >= ctx.requiredLessons;

    case 'min_score': {
      const minScore = Number(rule.config.min_score ?? 70);
      return ctx.achievedScore !== undefined && ctx.achievedScore >= minScore;
    }

    default:
      // Unknown rule type — don't block completion
      return true;
  }
}

/**
 * Check whether completing a course triggers program completion.
 * Calls the check_program_completion DB function which reads
 * program_completion_candidates (all required courses done, program
 * not yet marked complete).
 *
 * Returns array of program enrollments that are now complete.
 * Empty array means no program was completed by this course.
 */
export async function checkProgramCompletion(
  userId: string,
  courseId: string
): Promise<Array<{ program_enrollment_id: string; program_id: string; user_id: string }>> {
  const db = await createAuditedAdminClient({
    actorUserId: userId,
    systemActor: 'program_completion_check',
  });
  const { data, error } = await db.rpc('check_program_completion', {
    p_user_id:   userId,
    p_course_id: courseId,
  });

  if (error) {
    // Function may not exist yet in this environment — non-fatal
    return [];
  }

  return data ?? [];
}

/**
 * Mark a program enrollment as completed, write a transcript entry,
 * generate the certificate PDF, store it, and issue the credential.
 * Idempotent — safe to call multiple times.
 */
export async function completeProgramEnrollment(
  programEnrollmentId: string,
  userId: string,
  programId: string
): Promise<void> {
  const db = await createAuditedAdminClient({
    actorUserId: userId,
    systemActor: 'program_completion',
  });

  // 1. Mark program completed in DB
  await db.rpc('mark_program_completed', {
    p_program_enrollment_id: programEnrollmentId,
  });

  // 2. Fetch learner profile and program details
  const [{ data: profile }, { data: program }] = await Promise.all([
    db.from('profiles').select('full_name, email').eq('id', userId).single(),
    db.from('training_programs').select('name, required_hours').eq('id', programId).maybeSingle(),
  ]);

  const studentName  = profile?.full_name ?? 'Learner';
  const studentEmail = profile?.email;
  const programName  = program?.name ?? 'Program';
  const programHours = program?.required_hours ?? null;

  // 3. Count completed courses for transcript
  const { count: coursesCompleted } = await db
    .from('training_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .not('completed_at', 'is', null);

  // 4. Write transcript entry (idempotent via unique constraint)
  const { data: transcriptRow } = await db
    .from('transcripts')
    .upsert(
      {
        user_id:               userId,
        program_enrollment_id: programEnrollmentId,
        program_id:            programId,
        program_name:          programName,
        completed_at:          new Date().toISOString(),
        total_hours:           programHours,
        courses_completed:     coursesCompleted ?? 0,
      },
      { onConflict: 'user_id,program_enrollment_id', ignoreDuplicates: false }
    )
    .select('id')
    .single();

  // 5. Generate certificate PDF and upload to storage
  let pdfUrl: string | null = null;
  try {
    const { generateCertificatePDF, generateCertificateNumber } =
      await import('@/lib/certificates/generator');

    const certNumber = generateCertificateNumber();
    const pdfBlob = await generateCertificatePDF({
      studentName,
      courseName:      programName,
      completionDate:  new Date().toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      }),
      certificateNumber: certNumber,
      programHours:    programHours ?? undefined,
    });

    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());
    const storagePath = `programs/${programId}/${userId}/${certNumber}.pdf`;

    const { error: uploadErr } = await db.storage
      .from('certificates')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (!uploadErr) {
      const { data: signed } = await db.storage
        .from('certificates')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1-year signed URL
      pdfUrl = signed?.signedUrl ?? null;

      // Update transcript with PDF URL
      if (transcriptRow?.id && pdfUrl) {
        await db.from('transcripts').update({ pdf_url: pdfUrl }).eq('id', transcriptRow.id);
      }
    }
  } catch (pdfErr) {
    logger.error('[completion] PDF generation failed (non-fatal):', pdfErr);
  }

  // 6. Issue certificate record via canonical issuer
  try {
    const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
    const result = await issueCertificate({
      supabase:     db,
      studentId:    userId,
      studentName,
      studentEmail,
      programId,
      programName,
      programHours,
      enrollmentId: programEnrollmentId,
    });

    // Link certificate to transcript
    if (result.success && result.certificate?.id && transcriptRow?.id) {
      await db.from('transcripts')
        .update({ certificate_id: result.certificate.id })
        .eq('id', transcriptRow.id);
    }
  } catch {
    // issueCertificate logs internally — non-fatal
  }
}
