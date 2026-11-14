/**
 * PARIS Application State Machine
 * 
 * Defines valid state transitions for the application workflow.
 * ZORA cannot skip invalid transitions.
 */

import type { ApplicationWorkflowStatus } from './types';

/**
 * Valid state transitions map
 * Key: current state
 * Value: array of allowed next states
 */
const TRANSITIONS: Record<ApplicationWorkflowStatus, ApplicationWorkflowStatus[]> = {
  DRAFT: [
    'ELIGIBILITY_REVIEW',
    'WITHDRAWN',
  ],
  
  ELIGIBILITY_REVIEW: [
    'DOCUMENTS_REQUIRED',
    'FUNDING_REVIEW',
    'ADMISSIONS_REVIEW',
    'WAITLISTED',
    'REFERRED',
    'REJECTED',
    'WITHDRAWN',
  ],
  
  DOCUMENTS_REQUIRED: [
    'FUNDING_REVIEW',
    'ADMISSIONS_REVIEW',
    'WAITLISTED',
    'REFERRED',
    'REJECTED',
    'WITHDRAWN',
  ],
  
  FUNDING_REVIEW: [
    'DOCUMENTS_REQUIRED',
    'ADMISSIONS_REVIEW',
    'PAYMENT_REQUIRED',
    'WAITLISTED',
    'REFERRED',
    'REJECTED',
    'WITHDRAWN',
  ],
  
  ADMISSIONS_REVIEW: [
    'CONDITIONALLY_ACCEPTED',
    'ACCEPTED',
    'WAITLISTED',
    'REFERRED',
    'REJECTED',
    'WITHDRAWN',
  ],
  
  CONDITIONALLY_ACCEPTED: [
    'DOCUMENTS_REQUIRED',
    'ACCEPTED',
    'REJECTED',
    'WITHDRAWN',
  ],
  
  ACCEPTED: [
    'PAYMENT_REQUIRED',
    'READY_TO_ENROLL',
    'WITHDRAWN',
  ],
  
  PAYMENT_REQUIRED: [
    'READY_TO_ENROLL',
    'WITHDRAWN',
  ],
  
  READY_TO_ENROLL: [
    'ENROLLED',
    'DOCUMENTS_REQUIRED',
    'WITHDRAWN',
  ],
  
  ENROLLED: [
    'WITHDRAWN',
  ],
  
  WAITLISTED: [
    'ADMISSIONS_REVIEW',
    'REJECTED',
    'WITHDRAWN',
  ],
  
  REFERRED: [
    'ELIGIBILITY_REVIEW',
    'REJECTED',
    'WITHDRAWN',
  ],
  
  REJECTED: [],
  
  WITHDRAWN: [],
};

/**
 * Check if a transition is valid
 */
export function canTransition(
  current: ApplicationWorkflowStatus,
  next: ApplicationWorkflowStatus,
): boolean {
  return TRANSITIONS[current]?.includes(next) ?? false;
}

/**
 * Assert that a transition is valid, throw if not
 */
export function assertTransition(
  current: ApplicationWorkflowStatus,
  next: ApplicationWorkflowStatus,
): void {
  if (!canTransition(current, next)) {
    throw new InvalidTransitionError(current, next);
  }
}

/**
 * Get all valid next states from current state
 */
export function getValidNextStates(
  current: ApplicationWorkflowStatus,
): ApplicationWorkflowStatus[] {
  return TRANSITIONS[current] ?? [];
}

/**
 * Check if a status is a terminal state
 */
