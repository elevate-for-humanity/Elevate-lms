/**
 * PARIS Admissions Workflow - Shared Types
 * 
 * Type definitions for the student application workflow system.
 * These types align with the Supabase schema enums and tables.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================
// ENUMS (matching Supabase types)
// ============================================

export type ApplicationWorkflowStatus =
  | 'DRAFT'
  | 'ELIGIBILITY_REVIEW'
  | 'DOCUMENTS_REQUIRED'
  | 'FUNDING_REVIEW'
  | 'ADMISSIONS_REVIEW'
  | 'CONDITIONALLY_ACCEPTED'
  | 'ACCEPTED'
  | 'PAYMENT_REQUIRED'
  | 'READY_TO_ENROLL'
  | 'ENROLLED'
  | 'WAITLISTED'
  | 'REFERRED'
  | 'REJECTED'
  | 'WITHDRAWN';

export type ApplicationWorkflowType =
  | 'STUDENT'
  | 'APPRENTICE'
  | 'TESTING_CANDIDATE';

export type FundingType =
  | 'WIOA'
  | 'WORKFORCE_READY_GRANT'
  | 'VOCATIONAL_REHABILITATION'
  | 'EMPLOYER_SPONSORSHIP'
  | 'APPRENTICESHIP'
  | 'GRANT'
  | 'SELF_PAY'
  | 'BNPL'
  | 'PAYMENT_PLAN'
  | 'OTHER';

export type FundingCaseStatus =
  | 'NOT_STARTED'
  | 'SCREENING'
  | 'DOCUMENTS_REQUIRED'
  | 'SUBMITTED'
  | 'APPROVED'
  | 'PARTIALLY_APPROVED'
  | 'DENIED'
  | 'EXPIRED';

export type ApplicationDocumentStatus =
  | 'REQUIRED'
  | 'REQUESTED'
  | 'UPLOADED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED'
  | 'WAIVED';

export type AdmissionsDecision =
  | 'PENDING'
  | 'CONDITIONAL_ACCEPTANCE'
  | 'ACCEPTED'
  | 'WAITLISTED'
  | 'REFERRED'
  | 'REJECTED';

export type WorkflowActorType =
  | 'APPLICANT'
  | 'PARIS'
  | 'ZORA'
  | 'RECRUITER'
  | 'ADMISSIONS'
  | 'FINANCE'
  | 'COMPLIANCE'
  | 'PROGRAM_HOLDER'
  | 'SYSTEM';

export type WorkflowTaskStatus =
  | 'OPEN'
  | 'IN_PROGRESS'
  | 'BLOCKED'
  | 'COMPLETED'
  | 'CANCELLED';

export type WorkflowTaskPriority =
  | 'LOW'
  | 'NORMAL'
  | 'HIGH'
  | 'URGENT';

// ============================================
// INPUT TYPES
// ============================================

export interface CreateApplicationInput {
  applicantId: string;
  programId: string;
  applicationType?: ApplicationWorkflowType;

  // Personal
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  phone: string;

  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  // Education & Career
  highestEducation?: string;
  employmentStatus?: string;
  preferredSchedule?: string;
  desiredStartDate?: string;
  careerGoal?: string;
  barriers?: string[];
  eligibilityAnswers?: Record<string, unknown>;

  // Funding
  requestedFunding?: FundingType[];

  // Source
  source?: string;
  referralCode?: string;
}

export interface TransitionContext {
  actorId?: string;
  actorType: WorkflowActorType;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AdmissionsDecisionInput {
  decision: AdmissionsDecision;
  reason?: string;
  conditions?: string[];
}

export interface UploadDocumentInput {
  applicationId: string;
  requirementCode: string;
  file: File | Blob;
  fileName: string;
  mimeType: string;
}

export interface UpdateDocumentStatusInput {
  documentId: string;
  status: ApplicationDocumentStatus;
  rejectionReason?: string;
  reviewedById: string;
}

export interface CreateTaskInput {
  applicationId: string;
  taskType: string;
  title: string;
  description?: string;
  assignedRole?: string;
  assignedUserId?: string;
  priority?: WorkflowTaskPriority;
  dueAt?: Date;
  metadata?: Record<string, unknown>;
}

export interface EnrollmentInput {
  applicationId: string;
  enrolledById: string;
}

// ============================================
// OUTPUT TYPES
// ============================================

export interface ParisApplication {
  id: string;
  applicationNumber: string;
  applicantId: string;
  programId: string;
  programSlug?: string;
  applicationType: ApplicationWorkflowType;
  workflowStatus: ApplicationWorkflowStatus;
  admissionsDecision: AdmissionsDecision;

  // Personal
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  email: string;
  phone: string;

  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;

  // Education & Career
  highestEducation?: string;
  employmentStatus?: string;
  preferredSchedule?: string;
  desiredStartDate?: string;
  careerGoal?: string;
  barriers: string[];
  eligibilityAnswers: Record<string, unknown>;
  eligibilityScore: number;
  riskScore: number;

  // Source
  source?: string;
  referralCode?: string;

  // Assignment
  assignedRecruiterId?: string;
  assignedAt?: string;

  // Timestamps
  submittedAt?: string;
  acceptedAt?: string;
  enrolledAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations (when included)
  documents?: ParisApplicationDocument[];
  fundingCases?: ParisFundingCase[];
  tasks?: ParisWorkflowTask[];
  events?: ParisWorkflowEvent[];
  notes?: ParisApplicationNote[];
  decisions?: ParisApplicationDecision[];
  enrollment?: ParisApplicationEnrollment;
}

export interface ParisApplicationDocument {
  id: string;
  applicationId: string;
  requirementCode: string;
  documentType: string;
  displayName: string;
  status: ApplicationDocumentStatus;
  storageKey?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  rejectionReason?: string;
  reviewedById?: string;
  reviewedAt?: string;
  uploadedAt?: string;
  expirationDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParisFundingCase {
  id: string;
  applicationId: string;
  fundingType: FundingType;
  status: FundingCaseStatus;
  requestedAmount?: number;
  approvedAmount?: number;
  studentBalance?: number;
  externalReference?: string;
  eligibilityResult?: Record<string, unknown>;
  denialReason?: string;
  expirationDate?: string;
  submittedAt?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ParisWorkflowTask {
  id: string;
  applicationId: string;
  taskType: string;
  title: string;
  description?: string;
  assignedRole?: string;
  assignedUserId?: string;
  priority: WorkflowTaskPriority;
  status: WorkflowTaskStatus;
  dueAt?: string;
  completedAt?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ParisWorkflowEvent {
  id: string;
  applicationId: string;
  eventType: string;
  actorType: WorkflowActorType;
  actorId?: string;
  previousStatus?: ApplicationWorkflowStatus;
  newStatus?: ApplicationWorkflowStatus;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ParisApplicationNote {
  id: string;
  applicationId: string;
  authorId: string;
  body: string;
  isInternal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParisApplicationDecision {
  id: string;
  applicationId: string;
  decision: AdmissionsDecision;
  reason?: string;
  conditions: string[];
  decidedById: string;
  decidedAt: string;
}

export interface ParisApplicationEnrollment {
  id: string;
  applicationId: string;
  enrollmentId?: string;
  lmsUserId?: string;
  studentDashboardId?: string;
  apprenticeRecordId?: string;
  enrolledById: string;
  enrollmentPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// WORKFLOW RESULT
// ============================================

export interface WorkflowResult {
  applicationId: string;
  previousStatus: ApplicationWorkflowStatus;
  currentStatus: ApplicationWorkflowStatus;
  createdTaskIds: string[];
}

// ============================================
// COMPLETENESS EVALUATION
// ============================================

export interface ApplicationCompletenessEvaluation {
  documentsComplete: boolean;
  missingRequiredDocuments: ParisApplicationDocument[];
  fundingComplete: boolean;
  approvedFunding: boolean;
  selfPaySelected: boolean;
  readyForAdmissions: boolean;
}

// ============================================
// DOCUMENT REQUIREMENTS
// ============================================

export interface DocumentRequirement {
  code: string;
  documentType: string;
  displayName: string;
  required: boolean;
}

// ============================================
// SUPABASE DATABASE TYPE
// ============================================

export type ParisDatabase = {
  public: {
    Tables: {
      paris_applications: {
        Row: ParisApplication;
        Insert: Omit<ParisApplication, 'createdAt' | 'updatedAt' | 'documents' | 'fundingCases' | 'tasks' | 'events' | 'notes' | 'decisions' | 'enrollment'>;
        Update: Partial<ParisApplication>;
      };
      paris_application_documents: {
        Row: ParisApplicationDocument;
        Insert: Omit<ParisApplicationDocument, 'createdAt' | 'updatedAt'>;
        Update: Partial<ParisApplicationDocument>;
      };
      paris_funding_cases: {
        Row: ParisFundingCase;
        Insert: Omit<ParisFundingCase, 'createdAt' | 'updatedAt'>;
        Update: Partial<ParisFundingCase>;
      };
      paris_workflow_tasks: {
        Row: ParisWorkflowTask;
        Insert: Omit<ParisWorkflowTask, 'createdAt' | 'updatedAt'>;
        Update: Partial<ParisWorkflowTask>;
      };
      paris_workflow_events: {
        Row: ParisWorkflowEvent;
        Insert: Omit<ParisWorkflowEvent, 'createdAt'>;
        Update: never;
      };
      paris_application_notes: {
        Row: ParisApplicationNote;
        Insert: Omit<ParisApplicationNote, 'createdAt' | 'updatedAt'>;
        Update: Partial<ParisApplicationNote>;
      };
      paris_application_decisions: {
        Row: ParisApplicationDecision;
        Insert: Omit<ParisApplicationDecision, 'decidedAt'>;
        Update: never;
      };
      paris_application_enrollments: {
        Row: ParisApplicationEnrollment;
        Insert: Omit<ParisApplicationEnrollment, 'createdAt' | 'updatedAt'>;
        Update: Partial<ParisApplicationEnrollment>;
      };
    };
  };
};

// ============================================
// HELPER TYPES
// ============================================

export type ApplicationWithRelations = ParisApplication & {
  documents: ParisApplicationDocument[];
  fundingCases: ParisFundingCase[];
  tasks: ParisWorkflowTask[];
};

export type Database = SupabaseClient<ParisDatabase>;
