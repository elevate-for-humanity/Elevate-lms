import 'server-only';

/**
 * Canonical program-completion authority.
 *
 * Course-based programs derive completion from program_courses plus canonical
 * course gates. Apprenticeship programs may be competency/hour based and are
 * therefore allowed to complete without a program_courses row only when their
 * registered-program evidence gates pass. This module is the only application
 * service allowed to change a program enrollment to completed.
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

interface ApprenticeshipCriteria {
  required_rti_hours?: number;
  required_ojl_hours?: number;
  required_competencies?: number;
  requires_signed_agreement?: boolean;
  requires_host_shop_verification?: boolean;
  requires_wage_progression_evidence?: boolean;
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

async function evaluateApprenticeshipEvidence(
  db: Awaited<ReturnType<typeof createAuditedAdminClient>>,
  opts: {
    enrollmentId: string;
    userId: string;
    programId: string;
    programSlug: string;
    minOjlHours: number | null;
    minRtiHours: number | null;
    criteria: ApprenticeshipCriteria;
    agreementSigned: boolean | null;
    hostShopId: string | null;
  },
): Promise<{ missing: string[]; evidence: Record<string, unknown> }> {
  const missing: string[] = [];
  const criteriaOjl = Number(opts.criteria.required_ojl_hours || 0);
  const criteriaRti = Number(opts.criteria.required_rti_hours || 0);
  const minOjl = Math.max(Number(opts.minOjlHours || 0), criteriaOjl);
  const minRti = Math.max(Number(opts.minRtiHours || 0), criteriaRti);

  const apprenticeship = await checkApprenticeshipEligibility(db, opts.userId, {
    min_ojl_hours: minOjl,
    min_rti_hours: minRti,
    slug: opts.programSlug,
  });
  if (!apprenticeship.eligible) missing.push(...apprenticeship.blockingReasons);

  if (opts.criteria.requires_signed_agreement && !opts.agreementSigned) {
    missing.push('Signed apprenticeship agreement is required');
  }

  const { data: placement, error: placementError } = await db
    .from('apprentice_placements')
    .select('id,shop_id,status')
    .eq('student_id', opts.userId)
    .eq('program_slug', opts.programSlug)
    .in('status', ['active', 'completed'])
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (placementError) throw placementError;

  if (opts.criteria.requires_host_shop_verification && !opts.hostShopId && !placement?.shop_id) {
    missing.push('Verified apprenticeship host site placement is required');
  }

  const requiredCompetencies = Number(opts.criteria.required_competencies || 0);
  let masteredCompetencies = 0;
  if (requiredCompetencies > 0) {
    const { data: competencies, error: competencyError } = await db
      .from('competencies')
      .select('id')
      .eq('program_id', opts.programId);
    if (competencyError) throw competencyError;
    const competencyIds = (competencies ?? []).map((row) => row.id);
    if (competencyIds.length) {
      const { count, error: masteredError } = await db
        .from('student_competency_progress')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', opts.userId)
        .eq('is_mastered', true)
        .in('competency_id', competencyIds);
      if (masteredError) throw masteredError;
      masteredCompetencies = count ?? 0;
    }
    if (masteredCompetencies < requiredCompetencies) {
      missing.push(
        `Apprenticeship competencies: ${masteredCompetencies} of ${requiredCompetencies} required competencies mastered`,
      );
    }
  }

  let verifiedWageEvidence = 0;
  if (opts.criteria.requires_wage_progression_evidence) {
    const { count, error: wageError } = await db
      .from('apprenticeship_wage_obligations')
      .select('id', { count: 'exact', head: true })
      .eq('enrollment_id', opts.enrollmentId)
      .not('verified_at', 'is', null);
    if (wageError) throw wageError;
    verifiedWageEvidence = count ?? 0;
    if (verifiedWageEvidence === 0) {
      missing.push('Verified wage progression evidence is required');
    }
  }

  return {
    missing,
    evidence: {
      approvedHours: apprenticeship.evidence,
      agreementSigned: Boolean(opts.agreementSigned),
      placementId: placement?.id ?? null,
      hostShopId: opts.hostShopId ?? placement?.shop_id ?? null,
      masteredCompetencies,
      requiredCompetencies,
      verifiedWageEvidence,
    },
  };
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
    .select('id,program_id,course_id,user_id,student_id,status,agreement_signed,host_shop_id')
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
      'id,slug,title,name,issuance_policy,min_rti_hours,min_ojl_hours,requires_instructor_attestation,min_engagement_hours,non_exam_program,completion_criteria',
    )
    .eq('id', programId)
    .maybeSingle();
  if (programError) throw programError;
  if (!program) throw new Error('Program not found');

  const isApprenticeship = program.issuance_policy === 'apprenticeship_certificate';
  const requiredCourseIds = await getRequiredCourseIds(programId, enrollment.course_id);
  const missingRequirements: string[] = [];
  const evidence: Record<string, unknown> = {};

  if (!requiredCourseIds.length && !isApprenticeship) {
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

  if (requiredCourseIds.length) {
    const programRulesPassed = await evaluateProgramCompletion(programId, {
      totalRequiredCourses: requiredCourseIds.length,
      completedCourses,
    });
    if (!programRulesPassed) {
      missingRequirements.push('Program completion rule requirements are not satisfied');
    }
  }

  if (isApprenticeship) {
    const apprenticeship = await evaluateApprenticeshipEvidence(db, {
      enrollmentId: programEnrollmentId,
      userId,
      programId,
      programSlug: program.slug,
      minOjlHours: program.min_ojl_hours,
      minRtiHours: program.min_rti_hours,
      criteria: (program.completion_criteria || {}) as ApprenticeshipCriteria,
      agreementSigned: enrollment.agreement_signed,
      hostShopId: enrollment.host_shop_id,
    });
    evidence.apprenticeship = apprenticeship.evidence;
    missingRequirements.push(...apprenticeship.missing);
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
