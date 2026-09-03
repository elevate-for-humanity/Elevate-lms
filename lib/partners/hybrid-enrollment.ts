import { logger } from '@/lib/logger';
// lib/partners/hybrid-enrollment.ts
// Unified enrollment handler that supports both API and link-based modes

import { requireAdminClient } from '@/lib/supabase/admin';
import { getPartnerClient, PartnerType } from './index';
import { setAuditContext } from '@/lib/audit-context';

async function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return await requireAdminClient();
}

export interface HybridEnrollmentRequest {
  userId: string;
  moduleId: string;
  courseId: string;
}

export interface HybridEnrollmentResult {
  success: boolean;
  mode: 'api' | 'link';
  enrollmentId?: string;
  externalEnrollmentId?: string;
  launchUrl?: string;
  error?: string;
}

/**
 * Enroll student in external partner module
 * Automatically detects if API or link-based mode should be used
 */
export async function enrollInExternalModule(
  request: HybridEnrollmentRequest,
): Promise<HybridEnrollmentResult> {
  const supabase = await getSupabaseAdmin();
  await setAuditContext(supabase, {
    actorUserId: request.userId,
    systemActor: 'hybrid_enrollment',
  });
  try {
    // Fetch module details
    const { data: module, error: moduleError } = await supabase
      .from('external_partner_modules')
      .select('*')
      .eq('id', request.moduleId)
      .maybeSingle();

    if (moduleError || !module) {
      throw new Error('Module not found');
    }

    // Fetch student details
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', request.userId)
      .maybeSingle();

    if (studentError || !student) {
      throw new Error('Student not found');
    }

    // Check if API mode is available
    if (
      (module.delivery_mode === 'api' || module.delivery_mode === 'hybrid') &&
      module.partner_type &&
      module.external_course_code
    ) {
      try {
        return await enrollViaAPI(module, student, request, supabase);
      } catch (apiError) {
        // Error: $1
        // Fall back to link mode if hybrid
        if (module.delivery_mode === 'hybrid') {
          return await enrollViaLink(module, request);
        }
        throw apiError;
      }
    }

    // Use link mode
    return await enrollViaLink(module, request);
  } catch (error) {
    /* Error handled silently */
    // Error: $1
    return {
      success: false,
      mode: 'link',
      error: 'Operation failed',
    };
  }
}

async function enrollViaAPI(
  module: any,
  student: any,
  request: HybridEnrollmentRequest,
  supabase: Awaited<ReturnType<typeof getSupabaseAdmin>>,
): Promise<HybridEnrollmentResult> {
  const partnerType = module.partner_type as PartnerType;
  const client = getPartnerClient(partnerType);

  // Create account on partner platform
  const account = await client.createAccount({
    id: student.id,
    email: student.email,
    firstName: (student.full_name ?? '').split(' ')[0] || 'Student',
    lastName: (student.full_name ?? '').split(' ').slice(1).join(' '),
    phone: student.phone,
    dateOfBirth: student.date_of_birth,
  });

  // Enroll in course
  const enrollment = await client.enrollInCourse(account.externalId, module.external_course_code);

  // Get SSO launch URL
  const launchUrl = await client.getSsoLaunchUrl({
    accountExternalId: account.externalId,
    externalEnrollmentId: enrollment.externalEnrollmentId,
    returnTo: `${process.env.NEXT_PUBLIC_APP_URL}/lms/courses/${request.courseId}/external/${request.moduleId}`,
  });

  // Save progress in database
  const { data: progress, error } = await supabase
    .from('external_partner_progress')
    .upsert(
      {
        module_id: request.moduleId,
        user_id: request.userId,
        status: 'in_progress',
        external_enrollment_id: enrollment.externalEnrollmentId,
        external_account_id: account.externalId,
        progress_percentage: 0,
      },
      { onConflict: 'module_id,user_id' },
    )
    .select()
    .maybeSingle();

  if (error) throw error;

  return {
    success: true,
    mode: 'api',
    enrollmentId: progress.id,
    externalEnrollmentId: enrollment.externalEnrollmentId,
    launchUrl,
  };
}

async function enrollViaLink(
  module: any,
  request: HybridEnrollmentRequest,
): Promise<HybridEnrollmentResult> {
  const supabase = await getSupabaseAdmin();
  // Create progress record in link mode
  const { data: progress, error } = await supabase
    .from('external_partner_progress')
    .upsert(
      {
        module_id: request.moduleId,
        user_id: request.userId,
        status: 'not_started',
      },
      { onConflict: 'module_id,user_id' },
    )
    .select()
    .maybeSingle();

  if (error) throw error;

  return {
    success: true,
    mode: 'link',
    enrollmentId: progress.id,
    launchUrl: module.launch_url,
  };
}

/**
 * Sync progress for API-based enrollments
 */
export async function syncExternalModuleProgress(progressId: string): Promise<void> {
  const supabase = await getSupabaseAdmin();
  const { data: progress, error: progressError } = await supabase
    .from('external_partner_progress')
    .select(
      `
      *,
      external_partner_modules (
        partner_type,
        delivery_mode
      )
    `,
    )
    .eq('id', progressId)
    .maybeSingle();

  if (progressError || !progress) {
    throw new Error('Progress record not found');
  }

  // Only sync if API mode and has external enrollment ID
  if (
    !progress.external_enrollment_id ||
    progress.external_partner_modules.delivery_mode === 'link'
  ) {
    return;
  }

  const partnerType = progress.external_partner_modules.partner_type as PartnerType;
  const client = getPartnerClient(partnerType);

  // Fetch progress from partner API
  const partnerProgress = await client.getProgress(progress.external_enrollment_id);

  if (!partnerProgress) return;

  // Update database
  const updates: any = {
    progress_percentage: partnerProgress.percentage,
    status: partnerProgress.completed ? 'approved' : 'in_progress',
  };

  if (partnerProgress.completed && partnerProgress.completedAt) {
    updates.completed_at = partnerProgress.completedAt.toISOString();
    updates.approved_at = new Date().toISOString();
  }

  // Try to fetch certificate if completed
  if (partnerProgress.completed) {
    try {
      const certificate = await client.getCertificate(progress.external_enrollment_id);
      if (certificate) {
        updates.certificate_url = certificate.downloadUrl;
        updates.certificate_number = certificate.certificateNumber;
      }
    } catch (certError) {
      logger.error('Error:', certError);
    }
  }

  await supabase.from('external_partner_progress').update(updates).eq('id', progressId);
}

/**
 * Sync all active API-based enrollments
 */
export async function syncAllExternalModules(): Promise<void> {
  const supabase = await getSupabaseAdmin();
  const { data: activeProgress } = await supabase
    .from('external_partner_progress')
    .select(
      `
      id,
      external_enrollment_id,
      external_partner_modules (
        delivery_mode
      )
    `,
    )
    .in('status', ['in_progress'])
    .not('external_enrollment_id', 'is', null);

  if (!activeProgress || activeProgress.length === 0) return;

  for (const progress of activeProgress) {
    // Only sync API-based enrollments
    if (
      (progress.external_partner_modules as any).delivery_mode === 'api' ||
      (progress.external_partner_modules as any).delivery_mode === 'hybrid'
    ) {
      try {
        await syncExternalModuleProgress(progress.id);
        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        logger.error(`[HybridEnrollment] Sync failed for ${progress.id}:`, error);
      }
    }
  }
}
