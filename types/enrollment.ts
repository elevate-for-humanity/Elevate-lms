// =====================================================
// FUNDING PATHWAY TYPES (ENFORCED)
// =====================================================

export type FundingPathway = 
  | 'workforce_funded'
  | 'employer_sponsored'
  | 'structured_tuition';

export type IntakeStatus =
  | 'not_started'
  | 'identity_pending'
  | 'workforce_screening'
  | 'employer_screening'
  | 'financial_readiness'
  | 'program_readiness'
  | 'pending_signature'
  | 'completed'
  | 'rejected';

export type PaymentPlanStatus =
  | 'active'
  | 'paused'
  | 'completed'
  | 'defaulted'
  | 'cancelled';

export type EnrollmentStatus =
  | 'pending'
  | 'active'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'withdrawn';

// Legacy types for backward compatibility
export type FundingSource =
  | 'SELF_PAY'
  | 'EMPLOYER'
  | 'WRG'
  | 'WIOA'
  | 'SCHOLARSHIP';

// =====================================================
// INTAKE RECORD
// =====================================================

export interface IntakeRecord {
  id: string;
  userId: string;
  programId: string | null;
  status: IntakeStatus;
  
  // Step 1: Identity
  identityVerified: boolean;
  identityVerifiedAt: string | null;
  identityDocumentType: string | null;
  
  // Step 2: Workforce screening
  workforceScreeningCompleted: boolean;
  workforceScreeningAt: string | null;
  workforceEligible: boolean | null;
  workforceAgency: string | null;
  workforceCaseManager: string | null;
  workforceFundingType: string | null;
  
  // Step 3: Employer screening
  employerScreeningCompleted: boolean;
  employerScreeningAt: string | null;
  employerEligible: boolean | null;
  employerName: string | null;
  employerContact: string | null;
  employerReimbursementConfirmed: boolean;
  
  // Step 4: Financial readiness
  financialReadinessCompleted: boolean;
  financialReadinessAt: string | null;
  canPayDownPayment: boolean | null;
  canCommitMonthly: boolean | null;
  acceptsAutoPayment: boolean | null;
  understands90DayLimit: boolean | null;
  
  // Step 5: Program readiness
  programReadinessCompleted: boolean;
  programReadinessAt: string | null;
  startDateConfirmed: boolean | null;
  attendanceRequirementsUnderstood: boolean | null;
  technologyAccessConfirmed: boolean | null;
  timeCommitmentAcknowledged: boolean | null;
  outcomeExpectationsExplained: boolean | null;
  
  // Funding pathway
  fundingPathway: FundingPathway | null;
  fundingPathwayAssignedAt: string | null;
  fundingPathwayAssignedBy: string | null;
  
  // Signature
  acknowledgmentSigned: boolean;
  acknowledgmentSignedAt: string | null;
  
  // Timestamps
  intakeStartedAt: string;
  intakeCompletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// BRIDGE PAYMENT PLAN (90-DAY MAX)
// =====================================================

export interface BridgePaymentPlan {
  id: string;
  enrollmentId: string;
  userId: string;
  
  // Plan structure (enforced)
  downPaymentAmount: number; // minimum $500
  monthlyPaymentAmount: number; // minimum $200
  maxTermMonths: number; // maximum 3
  
  // Down payment
  downPaymentPaid: boolean;
  downPaymentPaidAt: string | null;
  downPaymentStripeId: string | null;
  
  // Monthly payments
  monthsPaid: number;
  lastPaymentAt: string | null;
  nextPaymentDue: string | null;
  
  // Auto-payment (required)
  autoPaymentEnabled: boolean;
  stripeSubscriptionId: string | null;
  
  // Status
  status: PaymentPlanStatus;
  
  // Dates
  planStartDate: string;
  planEndDate: string;
  
  // Balance
  totalAmount: number;
  amountPaid: number;
  balanceRemaining: number;
  
  // Access control
  academicAccessPaused: boolean;
  academicAccessPausedAt: string | null;
  academicAccessPausedReason: string | null;
  
  // Credential hold
  credentialHold: boolean;
  
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// EMPLOYER SPONSORSHIP
// =====================================================

export type EmployerSponsorshipStatus =
  | 'pending'
  | 'agreement_sent'
  | 'agreement_signed'
  | 'awaiting_hire'
  | 'active'
  | 'completed'
  | 'separated'
  | 'cancelled';

export interface EmployerSponsorship {
  id: string;
  enrollmentId: string;
  userId: string;
  
  // Employer info
  employerName: string;
  employerContactName: string | null;
  employerContactEmail: string | null;
  employerContactPhone: string | null;
  
  // Terms
  totalTuition: number;
  monthlyReimbursement: number; // $250-$400
  termMonths: number; // 12-20
  
  // Hire tracking
  hireDate: string | null;
  hireConfirmed: boolean;
  hireConfirmedAt: string | null;
  
