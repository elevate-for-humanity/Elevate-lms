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
    // hours_completed, issued_date
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
        hours_completed: programHours || null,
        issued_at: completionDate,
        verification_code: certificateNumber.split('-').pop(),
        verification_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/verify/${certificateNumber.split('-').pop()?.toLowerCase()}`,
        metadata: {
          issued_via: 'canonical_issue_certificate',
          student_name: studentName,
          completion_date: completionDate,
        },
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
      .from('enrollments')
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

    // Send certificate delivery email
    const certificateUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org'}/certificates/${certificate.id}`;

    if (studentEmail) {
    try {
      const { emailService } = await import('@/lib/notifications/email');
      await emailService.sendCertificateNotification(
        studentEmail,
        studentName,
        displayName,
        certificateUrl
      );
      logger.info('Certificate delivery email sent', {
        email: studentEmail,
        certificateId: certificate.id,
      });
    } catch (emailError) {
      logger.error('Certificate email failed', emailError as Error);
      // Don't fail - certificate is issued
    }
    } // end if (studentEmail)

    // Create in-app notification
    await supabase
      .from('notifications')
      .insert({
        user_id: studentId,
        type: 'achievement',
        title: 'Certificate Issued!',
        message: `Congratulations! Your certificate for ${displayName} is ready.`,
        action_url: certificateUrl,
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
