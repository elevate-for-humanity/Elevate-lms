import { isApprovedDocument } from './document-review';
/**
 * PROGRAM HOLDER ONBOARDING STATUS
 *
 * Single source of truth for program holder onboarding completion.
 * Used by middleware, layouts, and API routes to enforce gating.
 */

import { siteUrls } from '@/lib/utils/site-urls';
import { createClient } from '@/lib/supabase/server';

export interface ProgramHolderOnboardingStatus {
  // Authentication
  isAuthenticated: boolean;
  userId: string | null;

  // Role & Approval
  isProgramHolder: boolean;
  isApproved: boolean;
  approvedAt: string | null;

  // Onboarding Steps
  mouSigned: boolean;
  mouSignedAt: string | null;
  handbookAcknowledged: boolean;
  handbookAcknowledgedAt: string | null;
  rightsAcknowledged: boolean;
  rightsAcknowledgedAt: string | null;
  requiredDocsComplete: boolean;
  requiredDocsList: string[];

  // Computed
  onboardingComplete: boolean;
  nextStepRoute: string | null;
  nextStepLabel: string | null;

  // Progress
  completedSteps: number;
  totalSteps: number;
  progressPercentage: number;
}

/**
 * Get program holder onboarding status
 *
 * @param userId - User ID to check (optional, uses current session if not provided)
 * @returns Onboarding status object
 */
