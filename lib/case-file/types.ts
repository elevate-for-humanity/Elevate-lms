/**
 * Participant Case File
 *
 * The unified abstraction for all participant data.
 * Auditors think in case files - this gives them what they expect.
 *
 * A case file aggregates:
 * - Profile (identity)
 * - Applications (intake)
 * - Enrollments (status)
 * - Documents (compliance)
 * - Progress (training)
 * - Credentials (outcomes)
 * - Employment (placement)
 * - Activity (audit trail)
 */

export interface ParticipantCaseFile {
  // Identity
  id: string;
  caseNumber: string; // Human-readable case ID
  createdAt: string;
  lastActivityAt: string;

  // Profile
  profile: {
    id: string;
    fullName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zip?: string;
      county?: string;
    };
    demographics?: {
      veteran?: boolean;
      justiceInvolved?: boolean;
      disability?: boolean;
      publicAssistance?: boolean;
    };
  };

  // Eligibility & Funding
  eligibility: {
    status: 'pending' | 'eligible' | 'ineligible' | 'review_needed';
    fundingSource?: 'wioa' | 'wrg' | 'jri' | 'self_pay' | 'employer_paid';
    verifiedAt?: string;
    verifiedBy?: string;
    workOneId?: string;
    notes?: string;
  };

  // Applications
  applications: Array<{
    id: string;
    programSlug: string;
    programName: string;
    status: string;
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
  }>;

  // Enrollments
  enrollments: Array<{
    id: string;
    programSlug: string;
    programName: string;
    status:
      | 'applied'
      | 'enrolled_pending_approval'
      | 'active'
      | 'paused'
      | 'completed'
      | 'withdrawn';
    enrolledAt: string;
    startedAt?: string;
    completedAt?: string;
    paymentStatus?: string;
    paymentOption?: string;
    amountPaid?: number;
  }>;

  // Documents
  documents: Array<{
    id: string;
    type: string;
    name: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
  }>;

  // Training Progress
  progress: {
    totalCourses: number;
    completedCourses: number;
    totalHours: number;
    completedHours: number;
    attendanceRate?: number;
    lastActivityAt?: string;
  };

  // Credentials
  credentials: Array<{
    id: string;
    type: string;
    name: string;
    issuedAt: string;
    expiresAt?: string;
    verificationUrl?: string;
    verified: boolean;
  }>;

  // Employment Outcomes
  employment: {
    status: 'seeking' | 'placed' | 'employed' | 'not_seeking';
    employer?: string;
    position?: string;
    placedAt?: string;
    wageRange?: string;
    retentionCheckpoints?: Array<{
      days: number;
      status: 'pending' | 'confirmed' | 'lost';
      confirmedAt?: string;
    }>;
  };

  // Activity Log (Audit Trail)
  activityLog: Array<{
    id: string;
    action: string;
    description: string;
    performedBy: string;
    performedAt: string;
    metadata?: Record<string, unknown>;
  }>;

  // Case Status
  caseStatus: {
    status: 'active' | 'closed' | 'archived';
    closedAt?: string;
    closedReason?: string;
    assignedAdvisor?: string;
    nextAction?: string;
    nextActionDueDate?: string;
  };
}

/**
 * Case file summary for list views
 */
export interface CaseFileSummary {
  id: string;
  caseNumber: string;
  participantName: string;
  email: string;
  currentProgram?: string;
  enrollmentStatus?: string;
  eligibilityStatus: string;
  lastActivityAt: string;
  caseStatus: 'active' | 'closed' | 'archived';
}

/**
 * Generate a human-readable case number
 */
export function generateCaseNumber(participantId: string, createdAt: Date): string {
  const year = createdAt.getFullYear().toString().slice(-2);
  const month = (createdAt.getMonth() + 1).toString().padStart(2, '0');
  const shortId = participantId.slice(0, 6).toUpperCase();
  return `IN-${year}${month}-${shortId}`;
}
