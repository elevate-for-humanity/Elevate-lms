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
  enrollmentId: string;
  studentId: string;
  programId: string;
  studentName: string;
  studentEmail: string;
  programName: string;
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
    programId,
    studentName,
    studentEmail,
    programName,
    programHours,
  } = params;

  try {
    // IDEMPOTENCY CHECK: Check if certificate already exists for this enrollment
    const { data: existingCert } = await supabase
      .from('certificates')
      .select('*')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .single();

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
          student_name: existingCert.student_name,
          program_name: existingCert.program_name,
          completion_date: existingCert.completion_date,
          url: certificateUrl,
        },
      };
    }

    // Generate certificate number
    const certificateNumber = `EFH-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const completionDate = new Date().toISOString();

    // Create certificate record
    const { data: certificate, error: certError } = await supabase
      .from('certificates')
      .insert({
        student_id: studentId,
        program_id: programId,
        certificate_number: certificateNumber,
        student_name: studentName,
        program_name: programName,
        completion_date: completionDate,
        program_hours: programHours,
        issued_at: completionDate,
        status: 'active',
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

    try {
      const { emailService } = await import('@/lib/notifications/email');
      await emailService.sendCertificateNotification(
        studentEmail,
        studentName,
        programName,
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

    // Create in-app notification
    await supabase
      .from('notifications')
      .insert({
        user_id: studentId,
        type: 'achievement',
        title: 'Certificate Issued!',
        message: `Congratulations! Your certificate for ${programName} is ready.`,
        action_url: certificateUrl,
      });

    return {
      success: true,
      alreadyIssued: false,
      certificate: {
        id: certificate.id,
        certificate_number: certificateNumber,
        student_name: studentName,
        program_name: programName,
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