export async function getProgramHolderOnboardingStatus(
  userId?: string,
): Promise<ProgramHolderOnboardingStatus> {
  const supabase = await createClient();

  // Get current user if not provided
  let currentUserId = userId;
  if (!currentUserId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    currentUserId = user?.id || null;
  }

  // Default status (not authenticated)
  if (!currentUserId) {
    return {
      isAuthenticated: false,
      userId: null,
      isProgramHolder: false,
      isApproved: false,
      approvedAt: null,
      mouSigned: false,
      mouSignedAt: null,
      handbookAcknowledged: false,
      handbookAcknowledgedAt: null,
      rightsAcknowledged: false,
      rightsAcknowledgedAt: null,
      requiredDocsComplete: false,
      requiredDocsList: [],
      onboardingComplete: false,
      nextStepRoute: '/login',
      nextStepLabel: 'Login',
      completedSteps: 0,
      totalSteps: 5,
      progressPercentage: 0,
    };
  }

  // Check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role,program_holder_id')
    .eq('id', currentUserId)
    .maybeSingle();

  const isProgramHolder = ['program_holder', 'programholder', 'site_coordinator'].includes(String(profile?.role || ''));

  if (!isProgramHolder) {
    return {
      isAuthenticated: true,
      userId: currentUserId,
      isProgramHolder: false,
      isApproved: false,
      approvedAt: null,
      mouSigned: false,
      mouSignedAt: null,
      handbookAcknowledged: false,
      handbookAcknowledgedAt: null,
      rightsAcknowledged: false,
      rightsAcknowledgedAt: null,
      requiredDocsComplete: false,
      requiredDocsList: [],
      onboardingComplete: false,
      nextStepRoute: `${siteUrls.apply}/program-holder`,
      nextStepLabel: 'Apply as Program Holder',
      completedSteps: 0,
      totalSteps: 5,
      progressPercentage: 0,
    };
  }

  // Check approval status and program type
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('status, approved_at, mou_type, mou_signed, mou_status, mou_signed_at')
    .eq(profile?.program_holder_id ? 'id' : 'user_id', profile?.program_holder_id || currentUserId)
    .maybeSingle();

  const isApproved = ['approved','active','approved_pending_mou'].includes(String(programHolder?.status)) && !!programHolder?.approved_at;

  if (!isApproved) {
    return {
      isAuthenticated: true,
      userId: currentUserId,
      isProgramHolder: true,
      isApproved: false,
      approvedAt: null,
      mouSigned: false,
      mouSignedAt: null,
      handbookAcknowledged: false,
      handbookAcknowledgedAt: null,
      rightsAcknowledged: false,
      rightsAcknowledgedAt: null,
      requiredDocsComplete: false,
      requiredDocsList: [],
      onboardingComplete: false,
      nextStepRoute: '/program-holder/onboarding',
      nextStepLabel: 'Awaiting Approval',
      completedSteps: 0,
      totalSteps: 5,
      progressPercentage: 0,
    };
  }

  // Check MOU signed
  const mouSigned = programHolder?.mou_signed === true && ['signed','fully_executed'].includes(String(programHolder.mou_status || 'signed'));
  const mouSignedAt = programHolder?.mou_signed_at || null;

  if (!mouSigned) {
    return {
      isAuthenticated: true,
      userId: currentUserId,
      isProgramHolder: true,
      isApproved: true,
      approvedAt: programHolder?.approved_at || null,
      mouSigned: false,
      mouSignedAt: null,
      handbookAcknowledged: false,
      handbookAcknowledgedAt: null,
      rightsAcknowledged: false,
      rightsAcknowledgedAt: null,
      requiredDocsComplete: false,
      requiredDocsList: [],
      onboardingComplete: false,
      nextStepRoute: '/program-holder/sign-mou',
      nextStepLabel: 'Sign MOU',
      completedSteps: 1,
      totalSteps: 5,
      progressPercentage: 20,
    };
  }

  // Check handbook acknowledged
  const { data: handbookAck } = await supabase
    .from('program_holder_acknowledgements')
    .select('id, acknowledged_at')
    .eq('user_id', currentUserId)
    .eq('document_type', 'handbook')
    .maybeSingle();

  const handbookAcknowledged = !!handbookAck;
  const handbookAcknowledgedAt = handbookAck?.acknowledged_at || null;

  if (!handbookAcknowledged) {
    return {
      isAuthenticated: true,
      userId: currentUserId,
      isProgramHolder: true,
      isApproved: true,
      approvedAt: programHolder?.approved_at || null,
      mouSigned: true,
      mouSignedAt,
      handbookAcknowledged: false,
      handbookAcknowledgedAt: null,
      rightsAcknowledged: false,
      rightsAcknowledgedAt: null,
      requiredDocsComplete: false,
      requiredDocsList: [],
      onboardingComplete: false,
      nextStepRoute: '/program-holder/handbook',
      nextStepLabel: 'Acknowledge Handbook',
      completedSteps: 2,
      totalSteps: 5,
      progressPercentage: 40,
    };
  }

  // Check rights acknowledged
  const { data: rightsAck } = await supabase
    .from('program_holder_acknowledgements')
    .select('id, acknowledged_at')
    .eq('user_id', currentUserId)
    .eq('document_type', 'rights')
    .maybeSingle();

  const rightsAcknowledged = !!rightsAck;
  const rightsAcknowledgedAt = rightsAck?.acknowledged_at || null;

  if (!rightsAcknowledged) {
    return {
      isAuthenticated: true,
      userId: currentUserId,
      isProgramHolder: true,
      isApproved: true,
      approvedAt: programHolder?.approved_at || null,
      mouSigned: true,
      mouSignedAt,
      handbookAcknowledged: true,
      handbookAcknowledgedAt,
      rightsAcknowledged: false,
      rightsAcknowledgedAt: null,
      requiredDocsComplete: false,
      requiredDocsList: [],
      onboardingComplete: false,
      nextStepRoute: '/program-holder/rights-responsibilities',
      nextStepLabel: 'Acknowledge Rights & Responsibilities',
      completedSteps: 3,
      totalSteps: 5,
      progressPercentage: 60,
    };
  }

  // Check required documents
  const { data: documents } = await supabase
    .from('program_holder_documents')
    .select('document_type, status, approved')
    .eq('user_id', currentUserId);

  const approvedDocs = documents?.filter(isApprovedDocument) || [];
  const mouType = programHolder?.mou_type ?? 'barber';

  let requiredDocsComplete: boolean;
  let requiredDocsList: string[];

  if (mouType === 'cosmetology') {
    const hasSalonLicense = approvedDocs.some((d) => d.document_type === 'salon_license');
    const hasSupervisorLicense = approvedDocs.some((d) => d.document_type === 'supervisor_license');
    const hasWorkersComp = approvedDocs.some((d) => d.document_type === 'workers_comp');
    requiredDocsComplete = hasSalonLicense && hasSupervisorLicense && hasWorkersComp;
    requiredDocsList = [
      ...(!hasSalonLicense ? ['Indiana Salon License'] : []),
      ...(!hasSupervisorLicense ? ['Supervising Cosmetologist License'] : []),
      ...(!hasWorkersComp ? ["Workers' Compensation Insurance"] : []),
    ];
  } else {
    // Barber (default)
    const hasBusinessLicense = approvedDocs.some((d) => d.document_type === 'business_license');
    const hasInsurance = approvedDocs.some((d) => d.document_type === 'insurance');
    // Elevate publishes the canonical syllabus inside the portal. A program
    // holder or instructor must never be blocked on uploading a duplicate.
    requiredDocsComplete = hasBusinessLicense && hasInsurance;
    requiredDocsList = [
      ...(!hasBusinessLicense ? ['Business License'] : []),
      ...(!hasInsurance ? ['Insurance Certificate'] : []),
    ];
  }

  if (!requiredDocsComplete) {
    return {
      isAuthenticated: true,
      userId: currentUserId,
      isProgramHolder: true,
      isApproved: true,
      approvedAt: programHolder?.approved_at || null,
      mouSigned: true,
      mouSignedAt,
      handbookAcknowledged: true,
      handbookAcknowledgedAt,
      rightsAcknowledged: true,
      rightsAcknowledgedAt,
      requiredDocsComplete: false,
      requiredDocsList,
      onboardingComplete: false,
      nextStepRoute: '/program-holder/documents?required=true',
      nextStepLabel: 'Upload Required Documents',
      completedSteps: 4,
      totalSteps: 5,
      progressPercentage: 80,
    };
  }

  // All complete!
  return {
    isAuthenticated: true,
    userId: currentUserId,
    isProgramHolder: true,
    isApproved: true,
    approvedAt: programHolder?.approved_at || null,
    mouSigned: true,
    mouSignedAt,
    handbookAcknowledged: true,
    handbookAcknowledgedAt,
    rightsAcknowledged: true,
    rightsAcknowledgedAt,
    requiredDocsComplete: true,
    requiredDocsList: [],
    onboardingComplete: true,
    nextStepRoute: null,
    nextStepLabel: null,
    completedSteps: 5,
    totalSteps: 5,
    progressPercentage: 100,
  };
}

/**
 * Check if program holder can access protected routes
 *
 * @param userId - User ID to check (optional)
 * @returns True if onboarding is complete
 */
export async function canAccessProgramHolderDashboard(userId?: string): Promise<boolean> {
  const status = await getProgramHolderOnboardingStatus(userId);
  return status.onboardingComplete;
}