export function isTerminalState(status: ApplicationWorkflowStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

/**
 * Get human-readable status label
 */
export function getStatusLabel(status: ApplicationWorkflowStatus): string {
  const labels: Record<ApplicationWorkflowStatus, string> = {
    DRAFT: 'In Progress',
    ELIGIBILITY_REVIEW: 'Eligibility Review',
    DOCUMENTS_REQUIRED: 'Documents Required',
    FUNDING_REVIEW: 'Funding Review',
    ADMISSIONS_REVIEW: 'Admissions Review',
    CONDITIONALLY_ACCEPTED: 'Conditionally Accepted',
    ACCEPTED: 'Accepted',
    PAYMENT_REQUIRED: 'Payment Required',
    READY_TO_ENROLL: 'Ready to Enroll',
    ENROLLED: 'Enrolled',
    WAITLISTED: 'Waitlisted',
    REFERRED: 'Referred',
    REJECTED: 'Rejected',
    WITHDRAWN: 'Withdrawn',
  };
  return labels[status];
}

/**
 * Get status description for applicants
 */
export function getStatusDescription(status: ApplicationWorkflowStatus): string {
  const descriptions: Record<ApplicationWorkflowStatus, string> = {
    DRAFT: 'Your application is being prepared.',
    ELIGIBILITY_REVIEW: 'We are reviewing your eligibility information.',
    DOCUMENTS_REQUIRED: 'Please upload the required documents.',
    FUNDING_REVIEW: 'We are reviewing your funding application.',
    ADMISSIONS_REVIEW: 'Your application is under final review.',
    CONDITIONALLY_ACCEPTED: 'You have been conditionally accepted. Complete the requirements to finalize your acceptance.',
    ACCEPTED: 'Congratulations! You have been accepted.',
    PAYMENT_REQUIRED: 'Please complete your payment or funding arrangement.',
    READY_TO_ENROLL: 'You are ready to enroll in your program.',
    ENROLLED: 'You are enrolled and ready to begin your training.',
    WAITLISTED: 'You have been placed on the waitlist. We will contact you when a spot opens.',
    REFERRED: 'We have referred your application to another program or service.',
    REJECTED: 'Your application was not approved at this time.',
    WITHDRAWN: 'Your application has been withdrawn.',
  };
  return descriptions[status];
}

/**
 * Check if applicant can view application at this status
 */
export function canApplicantViewAtStatus(status: ApplicationWorkflowStatus): boolean {
  return status !== 'DRAFT';
}

/**
 * Check if staff action is required at this status
 */
export function requiresStaffAction(status: ApplicationWorkflowStatus): boolean {
  const staffActionStatuses: ApplicationWorkflowStatus[] = [
    'ELIGIBILITY_REVIEW',
    'ADMISSIONS_REVIEW',
    'CONDITIONALLY_ACCEPTED',
    'ACCEPTED',
    'PAYMENT_REQUIRED',
    'WAITLISTED',
    'REFERRED',
  ];
  return staffActionStatuses.includes(status);
}

/**
 * Get urgency level for task priority based on status
 */
export function getStatusUrgency(status: ApplicationWorkflowStatus): 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' {
  const urgencyMap: Record<ApplicationWorkflowStatus, 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'> = {
    DRAFT: 'LOW',
    ELIGIBILITY_REVIEW: 'HIGH',
    DOCUMENTS_REQUIRED: 'NORMAL',
    FUNDING_REVIEW: 'HIGH',
    ADMISSIONS_REVIEW: 'HIGH',
    CONDITIONALLY_ACCEPTED: 'URGENT',
    ACCEPTED: 'HIGH',
    PAYMENT_REQUIRED: 'HIGH',
    READY_TO_ENROLL: 'URGENT',
    ENROLLED: 'NORMAL',
    WAITLISTED: 'LOW',
    REFERRED: 'LOW',
    REJECTED: 'LOW',
    WITHDRAWN: 'LOW',
  };
  return urgencyMap[status];
}

/**
 * Custom error for invalid transitions
 */
export class InvalidTransitionError extends Error {
  public readonly currentStatus: ApplicationWorkflowStatus;
  public readonly attemptedStatus: ApplicationWorkflowStatus;

  constructor(
    current: ApplicationWorkflowStatus,
    attempted: ApplicationWorkflowStatus,
  ) {
    super(
      `Invalid PARIS transition: ${current} → ${attempted}. ` +
      `Valid transitions from ${current}: ${TRANSITIONS[current]?.join(', ') || 'none'}`
    );
    this.name = 'InvalidTransitionError';
    this.currentStatus = current;
    this.attemptedStatus = attempted;
  }
}
