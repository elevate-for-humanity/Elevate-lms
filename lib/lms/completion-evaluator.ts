import 'server-only';

/**
 * Canonical program-completion authority.
 *
 * Course completion is read from lib/course-completion.ts. Program completion is
 * derived from program_courses plus program-level compliance requirements. This
 * module is the only application service allowed to change a program enrollment
 * to completed.
 */

import { createAuditedAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { checkCourseCompletion } from '@/lib/course-completion';
import { checkApprenticeshipEligibility } from '@/lib/hours/get-approved-hours';
import { checkCertificateIssuanceEligibility } from '@/lib/services/credential-pipeline';

interface CompletionRule {
  rule_type: string;
  config: Record<string, unknown>;
  threshold_value?: number | null;
}

interface ProgramCompletionContext {
  totalRequiredCourses: number;
  completedCourses: number;
}

export interface ProgramReadiness {
  ready: boolean;
  enrollmentId: string;
  programId: string;
  userId: string;
  requiredCourseIds: string[];
  completedCourses: number;
  totalRequiredCourses: number;
  missingRequirements: string[];
  evidence: Record<string, unknown>;
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
    return context.totalRequiredCourses > 0 && context.completedCourses >= context.totalRequiredCourses;
  }

  return rules.every((rawRule) => {
    const rule = rawRule as CompletionRule;
    switch (rule.rule_type) {
      case 'all_courses':
      case 'required_courses':
        return context.totalRequiredCourses > 0 && context.completedCourses >= context.totalRequiredCourses;
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

async function getRequiredCourseIds(
  programId: string,
  fallbackCourseId?: string | null,
): Promise<string[]> {
  const db = await createAuditedAdminClient({ systemActor: 'program_completion_courses' });
  const { data: links, error } = await db
    .from('program_courses')
    .select('course_id')
    .eq('program_id', programId)
    .eq('is_required', true)
    .order('order_index');
  if (error) throw error;

  return [
    ...new Set(
      (links?.length ? links.map((link) => link.course_id) : [fallbackCourseId]).filter(Boolean),
    ),
  ] as string[];
}

export async function checkProgramReadiness(
  programEnrollmentId: string,
  userId: string,
  programId: string,
): Promise<ProgramReadiness> {
  const db = await createAuditedAdminClient({
    actorUserId: userId,
    systemActor: 'program_completion_readiness',
  });

  const { data: enrollment, error: enrollmentError } = await db
    .from('program_enrollments')
    .select('id,program_id,course_id,user_id,student_id,status')
    .eq('id', programEnrollmentId)
    .eq('program_id', programId)
    .maybeSingle();
  if (enrollmentError) throw enrollmentError;
  if (!enrollment) throw new Error('Program enrollment not found');
  if (enrollment.user_id !== userId && enrollment.student_id !== userId) {
    throw new Error('Program enrollment does not belong to learner');
  }

  const { data: program, error: programError } = await db
    .from('programs')
    .select(
      'id,slug,title,name,issuance_policy,min_rti_hours,min_ojl_hours,requires_instructor_attestation,min_engagement_hours,non_exam_program',
    )
    .eq('id', programId)
    .maybeSingle();
  if (programError) throw programError;
  if (!program) throw new Error('Program not found');

  const requiredCourseIds = await getRequiredCourseIds(programId, enrollment.course_id);
  const missingRequirements: string[] = [];
  const evidence: Record<string, unknown> = {};

  if (!requiredCourseIds.length) {
    missingRequirements.push('Program has no required course configured');
  }

  const courseStatuses = await Promise.all(
    requiredCourseIds.map(async (courseId) => ({
      courseId,
      status: await checkCourseCompletion(userId, courseId),
    })),
  );
  const completedCourses = courseStatuses.filter(({ status }) => status.isComplete).length;
  for (const { courseId, status } of courseStatuses) {
    if (!status.isComplete) {
      missingRequirements.push(
        `Course ${courseId}: ${status.missingRequirements.join('; ') || 'completion requirements not met'}`,
      );
    }
  }

  const programRulesPassed = await evaluateProgramCompletion(programId, {
    totalRequiredCourses: requiredCourseIds.length,
    completedCourses,
  });
  if (!programRulesPassed) {
    missingRequirements.push('Program completion rule requirements are not satisfied');
  }

  if (program.issuance_policy === 'apprenticeship_certificate') {
    const apprenticeship = await checkApprenticeshipEligibility(db, userId, {
      min_ojl_hours: program.min_ojl_hours,
      min_rti_hours: program.min_rti_hours,
      slug: program.slug,
    });
    evidence.apprenticeship = apprenticeship.evidence;
    if (!apprenticeship.eligible) {
      missingRequirements.push(...apprenticeship.blockingReasons);
    }
  }

  const minEngagementHours = Number(program.min_engagement_hours || 0);
  if (minEngagementHours > 0 && requiredCourseIds.length) {
    const { data: progressRows, error: progressError } = await db
      .from('lesson_progress')
      .select('time_spent_seconds')
      .eq('user_id', userId)
      .in('course_id', requiredCourseIds);
    if (progressError) throw progressError;
    const engagementSeconds = (progressRows ?? []).reduce(
      (sum, row) => sum + Math.max(0, Number(row.time_spent_seconds) || 0),
      0,
    );
    const engagementHours = Math.round((engagementSeconds / 3600) * 10) / 10;
    evidence.engagement = { hours: engagementHours, requiredHours: minEngagementHours };
    if (engagementHours < minEngagementHours) {
      missingRequirements.push(
        `Instructional engagement: ${engagementHours} of ${minEngagementHours} hour(s) recorded`,
      );
    }
  }

  if (program.requires_instructor_attestation) {
    const { data: attestations, error: attestationError } = await db
      .from('instructor_attestations')
      .select('id,attestation_type,hours_attested,attested_at')
      .eq('student_id', userId)
      .eq('program_id', programId);
    if (attestationError) throw attestationError;

    const attestedHours = (attestations ?? []).reduce(
      (sum, attestation) => sum + Math.max(0, Number(attestation.hours_attested) || 0),
      0,
    );
    evidence.instructorAttestation = {
      count: attestations?.length ?? 0,
      hours: attestedHours,
      types: [...new Set((attestations ?? []).map((row) => row.attestation_type).filter(Boolean))],
    };
    if (!attestations?.length) {
      missingRequirements.push('Required instructor attestation is missing');
    }
    if (minEngagementHours > 0 && attestedHours < minEngagementHours) {
      missingRequirements.push(
        `Instructor-attested engagement: ${attestedHours} of ${minEngagementHours} hour(s) required`,
      );
    }
  }

  const credentialGate = await checkCertificateIssuanceEligibility(userId, programId);
  evidence.credentialGate = credentialGate;
  if (!credentialGate.eligible) {
    missingRequirements.push(credentialGate.reason || 'Primary credential requirements are not satisfied');
  }

  return {
    ready: missingRequirements.length === 0,
    enrollmentId: programEnrollmentId,
    programId,
    userId,
    requiredCourseIds,
    completedCourses,
    totalRequiredCourses: requiredCourseIds.length,
    missingRequirements,
    evidence,
  };
}

export async function checkProgramCompletion(
  userId: string,
  courseId: string,
): Promise<Array<{ program_enrollment_id: string; program_id: string; user_id: string }>> {
  const db = await createAuditedAdminClient({
    actorUserId: userId,
    systemActor: 'program_completion_check',
  });

  const [{ data: directLinks, error: directLinkError }, { data: course, error: courseError }] =
    await Promise.all([
      db.from('program_courses').select('program_id').eq('course_id', courseId).eq('is_required', true),
      db.from('courses').select('program_id').eq('id', courseId).maybeSingle(),
    ]);
  if (directLinkError) throw directLinkError;
  if (courseError) throw courseError;

  const linkedProgramIds = [
    ...new Set(
      [...(directLinks ?? []).map((link) => link.program_id), course?.program_id].filter(Boolean),
    ),
  ] as string[];
  if (!linkedProgramIds.length) return [];

  const { data: enrollments, error: enrollmentError } = await db
    .from('program_enrollments')
    .select('id,program_id,status,user_id,student_id')
    .or(`user_id.eq.${userId},student_id.eq.${userId}`)
    .in('program_id', linkedProgramIds);
  if (enrollmentError) throw enrollmentError;

  const completedPrograms: Array<{
    program_enrollment_id: string;
    program_id: string;
    user_id: string;
  }> = [];

  for (const enrollment of enrollments ?? []) {
    if (!enrollment.program_id || enrollment.status?.toLowerCase() === 'completed') continue;
    const readiness = await checkProgramReadiness(enrollment.id, userId, enrollment.program_id);
    if (readiness.requiredCourseIds.includes(courseId) && readiness.ready) {
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
  // Re-check every gate here. Never trust a caller's prior readiness result.
  const readiness = await checkProgramReadiness(programEnrollmentId, userId, programId);
  if (!readiness.ready) {
    throw new Error(`Program requirements not met: ${readiness.missingRequirements.join('; ')}`);
  }

  const db = await createAuditedAdminClient({
    actorUserId: userId,
    systemActor: 'program_completion',
  });

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
  const programHours = program.required_hours ?? program.total_hours ?? program.training_hours ?? null;

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
    .eq('id', programEnrollmentId)
    .eq('program_id', programId);
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
        courses_completed: readiness.completedCourses,
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
