/**
 * ZORA Admissions Rules Engine
 * 
 * Rules for evaluating application completeness and calculating risk scores.
 * ZORA uses these rules to determine workflow automation actions.
 */

import type {
  ApplicationCompletenessEvaluation,
  ParisApplication,
  ParisApplicationDocument,
  ParisFundingCase,
  FundingType,
} from '@/lib/paris/admissions/types';

/**
 * Application data with workflow relations
 */
export type ApplicationWithRelations = ParisApplication & {
  documents: ParisApplicationDocument[];
  fundingCases: ParisFundingCase[];
};

/**
 * Evaluate application completeness for admissions readiness
 */
export function evaluateApplicationCompleteness(
  application: ApplicationWithRelations,
): ApplicationCompletenessEvaluation {
  // Find missing required documents
  const missingRequiredDocuments = application.documents.filter((doc) =>
    ['REQUIRED', 'REQUESTED', 'REJECTED', 'EXPIRED'].includes(doc.status)
  );

  // Find unresolved funding cases
  const unresolvedFundingCases = application.fundingCases.filter((fundingCase) =>
    ['NOT_STARTED', 'SCREENING', 'DOCUMENTS_REQUIRED', 'SUBMITTED'].includes(fundingCase.status)
  );

  // Check for approved funding
  const approvedFunding = application.fundingCases.some((fundingCase) =>
    ['APPROVED', 'PARTIALLY_APPROVED'].includes(fundingCase.status)
  );

  // Check if self-pay is selected
  const selfPaySelected = application.fundingCases.some(
    (fundingCase) => fundingCase.fundingType === 'SELF_PAY'
  );

  return {
    documentsComplete: missingRequiredDocuments.length === 0,
    missingRequiredDocuments,
    fundingComplete: unresolvedFundingCases.length === 0,
    approvedFunding,
    selfPaySelected,
    readyForAdmissions:
      missingRequiredDocuments.length === 0 &&
      unresolvedFundingCases.length === 0,
  };
}

/**
 * Calculate risk score for an application (0-100)
 * Higher scores indicate higher risk of dropout or failure
 */
export function calculateRiskScore(application: ApplicationWithRelations): number {
  let score = 0;

  // Staleness: Days since last update
  const daysSinceUpdated = Math.floor(
    (Date.now() - new Date(application.updatedAt).getTime()) / 86_400_000,
  );

  if (daysSinceUpdated >= 3) score += 15;
  if (daysSinceUpdated >= 7) score += 20;
  if (daysSinceUpdated >= 14) score += 25;

  // Missing documents count
  const missingDocumentCount = application.documents.filter((doc) =>
    ['REQUIRED', 'REQUESTED', 'REJECTED'].includes(doc.status)
  ).length;

  score += Math.min(missingDocumentCount * 8, 32);

  // Funding denial
  if (
    application.fundingCases.some(
      (fundingCase) => fundingCase.status === 'DENIED'
    )
  ) {
    score += 20;
  }

  // Funding still in process
  if (
    application.fundingCases.some((fundingCase) =>
      ['SCREENING', 'SUBMITTED'].includes(fundingCase.status)
    )
  ) {
    score += 10;
  }

  // Employment status
  const employmentStatus = application.employmentStatus?.toLowerCase() ?? '';
  if (employmentStatus.includes('unemployed')) {
    score += 10;
  }

  // Barriers
  const barriers = application.barriers ?? [];
  if (barriers.length > 2) {
    score += 15;
  }

  // Budget constraint: cap at 100
  return Math.min(score, 100);
}

/**
 * Determine risk level label
 */
export function getRiskLevel(score: number): 'low' | 'medium' | 'high' | 'critical' {
  if (score >= 70) return 'critical';
  if (score >= 40) return 'high';
  if (score >= 20) return 'medium';
  return 'low';
}

/**
 * Determine required actions based on completeness evaluation
 */
