/**
 * PROGRAM HOLDER ONBOARDING STATUS
 *
 * Single source of truth for program holder onboarding completion.
 * Used by middleware, layouts, and API routes to enforce gating.
 */

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
  userId?: string
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
    .select('role')
    .eq('id', currentUserId)
    .single();

  const isProgramHolder = profile?.role === 'program_holder';

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
      nextStepRoute: '/program-holder/apply',
      nextStepLabel: 'Apply as Program Holder',
      completedSteps: 0,
      totalSteps: 5,
      progressPercentage: 0,
    };
  }

  // Check approval status and program type
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('status, approved_at, mou_type')
    .eq('user_id', currentUserId)
    .single();

  const isApproved =
    programHolder?.status === 'approved' || !!programHolder?.approved_at;

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
  const { data: mouSignature } = await supabase
    .from('mou_signatures')
    .select('id, agreed_at')
    .eq('user_id', currentUserId)
    .eq('user_type', 'program_holder')
    .single();

  const mouSigned = !!mouSignature;
  const mouSignedAt = mouSignature?.agreed_at || null;

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
    .single();

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
    .single();

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
    .select('document_type, approved')
    .eq('user_id', currentUserId);

  const approvedDocs = documents?.filter((d) => d.approved) || [];
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
    const hasSyllabus = approvedDocs.some((d) => d.document_type === 'syllabus');
    const hasBusinessLicense = approvedDocs.some((d) => d.document_type === 'business_license');
    const hasInsurance = approvedDocs.some((d) => d.document_type === 'insurance');
    requiredDocsComplete = hasSyllabus && hasBusinessLicense && hasInsurance;
    requiredDocsList = [
      ...(!hasSyllabus ? ['Syllabus'] : []),
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
export async function canAccessProgramHolderDashboard(
  userId?: string
): Promise<boolean> {
  const status = await getProgramHolderOnboardingStatus(userId);
  return status.onboardingComplete;
}
