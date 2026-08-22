/**
 * AUTHORITATIVE CERTIFICATE ISSUANCE SERVICE
 *
 * Single source of truth for Elevate-issued completion certificates.
 * This service is intentionally limited to durable credential creation and
 * learner notification. It never decides whether a program enrollment is
 * complete; program completion is owned by lib/lms/completion-evaluator.ts.
 */

import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export interface CompetencyEvidence {
  quizScores?: Record<string, number>;
  seatTimeHours?: number;
  seatTimeSeconds?: number;
  examSessionId?: string | null;
  examProvider?: string | null;
  examResult?: string | null;
  examScore?: number | null;
  examProctorId?: string | null;
  examDate?: string | null;
  completionVerifiedAt?: string;
  completionMethod?: string;
}

export interface IssueCertificateParams {
  supabase: SupabaseClient;
  enrollmentId: string;
  studentId: string;
  courseId?: string;
  programId?: string;
  studentName: string;
  studentEmail?: string;
  courseTitle?: string;
  programName?: string;
  programHours?: number | null;
  competencyEvidence?: CompetencyEvidence;
  templateId?: string | null;
  signedBy?: string | null;
  issuedBy?: string | null;
  issueDate?: string | null;
}

export interface IssuedCertificateSummary {
  id: string;
  certificate_number: string;
  student_name: string;
  program_name: string;
  completion_date: string;
  issued_at: string;
  verification_url: string;
  url: string;
}

export interface IssueCertificateResult {
  success: boolean;
  alreadyIssued: boolean;
  certificate?: IssuedCertificateSummary;
  error?: string;
}

