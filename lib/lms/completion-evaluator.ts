import 'server-only';

/**
 * Canonical completion evaluator.
 *
 * Course completion is evaluated from completion_rules plus canonical course data.
 * Program completion is derived from program_courses + program_enrollments and the
 * same course-completion engine. It does not depend on retired training_enrollments
 * or database functions/views that are absent from the live schema.
 */

import { createAuditedAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { checkCourseCompletion } from '@/lib/course-completion';

export type EntityType = 'course' | 'program';

interface CompletionRule {
  rule_type: string;
  config: Record<string, unknown>;
  threshold_value?: number | null;
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

export async function evaluateCourseCompletion(
  courseId: string,
  context: CourseCompletionContext,
): Promise<boolean> {
  const db = await createAuditedAdminClient({ systemActor: 'course_completion_eval' });
  const { data: rules, error } = await db
    .from('completion_rules')
    .select('rule_type,config,threshold_value')
    .eq('entity_type', 'course')
    .eq('entity_id', courseId)
    .eq('is_active', true);

  if (error) throw error;
  if (!rules?.length) {
    return context.totalLessons > 0 && context.completedLessons >= context.totalLessons;
  }

  return rules.every((rule) => evaluateCourseRule(rule as CompletionRule, context));
}

function evaluateCourseRule(rule: CompletionRule, ctx: CourseCompletionContext): boolean {
  switch (rule.rule_type) {
    case 'all_lessons':
      return ctx.totalLessons > 0 && ctx.completedLessons >= ctx.totalLessons;
    case 'required_lessons':
      return ctx.requiredLessons > 0 && ctx.completedRequiredLessons >= ctx.requiredLessons;
    case 'min_score': {
      const minScore = Number(rule.config?.min_score ?? rule.threshold_value ?? 70);
      return ctx.achievedScore !== undefined && ctx.achievedScore >= minScore;
    }
    default:
      logger.error('[completion] Unknown active course completion rule', new Error(rule.rule_type));
      return false;
  }
}

async function evaluateProgramCompletion(
  programId: string,
  context: ProgramCompletionContext,
): Promise<boolean> {
  const db = await createAuditedAdminClient({ systemActor: 'program_completion_eval' });
  const { data: rules, error } = await db
    .from('completion_rules')
    .select('rule_type,config,threshold_value')
    .eq('entity_type', 'program')
    .eq('entity_id', programId)
    .eq('is_active', true);

  if (error) throw error;
  if (!rules?.length) {
    return (
      context.totalRequiredCourses > 0 &&
      context.completedCourses >= context.totalRequiredCourses
    );
  }

  return rules.every((rawRule) => {
    const rule = rawRule as CompletionRule;
    switch (rule.rule_type) {
      case 'all_courses':
      case 'required_courses':
        return (
          context.totalRequiredCourses > 0 &&
          context.completedCourses >= context.totalRequiredCourses
        );
      case 'min_courses': {
        const requiredCount = Number(rule.config?.count ?? rule.threshold_value ?? 1);
        return context.completedCourses >= requiredCount;
      }
      default:
        logger.error('[completion] Unknown active program completion rule', new Error(rule.rule_type), {
          programId,
        });
        return false;
    }
  });
}

export async function checkProgramCompletion(
  userId: string,
  courseId: string,
): Promise<Array<{ program_enrollment_id: string; program_id: string; user_id: string }>> {
  const db = await createAuditedAdminClient({
    actorUserId: userId,
    systemActor: 'program_completion_check',
  });

  const { data: directLinks, error: directLinkError } = await db
    .from('program_courses')
    .select('program_id')
    .eq('course_id', courseId)
    .eq('is_required', true);
  if (directLinkError) throw directLinkError;

  const linkedProgramIds = [
    ...new Set((directLinks ?? []).map((link) => link.program_id).filter(Boolean)),
  ] as string[];

  let enrollmentQuery = db
    .from('program_enrollments')
    .select('id,program_id,course_id,status,user_id,student_id')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`);

  if (linkedProgramIds.length) {
    enrollmentQuery = enrollmentQuery.in('program_id', linkedProgramIds);
  } else {
    enrollmentQuery = enrollmentQuery.eq('course_id', courseId);
  }

  const { data: enrollments, error: enrollmentError } = await enrollmentQuery;
  if (enrollmentError) throw enrollmentError;

  const completedPrograms: Array<{
    program_enrollment_id: string;
    program_id: string;
    user_id: string;
  }> = [];

  for (const enrollment of enrollments ?? []) {
    if (!enrollment.program_id || enrollment.status?.toLowerCase() === 'completed') continue;

    const { data: requiredLinks, error: linksError } = await db
      .from('program_courses')
      .select('course_id')
      .eq('program_id', enrollment.program_id)
      .eq('is_required', true)
      .order('order_index');
    if (linksError) throw linksError;

    const requiredCourseIds = [
      ...new Set(
        (requiredLinks?.length
          ? requiredLinks.map((link) => link.course_id)
          : [enrollment.course_id || courseId]
        ).filter(Boolean),
      ),
    ] as string[];

    if (!requiredCourseIds.includes(courseId) || requiredCourseIds.length === 0) continue;

    const statuses = await Promise.all(
      requiredCourseIds.map((requiredCourseId) => checkCourseCompletion(userId, requiredCourseId)),
    );
    const completedCourses = statuses.filter((status) => status.isComplete).length;

    const programComplete = await evaluateProgramCompletion(enrollment.program_id, {
      totalRequiredCourses: requiredCourseIds.length,
      completedCourses,
    });

    if (programComplete) {
      completedPrograms.push({
        program_enrollment_id: enrollment.id,
        program_id: enrollment.program_id,
        user_id: userId,
      });
    }
  }

  return completedPrograms;
}

export async function completeProgramEnrollment(
  programEnrollmentId: string,
  userId: string,
  programId: string,
): Promise<void> {
  const db = await createAuditedAdminClient({
    actorUserId: userId,
    systemActor: 'program_completion',
  });

  const { data: enrollment, error: enrollmentError } = await db
    .from('program_enrollments')
    .select('id,program_id,user_id,student_id,status')
    .eq('id', programEnrollmentId)
    .eq('program_id', programId)
    .maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!enrollment) throw new Error('Program enrollment not found');
  if (enrollment.user_id !== userId && enrollment.student_id !== userId) {
    throw new Error('Program enrollment does not belong to learner');
  }

  const [{ data: profile, error: profileError }, { data: program, error: programError }] =
    await Promise.all([
      db.from('profiles').select('full_name,email').eq('id', userId).maybeSingle(),
      db
        .from('programs')
        .select('title,name,required_hours,total_hours,training_hours')
        .eq('id', programId)
        .maybeSingle(),
    ]);
  if (profileError) throw profileError;
  if (programError) throw programError;
  if (!program) throw new Error('Program not found');

  const studentName = profile?.full_name || profile?.email || 'Learner';
  const studentEmail = profile?.email || undefined;
  const programName = program.title || program.name || 'Program';
  const programHours =
    program.required_hours ?? program.total_hours ?? program.training_hours ?? null;

  const { data: requiredCourses, error: requiredCoursesError } = await db
    .from('program_courses')
    .select('course_id')
    .eq('program_id', programId)
    .eq('is_required', true);
  if (requiredCoursesError) throw requiredCoursesError;
  const coursesCompleted = Math.max(1, requiredCourses?.length ?? 0);

  const { issueCertificate } = await import('@/lib/certificates/issue-certificate');
  const issued = await issueCertificate({
    supabase: db,
    studentId: userId,
    studentName,
    studentEmail,
    programId,
    programName,
    programHours,
    enrollmentId: programEnrollmentId,
    competencyEvidence: {
      completionVerifiedAt: new Date().toISOString(),
      completionMethod: 'program_requirements_verified',
    },
  });

  if (!issued.success || !issued.certificate) {
    throw new Error(issued.error || 'Program certificate issuance failed');
  }

  const completedAt = issued.certificate.completion_date || new Date().toISOString();
  const { error: completionUpdateError } = await db
    .from('program_enrollments')
    .update({
      status: 'completed',
      progress_percent: 100,
      completed_at: completedAt,
      certificate_issued_at: completedAt,
      updated_at: completedAt,
    })
    .eq('id', programEnrollmentId);
  if (completionUpdateError) throw completionUpdateError;

  let pdfUrl: string | null = null;
  try {
    const { generateCertificatePDF } = await import('@/lib/certificates/generator');
    const pdfBlob = await generateCertificatePDF({
      studentName,
      courseName: programName,
      completionDate: new Date(completedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      certificateNumber: issued.certificate.certificate_number,
      programHours: programHours ?? undefined,
    });

    const storagePath = `programs/${programId}/${userId}/${issued.certificate.certificate_number}.pdf`;
    const { error: uploadError } = await db.storage
      .from('certificates')
      .upload(storagePath, Buffer.from(await pdfBlob.arrayBuffer()), {
        contentType: 'application/pdf',
        upsert: true,
      });
    if (uploadError) throw uploadError;

    const { data: signed, error: signedUrlError } = await db.storage
      .from('certificates')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365);
    if (signedUrlError) throw signedUrlError;
    pdfUrl = signed?.signedUrl ?? null;

    if (pdfUrl) {
      await db
        .from('certificates')
        .update({ pdf_url: pdfUrl, certificate_url: pdfUrl })
        .eq('id', issued.certificate.id);
    }
  } catch (pdfError) {
    logger.error('[completion] Program certificate PDF generation failed (non-fatal)', pdfError as Error, {
      programEnrollmentId,
      certificateId: issued.certificate.id,
    });
  }

  const { data: transcript, error: transcriptError } = await db
    .from('transcripts')
    .upsert(
      {
        user_id: userId,
        program_enrollment_id: programEnrollmentId,
        program_id: programId,
        program_name: programName,
        completed_at: completedAt,
        total_hours: programHours,
        courses_completed: coursesCompleted,
        certificate_id: issued.certificate.id,
        pdf_url: pdfUrl,
      },
      { onConflict: 'user_id,program_enrollment_id', ignoreDuplicates: false },
    )
    .select('id')
    .single();

  if (transcriptError || !transcript) {
    throw transcriptError || new Error('Transcript write failed');
  }
}
