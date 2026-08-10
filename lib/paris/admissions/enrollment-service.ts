/**
 * PARIS Enrollment Service
 * Handles accepted application -> provisioned enrollment transitions.
 */

import { transitionApplication } from './application-service';
import { publishApplicationEvent } from '@/lib/events/event-bus';
import { provisionEnrollment, type ProvisioningResult } from './provisioning-service';
import { requireAdminClient } from '@/lib/supabase/admin';

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

export async function enrollAcceptedApplicant(input: EnrollmentInput): Promise<EnrollmentResult> {
  const provisioningResult = await provisionEnrollment({
    applicationId: input.applicationId,
    enrolledById: input.enrolledById,
  });

  if (!provisioningResult.success) {
    throw new Error(`Enrollment provisioning failed: ${provisioningResult.error || 'Unknown error'}`);
  }

  await transitionApplication(input.applicationId, 'ENROLLED', {
    actorId: input.enrolledById,
    actorType: 'ADMISSIONS',
    reason: 'Account, dashboard, LMS enrollment, onboarding, videos, binder, schedule, and program-specific records were verified.',
  });

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

export async function checkEnrollmentPrerequisites(applicationId: string): Promise<{
  ready: boolean;
  issues: Array<{
    type: 'document' | 'funding' | 'payment' | 'signature';
    code: string;
    message: string;
  }>;
}> {
  const supabase = await requireAdminClient();

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
      issues: [{ type: 'document', code: 'APPLICATION_NOT_FOUND', message: 'Application not found' }],
    };
  }

  const issues: Array<{
    type: 'document' | 'funding' | 'payment' | 'signature';
    code: string;
    message: string;
  }> = [];

  if (application.workflow_status !== 'READY_TO_ENROLL') {
    issues.push({
      type: 'document',
      code: 'INVALID_STATUS',
      message: `Application must be READY_TO_ENROLL. Current: ${application.workflow_status}`,
    });
  }

  for (const doc of application.documents ?? []) {
    if (['REQUIRED', 'REQUESTED', 'UPLOADED', 'UNDER_REVIEW', 'REJECTED', 'EXPIRED'].includes(doc.status)) {
      issues.push({
        type: 'document',
        code: doc.requirement_code,
        message: `Document required: ${doc.display_name}`,
      });
    }
  }

  const pendingFunding = application.funding_cases?.filter(
    (fundingCase: { status: string }) => ['NOT_STARTED', 'SCREENING', 'SUBMITTED'].includes(fundingCase.status),
  ) ?? [];

  for (const fundingCase of pendingFunding) {
    issues.push({
      type: 'funding',
      code: fundingCase.funding_type,
      message: `Funding application pending: ${fundingCase.funding_type}`,
    });
  }

  return { ready: issues.length === 0, issues };
}

export async function getEnrollmentDetails(applicationId: string): Promise<{
  enrolled: boolean;
  enrolledAt?: string;
  enrollmentId?: string;
  dashboardUrl?: string;
  lmsUserId?: string;
  apprenticeRecordId?: string;
} | null> {
  const supabase = await requireAdminClient();
  const { data: enrollment, error } = await supabase
    .from('paris_application_enrollments')
    .select('*')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (error || !enrollment) return null;

  const dashboardUrl = enrollment.student_dashboard_id
    ? `https://app.elevateforhumanity.org/lms/dashboard?enrollment=${encodeURIComponent(enrollment.student_dashboard_id)}`
    : undefined;

  return {
    enrolled: true,
    enrolledAt: enrollment.created_at,
    enrollmentId: enrollment.enrollment_id ?? undefined,
    dashboardUrl,
    lmsUserId: enrollment.lms_user_id ?? undefined,
    apprenticeRecordId: enrollment.apprentice_record_id ?? undefined,
  };
}

export async function withdrawEnrollment(
  applicationId: string,
  withdrawnById: string,
  reason: string,
): Promise<void> {
  const supabase = await requireAdminClient();
  const { data: enrollment } = await supabase
    .from('paris_application_enrollments')
    .select('id')
    .eq('application_id', applicationId)
    .maybeSingle();

  if (enrollment) {
    await supabase.from('paris_application_enrollments').delete().eq('application_id', applicationId);
  }

  await transitionApplication(applicationId, 'WITHDRAWN', {
    actorId: withdrawnById,
    actorType: 'ADMISSIONS',
    reason,
  });
}