async function findExistingCertificate(
  supabase: SupabaseClient,
  params: Pick<IssueCertificateParams, 'enrollmentId' | 'studentId' | 'courseId' | 'programId'>,
) {
  const { enrollmentId, studentId, courseId, programId } = params;

  if (courseId) {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .or(`student_id.eq.${studentId},user_id.eq.${studentId}`)
      .eq('course_id', courseId)
      .order('issued_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  if (programId) {
    const { data, error } = await supabase
      .from('certificates')
      .select('*')
      .or(`student_id.eq.${studentId},user_id.eq.${studentId}`)
      .eq('program_id', programId)
      .is('course_id', null)
      .order('issued_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('enrollment_id', enrollmentId)
    .order('issued_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function normalizeIssueDate(value?: string | null): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00.000Z` : value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export async function issueCertificate(
  params: IssueCertificateParams,
): Promise<IssueCertificateResult> {
  const {
    supabase,
    enrollmentId,
    studentId,
    courseId,
    programId,
    studentName,
    studentEmail,
    courseTitle,
    programName,
    programHours,
    competencyEvidence,
    templateId,
    signedBy,
    issuedBy,
    issueDate,
  } = params;

  if (Boolean(courseId) === Boolean(programId)) {
    return {
      success: false,
      alreadyIssued: false,
      error: 'Certificate issuance requires exactly one scope: courseId or programId',
    };
  }

  try {
    const existingCert = await findExistingCertificate(supabase, {
      enrollmentId,
      studentId,
      courseId,
      programId,
    });

    if (existingCert) {
      const certificateUrl = `${process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl}/certificates/${existingCert.id}`;
      const issuedAt = existingCert.issued_at || existingCert.metadata?.completion_date || '';
      const verificationUrl =
        existingCert.verification_url ||
        `${process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl}/verify/${String(existingCert.verification_code || '').toLowerCase()}`;
      return {
        success: true,
        alreadyIssued: true,
        certificate: {
          id: existingCert.id,
          certificate_number: existingCert.certificate_number,
          student_name: existingCert.student_name || existingCert.metadata?.student_name || studentName,
          program_name:
            existingCert.program_name ||
            existingCert.course_title ||
            existingCert.metadata?.course_name ||
            programName ||
            courseTitle ||
            'Completion',
          completion_date: issuedAt,
          issued_at: issuedAt,
          verification_url: verificationUrl,
          url: certificateUrl,
        },
      };
    }

    const certificateNumber = `EFH-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`;
    const completionDate = normalizeIssueDate(issueDate);
    const verificationCode = certificateNumber.split('-').pop() || certificateNumber;
    const displayName = programName || courseTitle || 'Completion';

    const certMetadata: Record<string, unknown> = {
      issued_via: 'canonical_issue_certificate',
      scope: programId ? 'program' : 'course',
      student_name: studentName,
      completion_date: completionDate,
      completion_method: competencyEvidence?.completionMethod || 'verified_completion',
    };

    if (competencyEvidence?.quizScores && Object.keys(competencyEvidence.quizScores).length > 0) {
      certMetadata.quiz_scores = competencyEvidence.quizScores;
    }
    if (competencyEvidence?.seatTimeHours != null) {
      certMetadata.seat_time_hours = competencyEvidence.seatTimeHours;
      certMetadata.seat_time_seconds = competencyEvidence.seatTimeSeconds;
    }
    if (competencyEvidence?.examSessionId) {
      certMetadata.exam_session_id = competencyEvidence.examSessionId;
      certMetadata.exam_provider = competencyEvidence.examProvider;
      certMetadata.exam_result = competencyEvidence.examResult;
      certMetadata.exam_score = competencyEvidence.examScore;
      certMetadata.exam_proctor_id = competencyEvidence.examProctorId;
      certMetadata.exam_date = competencyEvidence.examDate;
    }
    if (competencyEvidence?.completionVerifiedAt) {
      certMetadata.completion_verified_at = competencyEvidence.completionVerifiedAt;
    }

    const verificationUrl = `${process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl}/verify/${verificationCode.toLowerCase()}`;
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        user_id: studentId,
        student_id: studentId,
        student_name: studentName,
        student_email: studentEmail || null,
        course_id: courseId || null,
        program_id: programId || null,
        enrollment_id: enrollmentId,
        certificate_number: certificateNumber,
        course_title: courseTitle || null,
        program_name: programName || null,
        title: displayName,
        certificate_type: programId ? 'PROGRAM_COMPLETION' : 'COURSE_COMPLETION',
        status: 'issued',
        issued_date: completionDate.split('T')[0],
        completion_date: completionDate.split('T')[0],
        hours_completed: competencyEvidence?.seatTimeHours ?? programHours ?? null,
        issued_at: completionDate,
        exam_session_id: competencyEvidence?.examSessionId || null,
        verification_code: verificationCode,
        verification_url: verificationUrl,
        metadata: certMetadata,
        template_id: templateId || null,
        signed_by: signedBy || PLATFORM_DEFAULTS.orgName,
        issued_by: issuedBy || null,
      })
      .select()
      .single();

    if (certError || !certificate) {
      const raced = await findExistingCertificate(supabase, {
        enrollmentId,
        studentId,
        courseId,
        programId,
      });
      if (raced) {
        const racedUrl = `${process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl}/certificates/${raced.id}`;
        return {
          success: true,
          alreadyIssued: true,
          certificate: {
            id: raced.id,
            certificate_number: raced.certificate_number,
            student_name: raced.student_name || studentName,
            program_name: raced.program_name || raced.course_title || displayName,
            completion_date: raced.issued_at || completionDate,
            issued_at: raced.issued_at || completionDate,
            verification_url: raced.verification_url || verificationUrl,
            url: racedUrl,
          },
        };
      }
      logger.error('Failed to create certificate', certError as Error);
      return { success: false, alreadyIssued: false, error: 'Failed to create certificate record' };
    }

    const certificateUrl = `${process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl}/certificates/${certificate.id}`;

    if (studentEmail) {
      try {
        const { emailService } = await import('@/lib/notifications/email');
        await emailService.sendCertificateNotification(
          studentEmail,
          studentName,
          displayName,
          certificateUrl,
        );
      } catch (emailError) {
        logger.error('Certificate email failed', emailError as Error, { certificateId: certificate.id });
      }
    }

    try {
      await supabase.from('notifications').insert({
        user_id: studentId,
        type: 'achievement',
        title: 'Certificate Issued!',
        message: `Congratulations! Your certificate for ${displayName} is ready.`,
        action_url: certificateUrl,
      });
    } catch (notificationError) {
      logger.error('Certificate notification failed', notificationError as Error, {
        certificateId: certificate.id,
      });
    }

    return {
      success: true,
      alreadyIssued: false,
      certificate: {
        id: certificate.id,
        certificate_number: certificateNumber,
        student_name: studentName,
        program_name: displayName,
        completion_date: completionDate,
        issued_at: completionDate,
        verification_url: verificationUrl,
        url: certificateUrl,
      },
    };
  } catch (error) {
    logger.error('Certificate issuance error', error as Error, { enrollmentId, courseId, programId });
    return { success: false, alreadyIssued: false, error: 'Operation failed' };
  }
}
