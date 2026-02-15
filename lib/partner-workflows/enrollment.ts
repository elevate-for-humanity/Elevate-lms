/**
 * Partner LMS Enrollment Workflows
 * Handles enrollment logic for each external LMS partner
 */

import { createClient } from '@/lib/supabase/client';

export interface EnrollmentRequest {
  studentId: string;
  providerId: string;
  programId?: string;
  sendWelcomeEmail?: boolean;
  autoEnroll?: boolean;
}

export interface EnrollmentResult {
  success: boolean;
  enrollmentId?: string;
  externalId?: string;
  error?: string;
  message?: string;
}

/**
 * Certiport Enrollment Workflow
 * Microsoft Office Specialist certifications
 */
export async function enrollCertiport(
  request: EnrollmentRequest
): Promise<EnrollmentResult> {
  const supabase = createClient();

  try {
    // Fetch student details
    const { data: student } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.studentId)
      .single();

    if (!student) {
      throw new Error('Student not found');
    }

    // Fetch provider details
    const { data: provider } = await supabase
      .from('partner_lms_providers')
      .select('*')
      .eq('id', request.providerId)
      .single();

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Create enrollment record
    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .insert({
        provider_id: request.providerId,
        student_id: request.studentId,
        program_id: request.programId,
        status: 'pending',
        enrolled_at: new Date().toISOString(),
        metadata: {
          provider_type: 'certiport',
          enrollment_method: 'manual',
        },
      })
      .select()
      .single();

    if (enrollmentError) {
      throw enrollmentError;
    }

    // Send welcome email if requested
    if (request.sendWelcomeEmail) {
      await supabase.functions.invoke('send-partner-welcome-email', {
        body: {
          enrollment_id: enrollment.id,
          provider_id: request.providerId,
          student_id: request.studentId,
        },
      });
    }

    return {
      success: true,
      enrollmentId: enrollment.id,
      message:
        'Certiport exam enrollment created. Admin will assign a voucher code from the Certiport portal. Student takes the proctored exam on-site.',
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * HSI (Health & Safety Institute) Enrollment Workflow
 */
export async function enrollHSI(
  request: EnrollmentRequest
): Promise<EnrollmentResult> {
  const supabase = createClient();

  try {
    const { data: student } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.studentId)
      .single();

    if (!student) {
      throw new Error('Student not found');
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .insert({
        provider_id: request.providerId,
        student_id: request.studentId,
        program_id: request.programId,
        status: 'pending',
        enrolled_at: new Date().toISOString(),
        metadata: {
          provider_type: 'hsi',
          enrollment_method: 'manual',
        },
      })
      .select()
      .single();

    if (enrollmentError) {
      throw enrollmentError;
    }

    if (request.sendWelcomeEmail) {
      await supabase.functions.invoke('send-partner-welcome-email', {
        body: {
          enrollment_id: enrollment.id,
          provider_id: request.providerId,
          student_id: request.studentId,
        },
      });
    }

    return {
      success: true,
      enrollmentId: enrollment.id,
      message:
        'HSI enrollment created. Student will receive access instructions via email.',
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * JRI (Janitorial Resource Institute) Enrollment Workflow
 */
export async function enrollJRI(
  request: EnrollmentRequest
): Promise<EnrollmentResult> {
  const supabase = createClient();

  try {
    const { data: student } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.studentId)
      .single();

    if (!student) {
      throw new Error('Student not found');
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .insert({
        provider_id: request.providerId,
        student_id: request.studentId,
        program_id: request.programId,
        status: 'pending',
        enrolled_at: new Date().toISOString(),
        metadata: {
          provider_type: 'jri',
          enrollment_method: 'manual',
        },
      })
      .select()
      .single();

    if (enrollmentError) {
      throw enrollmentError;
    }

    if (request.sendWelcomeEmail) {
      await supabase.functions.invoke('send-partner-welcome-email', {
        body: {
          enrollment_id: enrollment.id,
          provider_id: request.providerId,
          student_id: request.studentId,
        },
      });
    }

    return {
      success: true,
      enrollmentId: enrollment.id,
      message:
        'JRI enrollment created. Student will receive course access details.',
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * NRF RISE Up Enrollment Workflow
 * Retail industry training
 */
export async function enrollNRFRiseUp(
  request: EnrollmentRequest
): Promise<EnrollmentResult> {
  const supabase = createClient();

  try {
    const { data: student } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.studentId)
      .single();

    if (!student) {
      throw new Error('Student not found');
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .insert({
        provider_id: request.providerId,
        student_id: request.studentId,
        program_id: request.programId,
        status: 'pending',
        enrolled_at: new Date().toISOString(),
        metadata: {
          provider_type: 'nrf_rise',
          enrollment_method: 'manual',
        },
      })
      .select()
      .single();

    if (enrollmentError) {
      throw enrollmentError;
    }

    if (request.sendWelcomeEmail) {
      await supabase.functions.invoke('send-partner-welcome-email', {
        body: {
          enrollment_id: enrollment.id,
          provider_id: request.providerId,
          student_id: request.studentId,
        },
      });
    }

    return {
      success: true,
      enrollmentId: enrollment.id,
      message:
        'NRF RISE Up enrollment created. Student will receive platform access.',
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * CareerSafe Enrollment Workflow
 * OSHA safety training
 */
export async function enrollCareerSafe(
  request: EnrollmentRequest
): Promise<EnrollmentResult> {
  const supabase = createClient();

  try {
    const { data: student } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.studentId)
      .single();

    if (!student) {
      throw new Error('Student not found');
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .insert({
        provider_id: request.providerId,
        student_id: request.studentId,
        program_id: request.programId,
        status: 'pending',
        enrolled_at: new Date().toISOString(),
        metadata: {
          provider_type: 'careersafe',
          enrollment_method: 'manual',
        },
      })
      .select()
      .single();

    if (enrollmentError) {
      throw enrollmentError;
    }

    if (request.sendWelcomeEmail) {
      await supabase.functions.invoke('send-partner-welcome-email', {
        body: {
          enrollment_id: enrollment.id,
          provider_id: request.providerId,
          student_id: request.studentId,
        },
      });
    }

    return {
      success: true,
      enrollmentId: enrollment.id,
      message:
        'CareerSafe enrollment created. Student will receive OSHA training access.',
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Milady RISE Enrollment Workflow
 * Cosmetology and barbering training
 */
export async function enrollMiladyRISE(
  request: EnrollmentRequest
): Promise<EnrollmentResult> {
  const supabase = createClient();

  try {
    const { data: student } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.studentId)
      .single();

    if (!student) {
      throw new Error('Student not found');
    }

    const { data: provider } = await supabase
      .from('partner_lms_providers')
      .select('*')
      .eq('id', request.providerId)
      .single();

    if (!provider) {
      throw new Error('Provider not found');
    }

    const { data: enrollment, error: enrollmentError } = await supabase
      .from('partner_lms_enrollments')
      .insert({
        provider_id: request.providerId,
        student_id: request.studentId,
        program_id: request.programId,
        status: 'pending',
        enrolled_at: new Date().toISOString(),
        metadata: {
          provider_type: 'milady',
          enrollment_method: 'manual',
          promo_code: provider.promo_code, // efhcti-rise295
        },
      })
      .select()
      .single();

    if (enrollmentError) {
      throw enrollmentError;
    }

    if (request.sendWelcomeEmail) {
      await supabase.functions.invoke('send-partner-welcome-email', {
        body: {
          enrollment_id: enrollment.id,
          provider_id: request.providerId,
          student_id: request.studentId,
        },
      });
    }

    return {
      success: true,
      enrollmentId: enrollment.id,
      message: `Milady RISE enrollment created. Use promo code: ${provider.promo_code}`,
    };
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Universal enrollment function that routes to the correct provider
 */
export async function enrollStudent(
  request: EnrollmentRequest
): Promise<EnrollmentResult> {
  const supabase = createClient();

  try {
    // Fetch provider to determine type
    const { data: provider } = await supabase
      .from('partner_lms_providers')
      .select('provider_type')
      .eq('id', request.providerId)
      .single();

    if (!provider) {
      throw new Error('Provider not found');
    }

    // Route to appropriate enrollment function
    switch (provider.provider_type) {
      case 'certiport':
        return await enrollCertiport(request);
      case 'hsi':
        return await enrollHSI(request);
      case 'jri':
        return await enrollJRI(request);
      case 'nrf_rise':
        return await enrollNRFRiseUp(request);
      case 'careersafe':
        return await enrollCareerSafe(request);
      case 'milady':
        return await enrollMiladyRISE(request);
      default:
        throw new Error(`Unsupported provider type: ${provider.provider_type}`);
    }
  } catch (error) { /* Error handled silently */ 
    return {
      success: false,
      error: 'Operation failed',
    };
  }
}

/**
 * Bulk enrollment function for enrolling multiple students
 */
export async function bulkEnrollStudents(
  studentIds: string[],
  providerId: string,
  programId?: string
): Promise<{
  successful: number;
  failed: number;
  results: EnrollmentResult[];
}> {
  const results: EnrollmentResult[] = [];
  let successful = 0;
  let failed = 0;

  for (const studentId of studentIds) {
    const result = await enrollStudent({
      studentId,
      providerId,
      programId,
      sendWelcomeEmail: true,
      autoEnroll: false,
    });

    results.push(result);
    if (result.success) {
      successful++;
    } else {
      failed++;
    }
  }

  return { successful, failed, results };
}