  // Reimbursement
  reimbursementsReceived: number;
  totalReimbursed: number;
  lastReimbursementAt: string | null;
  nextReimbursementDue: string | null;
  
  // Separation
  employmentEnded: boolean;
  employmentEndedAt: string | null;
  employmentEndReason: string | null;
  reimbursementStoppedAt: string | null;
  
  // Status
  status: EmployerSponsorshipStatus;
  
  // Agreement
  agreementSigned: boolean;
  agreementSignedAt: string | null;
  agreementDocumentUrl: string | null;
  
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// WORKFORCE REFERRAL
// =====================================================

export type WorkforceAgencyType =
  | 'american_job_center'
  | 'workforce_board'
  | 'vocational_rehabilitation'
  | 'wioa'
  | 'jri'
  | 'snap_et'
  | 'fssa'
  | 'other';

export type WorkforceReferralStatus =
  | 'referred'
  | 'intake_started'
  | 'enrolled'
  | 'active'
  | 'completed'
  | 'withdrawn'
  | 'cancelled';

export interface WorkforceReferral {
  id: string;
  enrollmentId: string | null;
  userId: string;
  
  // Source
  agencyName: string;
  agencyType: WorkforceAgencyType;
  caseManagerName: string | null;
  caseManagerEmail: string | null;
  caseManagerPhone: string | null;
  
  // Funding
  fundingType: string | null;
  voucherNumber: string | null;
  fundingAmount: number | null;
  fundingApproved: boolean;
  fundingApprovedAt: string | null;
  
  // Status
  status: WorkforceReferralStatus;
  lastStatusUpdateSentAt: string | null;
  statusUpdateEmailEnabled: boolean;
  
  referralDate: string;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// ENROLLMENT (UPDATED)
// =====================================================

export interface ProgramEnrollment {
  id: string;
  userId: string;
  programId: string;
  
  // Funding pathway (required)
  fundingPathway: FundingPathway;
  
  // Intake (required)
  intakeRecordId: string;
  intakeCompleted: boolean;
  
  // Status
  status: EnrollmentStatus;
  
  // Payment
  paymentStatus: 'pending' | 'paid' | 'refunded';
  stripePaymentId: string | null;
  
  // Dates
  enrolledAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// =====================================================
// COMPLIANCE AUDIT
// =====================================================

export interface ComplianceAudit {
  id: string;
  auditMonth: number;
  auditYear: number;
  
  // Section 1: Enrollment integrity
  totalEnrollments: number;
  completedIntakes: number;
  enrollmentsWithoutIntake: number;
  provisionalEnrollments: number;
  
  // Section 2: Funding distribution
  workforceFundedCount: number;
  employerSponsoredCount: number;
  structuredTuitionCount: number;
  lane3Percentage: number;
  lane3ThresholdExceeded: boolean;
  
  // Section 3: Payment compliance
  accountsCurrent: number;
  accountsMissedPayment: number;
  accountsPaused: number;
  accountsBeyond90Days: number;
  
  // Section 4: Exceptions
  executiveExceptions: number;
  staffExceptions: number;
  
  // Section 5: Script adherence
  scriptSamplesReviewed: number;
  scriptDeviationsFound: number;
  
  // Section 6: Intake accuracy
  intakeFilesReviewed: number;
  intakeIssuesFound: number;
  
  // Auto-flagged
  autoFlaggedIssues: Array<{
    type: string;
    description: string;
    enrollmentId?: string;
  }>;
  
  // Sign-offs
  admissionsLeadSigned: boolean;
  admissionsLeadSignedAt: string | null;
  admissionsLeadId: string | null;
  
  programDirectorSigned: boolean;
  programDirectorSignedAt: string | null;
  programDirectorId: string | null;
  
  executiveSigned: boolean;
  executiveSignedAt: string | null;
  executiveId: string | null;
  
  status: 'draft' | 'in_progress' | 'pending_signoff' | 'completed';
  
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// =====================================================
// VALIDATION CONSTANTS (ENFORCED)
// =====================================================

export const BRIDGE_PLAN_CONSTRAINTS = {
  MIN_DOWN_PAYMENT: 500,
  MIN_MONTHLY_PAYMENT: 200,
  MAX_TERM_MONTHS: 3,
  MAX_TERM_DAYS: 90,
  PAYMENT_GRACE_DAYS: 3,
} as const;

export const EMPLOYER_SPONSORSHIP_CONSTRAINTS = {
  MIN_MONTHLY_REIMBURSEMENT: 250,
  MAX_MONTHLY_REIMBURSEMENT: 400,
  MIN_TERM_MONTHS: 12,
  MAX_TERM_MONTHS: 20,
  DEFAULT_TUITION: 5000,
} as const;

export const COMPLIANCE_THRESHOLDS = {
  MAX_LANE3_PERCENTAGE: 40,
  MAX_EXCEPTIONS_PER_MONTH: 2,
  MAX_SCRIPT_DEVIATIONS_BEFORE_RETRAIN: 2,
} as const;
