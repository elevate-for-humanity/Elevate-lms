/**
 * PARIS Enrollment Service
 * 
 * Handles the final step of the application workflow:
 * moving an accepted application to enrolled status.
 * 
 * This service:
 * 1. Verifies all prerequisites are met
 * 2. Calls provisioning service to create all required records
 * 3. Updates the application status
 * 4. Publishes events for ZORA
 */

import { transitionApplication } from './application-service';
import { publishApplicationEvent } from '@/lib/events/event-bus';
import { provisionEnrollment, type ProvisioningResult } from './provisioning-service';

// ============================================
// TYPES
// ============================================

interface EnrollmentInput {
  applicationId: string;
  enrolledById: string;
}

interface EnrollmentResult {
  id: string;
  applicationId: string;
  enrollmentId: string;
  lmsUserId: string;
  dashboardId: string;
  apprenticeRecordId?: string;
  provisioningResult?: ProvisioningResult;
}

// ============================================
// ENROLLMENT
// ============================================

/**
 * Enroll an accepted applicant into the LMS
 * 
 * This function is idempotent - calling it multiple times
 * with the same applicationId will return the existing
 * enrollment without creating duplicates.
 */
export async function enrollAcceptedApplicant(
  input: EnrollmentInput,
): Promise<EnrollmentResult> {
  // Check for existing enrollment (idempotency) via provisioning service
  const provisioningResult = await provisionEnrollment({
    applicationId: input.applicationId,
    enrolledById: input.enrolledById,
  });
  
  if (!provisioningResult.success) {
    throw new Error(
      `Enrollment provisioning failed: ${provisioningResult.error || 'Unknown error'}`
    );
  }
  
  // Transition application to ENROLLED
  await transitionApplication(input.applicationId, 'ENROLLED', {
    actorId: input.enrolledById,
    actorType: 'ADMISSIONS',
    reason: 'Account, dashboard, LMS enrollment, onboarding, videos, binder, schedule, and program-specific records were verified.',
  });
  
  // Publish enrollment event for ZORA
  await publishApplicationEvent({
    type: 'application.enrolled',
    applicationId: input.applicationId,
    enrollmentId: provisioningResult.enrollmentId || '',
  });
  
  return {
    id: provisioningResult.enrollmentId || '',
    applicationId: input.applicationId,
    enrollmentId: provisioningResult.enrollmentId || '',
    lmsUserId: provisioningResult.lmsUserId || '',
    dashboardId: provisioningResult.dashboardId || '',
    apprenticeRecordId: provisioningResult.apprenticeRecordId,
    provisioningResult,
  };
}

/**
 * Check enrollment prerequisites
 * Returns array of issues that must be resolved before enrollment
 */
export async function checkEnrollmentPrerequisites(
  applicationId: string,
): Promise<{
  ready: boolean;
  issues: Array<{
    type: 'document' | 'funding' | 'payment' | 'signature';
    code: string;
    message: string;
  }>;
}> {
  const supabase = getServiceClient();
  
  const { data: application, error } = await supabase
    .from('paris_applications')
    .select(`
      *,
      documents:paris_application_documents(*),
      funding_cases:paris_funding_cases(*)
    `)
    .eq('id', applicationId)
    .single();
  
  if (error || !application) {
    return {
      ready: false,
      issues: [{
        type: 'document',
        code: 'APPLICATION_NOT_FOUND',
        message: 'Application not found',
      }],
    };
  }
  
  const issues: Array<{
    type: 'document' | 'funding' | 'payment' | 'signature';
    code: string;
    message: string;
  }> = [];
  
  // Check status
  if (application.workflow_status !== 'READY_TO_ENROLL') {
    issues.push({
      type: 'document',
      code: 'INVALID_STATUS',
      message: `Application must be READY_TO_ENROLL. Current: ${application.workflow_status}`,
    });
  }
  
  // Check documents
  for (const doc of application.documents ?? []) {
    if (['REQUIRED', 'REQUESTED', 'UPLOADED', 'UNDER_REVIEW', 'REJECTED', 'EXPIRED'].includes(doc.status)) {
      issues.push({
        type: 'document',
        code: doc.requirement_code,
        message: `Document required: ${doc.display_name}`,
      });
    }
  }
  
  // Check funding
  const pendingFunding = application.funding_cases?.filter(
    (fc: { status: string }) => ['NOT_STARTED', 'SCREENING', 'SUBMITTED'].includes(fc.status),
  ) ?? [];
  
  if (pendingFunding.length > 0) {
    for (const fc of pendingFunding) {
      issues.push({
        type: 'funding',
        code: fc.funding_type,
        message: `Funding application pending: ${fc.funding_type}`,
      });
    }
  }
  
  return {
    ready: issues.length === 0,
    issues,
  };
}

/**
 * Get enrollment details for an application
 */
export async function getEnrollmentDetails(
  applicationId: string,
): Promise<{
  enrolled: boolean;
  enrolledAt?: string;
  enrollmentId?: string;
  dashboardUrl?: string;
  lmsUserId?: string;
  apprenticeRecordId?: string;
} | null> {
  const supabase = getServiceClient();
  
  const { data: enrollment, error } = await supabase
    .from('paris_application_enrollments')
    .select('*')
    .eq('application_id', applicationId)
    .single();
  
  if (error || !enrollment) {
    return null;
  }
  
  // Build dashboard URL
  let dashboardUrl: string | undefined;
  if (enrollment.student_dashboard_id) {
    dashboardUrl = `/learner/dashboard?enrollment=${enrollment.student_dashboard_id}`;
  }
  
  return {
    enrolled: true,
    enrolledAt: enrollment.created_at,
    enrollmentId: enrollment.enrollment_id ?? undefined,
    dashboardUrl,
    lmsUserId: enrollment.lms_user_id ?? undefined,
    apprenticeRecordId: enrollment.apprentice_record_id ?? undefined,
  };
}

/**
 * Withdraw enrollment
 * Used when student withdraws or is dismissed
 */
export async function withdrawEnrollment(
  applicationId: string,
  withdrawnById: string,
  reason: string,
): Promise<void> {
  const supabase = getServiceClient();
  
  // Get enrollment
  const { data: enrollment } = await supabase
    .from('paris_application_enrollments')
    .select('*')
    .eq('application_id', applicationId)
    .single();
  
  if (enrollment) {
    // TODO: Call LMS to unenroll
    // await unenrollFromLms(applicationId);
    
    // Delete enrollment record
    await supabase
      .from('paris_application_enrollments')
      .delete()
      .eq('application_id', applicationId);
  }
  
  // Transition to withdrawn
  await transitionApplication(applicationId, 'WITHDRAWN', {
    actorId: withdrawnById,
    actorType: 'ADMISSIONS',
    reason,
  });
}
