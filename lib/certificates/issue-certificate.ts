/**
 * AUTHORITATIVE CERTIFICATE ISSUANCE SERVICE
 * 
 * This is the single source of truth for issuing certificates.
 * All certificate issuance MUST go through this service.
 * 
 * Features:
 * - Idempotent: will not create duplicate certificates
 * - Sends delivery email automatically
 * - Updates enrollment status
 */

import { SupabaseClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { enqueueJob } from '@/lib/jobs/enqueue';

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
  enrollmentId?: string;
  studentId: string;
  courseId?: string;
  programId?: string;
  studentName: string;
  studentEmail?: string;
  courseTitle?: string;
  programName?: string;
  programHours?: number | null;
  competencyEvidence?: CompetencyEvidence;
}

export interface IssueCertificateResult {
  success: boolean;
  alreadyIssued: boolean;
  certificate?: {
    id: string;
    certificate_number: string;
    student_name: string;
    program_name: string;
    completion_date: string;
    url: string;
  };
  error?: string;
}

/**
 * Issue a certificate for a completed program enrollment.
 * Idempotent - returns existing certificate if already issued.
 */
export async function issueCertificate(
  params: IssueCertificateParams
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
  } = params;

  try {
    // IDEMPOTENCY CHECK: Check if certificate already exists
    let existingQuery = supabase
      .from('certificates')
      .select('*')
      .or(`student_id.eq.${studentId},user_id.eq.${studentId}`);

    if (courseId) {
      existingQuery = existingQuery.eq('course_id', courseId);
    } else if (programId) {
      existingQuery = existingQuery.eq('program_id', programId);
    }

    const { data: existingCert } = await existingQuery.maybeSingle();

    if (existingCert) {
      logger.info('Certificate already exists, returning existing', {
        enrollmentId,
        certificateId: existingCert.id,
      });

      const certificateUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/certificates/${existingCert.id}`;

      return {
        success: true,
        alreadyIssued: true,
        certificate: {
          id: existingCert.id,
          certificate_number: existingCert.certificate_number,
          student_name: existingCert.metadata?.student_name || studentName,
          program_name: existingCert.program_name || existingCert.course_title || existingCert.metadata?.course_name || programName || courseTitle || 'Course',
          completion_date: existingCert.issued_at || existingCert.metadata?.completion_date || '',
          url: certificateUrl,
        },
      };
    }

    // Generate certificate number
    const certificateNumber = `EFH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const completionDate = new Date().toISOString();

    const displayName = programName || courseTitle || 'Course Completion';

    // Create certificate record
    // Table columns: id, user_id, course_id, enrollment_id, certificate_number,
    // issued_at, expires_at, pdf_url, verification_url, metadata, created_at,
    // tenant_id, student_id, verification_code, course_title, program_name,
    // Build metadata with competency evidence when available
    const certMetadata: Record<string, any> = {
      issued_via: 'canonical_issue_certificate',
      student_name: studentName,
      completion_date: completionDate,
      completion_method: competencyEvidence?.completionMethod || 'legacy_completion',
    };

    if (competencyEvidence) {
      if (competencyEvidence.quizScores && Object.keys(competencyEvidence.quizScores).length > 0) {
        certMetadata.quiz_scores = competencyEvidence.quizScores;
      }
      if (competencyEvidence.seatTimeHours != null) {
        certMetadata.seat_time_hours = competencyEvidence.seatTimeHours;
        certMetadata.seat_time_seconds = competencyEvidence.seatTimeSeconds;
      }
      if (competencyEvidence.examSessionId) {
        certMetadata.exam_session_id = competencyEvidence.examSessionId;
        certMetadata.exam_provider = competencyEvidence.examProvider;
        certMetadata.exam_result = competencyEvidence.examResult;
        certMetadata.exam_score = competencyEvidence.examScore;
        certMetadata.exam_proctor_id = competencyEvidence.examProctorId;
        certMetadata.exam_date = competencyEvidence.examDate;
      }
      if (competencyEvidence.completionVerifiedAt) {
        certMetadata.completion_verified_at = competencyEvidence.completionVerifiedAt;
      }
    }

    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        user_id: studentId,
        student_id: studentId,
        course_id: courseId || null,
        enrollment_id: enrollmentId || null,
        certificate_number: certificateNumber,
        course_title: courseTitle || null,
        program_name: programName || null,
        issued_date: completionDate.split('T')[0],
        hours_completed: competencyEvidence?.seatTimeHours || programHours || null,
        issued_at: completionDate,
        exam_session_id: competencyEvidence?.examSessionId || null,
        verification_code: certificateNumber.split('-').pop(),
        verification_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/verify/${certificateNumber.split('-').pop()?.toLowerCase()}`,
        metadata: certMetadata,
      })
      .select()
      .single();

    if (certError) {
      logger.error('Failed to create certificate', certError as Error);
      return {
        success: false,
        alreadyIssued: false,
        error: 'Failed to create certificate record',
      };
    }

    logger.info('Certificate created', {
      certificateId: certificate.id,
      certificateNumber,
      enrollmentId,
    });

    // Update enrollment with completion and certificate reference
    const { error: updateError } = await supabase
      .from('program_enrollments')
      .update({
        status: 'completed',
        completed_at: completionDate,
        certificate_id: certificate.id,
        certificate_issued_at: completionDate,
        updated_at: completionDate,
      })
      .eq('id', enrollmentId);

    if (updateError) {
      logger.error('Failed to update enrollment', updateError as Error);
      // Certificate was created, continue to email
    }

    const certificateUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/certificates/${certificate.id}`;

    // Enqueue side effects — email, notification, verification index.
    // Certificate is already issued at this point; a failed enqueue must not
    // affect the response. The job processor handles retries.
    await enqueueJob(supabase, 'certificate_issued', {
      certificateId: certificate.id,
      learnerId: studentId,
      learnerEmail: studentEmail,
      learnerName: studentName,
      programId: programId ?? undefined,
      courseId: courseId ?? undefined,
      credentialName: displayName,
      certificateUrl,
    });

    return {
      success: true,
      alreadyIssued: false,
      certificate: {
        id: certificate.id,
        certificate_number: certificateNumber,
        student_name: studentName,
        program_name: displayName,
        completion_date: completionDate,
        url: certificateUrl,
      },
    };
  } catch (error) {
    logger.error('Certificate issuance error', error as Error, { enrollmentId });
    return {
      success: false,
      alreadyIssued: false,
      error: 'Operation failed',
    };
  }
}