export function determineRequiredActions(
  evaluation: ApplicationCompletenessEvaluation,
  application: ApplicationWithRelations,
): string[] {
  const actions: string[] = [];

  if (!evaluation.documentsComplete) {
    actions.push('REQUEST_MISSING_DOCUMENTS');
  }

  if (!evaluation.fundingComplete) {
    actions.push('SUBMIT_FUNDING_APPLICATIONS');
  }

  if (
    evaluation.documentsComplete &&
    evaluation.fundingComplete &&
    !evaluation.readyForAdmissions
  ) {
    actions.push('ASSIGN_ADMISSIONS_REVIEW');
  }

  // Check for conditional acceptance
  if (application.workflowStatus === 'CONDITIONALLY_ACCEPTED') {
    const pendingDocs = evaluation.missingRequiredDocuments;
    if (pendingDocs.length > 0) {
      actions.push('FULFILL_CONDITIONS');
    }
  }

  return actions;
}

/**
 * Determine if application needs staff follow-up
 */
export function needsStaffFollowUp(application: ApplicationWithRelations): boolean {
  const staleThreshold = 3 * 24 * 60 * 60 * 1000; // 3 days
  const isStale = Date.now() - new Date(application.updatedAt).getTime() > staleThreshold;
  
  const hasPendingTasks = application.tasks?.some(
    (task) => task.status === 'OPEN' && 
             task.assignedRole !== 'APPLICANT' &&
             task.assignedRole !== 'SYSTEM'
  ) ?? false;

  return isStale || hasPendingTasks;
}

/**
 * Determine task priority based on status and age
 */
export function calculateTaskPriority(
  application: ApplicationWithRelations,
  taskType: string,
): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' {
  // Always urgent for conditional acceptance
  if (application.workflowStatus === 'CONDITIONALLY_ACCEPTED') {
    return 'URGENT';
  }

  // High priority for admissions review
  if (application.workflowStatus === 'ADMISSIONS_REVIEW') {
    return 'HIGH';
  }

  // High priority for submitted applications
  if (taskType === 'RECRUITER_REVIEW') {
    return 'HIGH';
  }

  // Normal for document requests
  if (taskType === 'COMPLETE_APPLICATION' || taskType.includes('DOCUMENT')) {
    return 'NORMAL';
  }

  return 'NORMAL';
}

/**
 * Determine if funding requires payment arrangement
 */
export function requiresPaymentArrangement(
  evaluation: ApplicationCompletenessEvaluation,
): boolean {
  return (
    !evaluation.approvedFunding &&
    evaluation.selfPaySelected &&
    evaluation.fundingComplete
  );
}

/**
 * Get funding summary for display
 */
export function getFundingSummary(
  fundingCases: ParisFundingCase[],
): {
  totalApproved: number;
  totalRequested: number;
  studentBalance: number;
  fundingStatus: 'pending' | 'approved' | 'denied' | 'mixed';
} {
  let totalApproved = 0;
  let totalRequested = 0;
  let studentBalance = 0;
  let hasApproved = false;
  let hasDenied = false;
  let hasPending = false;

  for (const fc of fundingCases) {
    if (fc.requestedAmount) {
      totalRequested += Number(fc.requestedAmount);
    }
    if (fc.approvedAmount) {
      totalApproved += Number(fc.approvedAmount);
      hasApproved = true;
    }
    if (fc.studentBalance) {
      studentBalance += Number(fc.studentBalance);
    }
    if (fc.status === 'DENIED') {
      hasDenied = true;
    }
    if (['NOT_STARTED', 'SCREENING', 'SUBMITTED'].includes(fc.status)) {
      hasPending = true;
    }
  }

  let fundingStatus: 'pending' | 'approved' | 'denied' | 'mixed';
  if (hasApproved && (hasDenied || hasPending)) {
    fundingStatus = 'mixed';
  } else if (hasApproved) {
    fundingStatus = 'approved';
  } else if (hasDenied) {
    fundingStatus = 'denied';
  } else {
    fundingStatus = 'pending';
  }

  return {
    totalApproved,
    totalRequested,
    studentBalance,
    fundingStatus,
  };
}
