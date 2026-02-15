import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export interface EnrollmentOrchestrationResult {
  success: boolean;
  enrollmentId?: string;
  error?: string;
  coursesEnrolled?: number;
  stepsCreated?: number;
  idempotent?: boolean;
}

/**
 * Orchestrate enrollment via atomic database RPC.
 * 
 * All business logic lives in rpc_enroll_student:
 * - Creates program enrollment
 * - Creates course enrollments
 * - Generates steps
 * - Updates profile status
 * - Creates notifications
 * - Writes audit log
 * 
 * This function is a thin wrapper that:
 * 1. Calls the RPC
 * 2. Triggers async email delivery (non-blocking)
 * 
 * Idempotent: safe to retry with same idempotencyKey.
 */
export async function orchestrateEnrollment(params: {
  studentId: string;
  programId: string;
  programHolderId?: string;
  fundingSource?: string;
  idempotencyKey: string;
}): Promise<EnrollmentOrchestrationResult> {
  const supabase = await createClient();
  const {
    studentId,
    programId,
    fundingSource = 'WIOA',
    idempotencyKey,
  } = params;

  try {
    // ========================================
    // SINGLE RPC CALL - ALL LOGIC IN DATABASE
    // ========================================
    const { data, error } = await supabase.rpc('rpc_enroll_student', {
      p_user_id: studentId,
      p_program_id: programId,
      p_idempotency_key: idempotencyKey,
      p_source: 'app',
      p_metadata: {
        funding_source: fundingSource,
      },
    });

    if (error) {
      logger.error('[Enrollment Orchestration] RPC error:', error);
      return {
        success: false,
        error: 'Operation failed',
      };
    }

    // RPC returns JSONB with success/error structure
    if (!data?.success) {
      logger.error('[Enrollment Orchestration] RPC returned failure:', data);
      return {
        success: false,
        error: data?.message || 'Enrollment failed',
      };
    }

    const enrollmentId = data.enrollment_id;
    const coursesEnrolled = data.courses_enrolled || 0;
    const stepsCreated = data.steps_created || 0;
    const isIdempotent = data.idempotent || data.already_enrolled || false;

    logger.info('[Enrollment Orchestration] Success', {
      enrollmentId,
      studentId,
      programId,
      coursesEnrolled,
      stepsCreated,
      idempotent: isIdempotent,
    });

    // ========================================
    // ASYNC EMAIL DELIVERY (non-blocking)
    // ========================================
    // Email is triggered but not awaited - delivery is handled by notification queue
    if (!isIdempotent) {
      triggerWelcomeEmail(supabase, studentId, programId, enrollmentId).catch(err => {
        logger.warn('[Enrollment Orchestration] Email trigger failed (non-blocking):', err);
      });
    }

    return {
      success: true,
      enrollmentId,
      coursesEnrolled,
      stepsCreated,
      idempotent: isIdempotent,
    };

  } catch (error) {
    logger.error('[Enrollment Orchestration] Unexpected error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unexpected error',
    };
  }
}

/**
 * Trigger welcome email via notification queue.
 * Non-blocking - failures don't affect enrollment success.
 */
async function triggerWelcomeEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  studentId: string,
  programId: string,
  enrollmentId: string
): Promise<void> {
  // Get student and program info for email
  const [studentResult, programResult] = await Promise.all([
    supabase.from('profiles').select('full_name, email').eq('id', studentId).single(),
    supabase.from('programs').select('name').eq('id', programId).single(),
  ]);

  const studentName = studentResult.data?.full_name || 'Student';
  const studentEmail = studentResult.data?.email;
  const programName = programResult.data?.name || 'the program';

  if (!studentEmail) {
    logger.warn('[Enrollment Email] No email found for student:', studentId);
    return;
  }

  // Queue email via notification outbox (processed by cron)
  await supabase.from('notification_outbox').insert({
    to_email: studentEmail,
    template_key: 'enrollment_welcome',
    template_data: {
      name: studentName,
      program_name: programName,
      enrollment_id: enrollmentId,
      dashboard_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://elevateforhumanity.com'}/lms`,
    },
    status: 'queued',
    scheduled_for: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  logger.info('[Enrollment Email] Queued welcome email', {
    studentId,
    studentEmail,
    enrollmentId,
  });
}

/**
 * Legacy compatibility wrapper.
 * Maps old parameter names to new RPC-based function.
 */
export async function enrollStudent(params: {
  userId: string;
  programId: string;
  fundingSource?: string;
  idempotencyKey?: string;
}): Promise<EnrollmentOrchestrationResult> {
  return orchestrateEnrollment({
    studentId: params.userId,
    programId: params.programId,
    fundingSource: params.fundingSource,
    idempotencyKey: params.idempotencyKey || `enrollment-${params.userId}-${params.programId}-${Date.now()}`,
  });
}
