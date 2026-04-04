/**
 * Partner LMS Certificate Generation
 * Generates completion certificates for partner certifications
 */

import { createClient } from '@/lib/supabase/client';

export interface CertificateData {
  studentName: string;
  providerName: string;
  courseName?: string;
  completedAt: string;
  certificateNumber: string;
  expiresAt?: string;
}

/**
 * Generate certificate number
 */
export function generateCertificateNumber(
  providerType: string,
  studentId: string
): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  const prefix = providerType.substring(0, 3).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

/**
 * Create certificate record
 */
export async function createCertificate(
  enrollmentId: string
): Promise<{ success: boolean; certificateId?: string; error?: string }> {
  const supabase = createClient();

  try {
    // Fetch enrollment details
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .select(
        `
        *,
        provider:partner_lms_providers(*),
        student:profiles(*),
        program:programs(*)
      `
      )
      .eq('id', enrollmentId)
      .single();

    if (enrollmentError || !enrollment) {
      throw new Error('Enrollment not found');
    }

    if (enrollment.status !== 'completed') {
      throw new Error('Enrollment not completed');
    }

    // Check if certificate already exists
    const { data: existingCert } = await supabase
      .from('partner_certificates')
      .select('id')
      .eq('enrollment_id', enrollmentId)
      .single();

    if (existingCert) {
      return {
        success: true,
        certificateId: existingCert.id,
      };
    }

    // Generate certificate number
    const certificateNumber = generateCertificateNumber(
      enrollment.provider.provider_type,
      enrollment.student_id
    );

    // Create certificate record
    const { data: certificate, error: certError } = await supabase
      .from('partner_certificates')
      .insert({
        enrollment_id: enrollmentId,
        student_id: enrollment.student_id,
        provider_id: enrollment.provider_id,
        program_id: enrollment.program_id,
        certificate_number: certificateNumber,
        student_name: enrollment.student.full_name || enrollment.student.email,
        provider_name: enrollment.provider.provider_name,
        course_name: enrollment.course_name || enrollment.program?.title,
        issued_at: new Date().toISOString(),
        completed_at: enrollment.completed_at,
        expires_at: calculateExpirationDate(enrollment.provider.provider_type),
        metadata: {
          provider_type: enrollment.provider.provider_type,
          external_certificate_id: enrollment.external_certificate_id,
        },
      })
      .select()
      .single();

    if (certError) {
      throw certError;
    }

    // Update enrollment with certificate ID
    await supabase
      .from('partner_lms_enrollments')
      .update({ certificate_id: certificate.id })
      .eq('id', enrollmentId);

    // Send completion email with certificate
    await supabase.functions.invoke('send-partner-completion-email', {
      body: {
        enrollment_id: enrollmentId,
        certificate_id: certificate.id,
        student_id: enrollment.student_id,
      },
    });

    return {
      success: true,
      certificateId: certificate.id,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Calculate expiration date based on provider type
 */
function calculateExpirationDate(providerType: string): string | null {
  const now = new Date();

  switch (providerType) {
    case 'hsi':
      // HSI certifications typically expire after 2 years
      now.setFullYear(now.getFullYear() + 2);
      return now.toISOString();

    case 'careersafe':
      // OSHA certifications don't expire but recommended renewal every 3 years
      now.setFullYear(now.getFullYear() + 3);
      return now.toISOString();

    case 'certiport':
    case 'jri':
    case 'nrf_rise':
    case 'elevate_lms':
      // These certifications typically don't expire
      return null;

    default:
      return null;
  }
}

/**
 * Generate certificate PDF
 */
export async function generateCertificatePDF(
  certificateId: string
): Promise<{ success: boolean; pdfUrl?: string; error?: string }> {
  const supabase = createClient();

  try {
    // Fetch certificate details
    const { data: certificate, error: certError } = await supabase
      .from('partner_certificates')
      .select('*')
      .eq('id', certificateId)
      .single();

    if (certError || !certificate) {
      throw new Error('Certificate not found');
    }

    // Generate PDF using edge function
    const { data, error }: any = await supabase.functions.invoke(
      'generate-certificate-pdf',
      {
        body: {
          certificate_id: certificateId,
          student_name: certificate.student_name,
          provider_name: certificate.provider_name,
          course_name: certificate.course_name,
          certificate_number: certificate.certificate_number,
          issued_at: certificate.issued_at,
          completed_at: certificate.completed_at,
        },
      }
    );

    if (error) {
      throw error;
    }

    return {
      success: true,
      pdfUrl: data.pdf_url,
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Verify certificate authenticity
 */
export async function verifyCertificate(certificateNumber: string): Promise<{
  valid: boolean;
  certificate?: CertificateData;
  error?: string;
}> {
  const supabase = createClient();

  try {
    const { data: certificate, error } = await supabase
      .from('partner_certificates')
      .select('*')
      .eq('certificate_number', certificateNumber)
      .single();

    if (error || !certificate) {
      return {
        valid: false,
        error: 'Certificate not found',
      };
    }

    // Check if expired
    if (certificate.expires_at) {
      const expirationDate = new Date(certificate.expires_at);
      if (expirationDate < new Date()) {
        return {
          valid: false,
          error: 'Certificate has expired',
        };
      }
    }

    return {
      valid: true,
      certificate: {
        studentName: certificate.student_name,
        providerName: certificate.provider_name,
        courseName: certificate.course_name,
        completedAt: certificate.completed_at,
        certificateNumber: certificate.certificate_number,
        expiresAt: certificate.expires_at,
      },
    };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      valid: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Get all certificates for a student
 */
export async function getStudentCertificates(
  studentId: string
): Promise<CertificateData[]> {
  const supabase = createClient();

  const { data: certificates } = await supabase
    .from('partner_certificates')
    .select('*')
    .eq('student_id', studentId)
    .order('issued_at', { ascending: false });

  if (!certificates) {
    return [];
  }

  return certificates.map((cert) => ({
    studentName: cert.student_name,
    providerName: cert.provider_name,
    courseName: cert.course_name,
    completedAt: cert.completed_at,
    certificateNumber: cert.certificate_number,
    expiresAt: cert.expires_at,
  }));
}

/**
 * Revoke certificate
 */
export async function revokeCertificate(
  certificateId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();

  try {
    const { error } = await supabase
      .from('partner_certificates')
      .update({
        revoked: true,
        revoked_at: new Date().toISOString(),
        revocation_reason: reason,
      })
      .eq('id', certificateId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) { /* Error handled silently */ 
    // Error: $1
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Bulk certificate generation for completed enrollments
 */
export async function generateBulkCertificates(
  enrollmentIds: string[]
): Promise<{
  successful: number;
  failed: number;
  results: Array<{
    enrollmentId: string;
    success: boolean;
    certificateId?: string;
    error?: string;
  }>;
}> {
  const results = [];
  let successful = 0;
  let failed = 0;

  for (const enrollmentId of enrollmentIds) {
    const result = await createCertificate(enrollmentId);
    results.push({
      enrollmentId,
      ...result,
    });

    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  return { successful, failed, results };
}
