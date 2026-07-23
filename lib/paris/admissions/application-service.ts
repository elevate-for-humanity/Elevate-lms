/**
 * PARIS Application Service
 * 
 * Core CRUD operations for the application workflow.
 * Handles application creation, transitions, and submissions.
 */

import crypto from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import type {
  ApplicationWorkflowStatus,
  ApplicationWorkflowType,
  CreateApplicationInput,
  TransitionContext,
  AdmissionsDecisionInput,
  WorkflowResult,
  ParisApplication,
  ParisApplicationDocument,
  ParisFundingCase,
  ParisWorkflowTask,
  FundingType,
} from './types';
import { assertTransition, isTerminalState } from './state-machine';
import { getDocumentRequirements } from './document-requirements';
import { publishApplicationEvent } from '@/lib/events/event-bus';

// ============================================
// SUPABASE CLIENT
// ============================================

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// ============================================
// APPLICATION NUMBER GENERATION
// ============================================

function generateApplicationNumber(): string {
  const year = new Date().getFullYear();
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EFH-${year}-${random}`;
}

// ============================================
// APPLICATION CRUD
// ============================================

/**
 * Create a new application with digital binder and funding cases
 */
export async function createApplication(input: CreateApplicationInput) {
  const supabase = getServiceClient();
  
  const requestedFunding: FundingType[] = input.requestedFunding ?? ['SELF_PAY'];
  
  // Get document requirements
  const documentRequirements = getDocumentRequirements({
    applicationType: input.applicationType ?? 'STUDENT',
    requestedFunding,
  });
  
  // Use service role client for admin operations
  const { data: application, error } = await supabase.rpc('paris_create_application', {
    p_application_number: generateApplicationNumber(),
    p_applicant_id: input.applicantId,
    p_program_id: input.programId,
    p_program_slug: input.programId, // Will be resolved by trigger
    p_application_type: input.applicationType ?? 'STUDENT',
    
    // Personal
    p_first_name: input.firstName.trim(),
    p_middle_name: input.middleName?.trim() ?? null,
    p_last_name: input.lastName.trim(),
    p_date_of_birth: input.dateOfBirth ?? null,
    p_email: input.email.trim().toLowerCase(),
    p_phone: input.phone.trim(),
    
    // Address
    p_address_line_1: input.addressLine1?.trim() ?? null,
    p_address_line_2: input.addressLine2?.trim() ?? null,
    p_city: input.city?.trim() ?? null,
    p_state: input.state?.trim() ?? null,
    p_postal_code: input.postalCode?.trim() ?? null,
    
    // Education & Career
    p_highest_education: input.highestEducation ?? null,
    p_employment_status: input.employmentStatus ?? null,
    p_preferred_schedule: input.preferredSchedule ?? null,
    p_desired_start_date: input.desiredStartDate ?? null,
    p_career_goal: input.careerGoal ?? null,
    p_barriers: input.barriers ?? [],
    p_eligibility_answers: input.eligibilityAnswers ?? {},
    
    // Source
    p_source: input.source ?? 'direct',
    p_referral_code: input.referralCode ?? null,
    
    // Documents
    p_document_requirements: documentRequirements.map((req) => ({
      requirement_code: req.code,
      document_type: req.documentType,
      display_name: req.displayName,
      status: req.required ? 'REQUIRED' : 'WAIVED',
    })),
    
    // Funding
    p_funding_types: requestedFunding,
  });
  
  if (error) {
    console.error('Failed to create application:', error);
    throw new Error(`Failed to create application: ${error.message}`);
  }
  
  // Publish creation event
  await publishApplicationEvent({
    type: 'application.created',
    applicationId: data.id,
  });
  
  return data;
}

/**
 * Get application by ID with relations
 */
export async function getApplication(applicationId: string): Promise<ParisApplication | null> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('paris_applications')
    .select(`
      *,
      documents:paris_application_documents(*),
      funding_cases:paris_funding_cases(*),
      tasks:paris_workflow_tasks(*)
    `)
    .eq('id', applicationId)
    .single();
  
  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  
  return data;
}

/**
 * Get applications by applicant
 */
export async function getApplicationsByApplicant(applicantId: string): Promise<ParisApplication[]> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('paris_applications')
    .select(`
      *,
      documents:paris_application_documents(*),
      funding_cases:paris_funding_cases(*)
    `)
    .eq('applicant_id', applicantId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data ?? [];
}

/**
 * Transition application to new status
 */
export async function transitionApplication(
  applicationId: string,
  nextStatus: ApplicationWorkflowStatus,
  context: TransitionContext,
): Promise<WorkflowResult> {
  const supabase = getServiceClient();
  
  // Get current application
  const { data: current, error: fetchError } = await supabase
    .from('paris_applications')
    .select('id, workflow_status, submitted_at, accepted_at, enrolled_at')
    .eq('id', applicationId)
    .single();
  
  if (fetchError || !current) {
    throw new Error('Application not found');
  }
  
  const currentStatus = current.workflow_status as ApplicationWorkflowStatus;
  
  // Validate transition
  assertTransition(currentStatus, nextStatus);
  
  // Prepare update data
  const updateData: Record<string, unknown> = {
    workflow_status: nextStatus,
  };
  
  // Set timestamps based on status
  if (nextStatus === 'ELIGIBILITY_REVIEW' && !current.submitted_at) {
    updateData.submitted_at = new Date().toISOString();
  }
  if (nextStatus === 'ACCEPTED' && !current.accepted_at) {
    updateData.accepted_at = new Date().toISOString();
  }
  if (nextStatus === 'ENROLLED' && !current.enrolled_at) {
    updateData.enrolled_at = new Date().toISOString();
  }
  
  // Update application
  const { data: updated, error: updateError } = await supabase
    .from('paris_applications')
    .update(updateData)
    .eq('id', applicationId)
    .eq('workflow_status', currentStatus) // Optimistic lock
    .select()
    .single();
  
  if (updateError || !updated) {
    throw new Error('Failed to update application status');
  }
  
  // Create workflow event
  const { data: event, error: eventError } = await supabase
    .from('paris_workflow_events')
    .insert({
      application_id: applicationId,
      event_type: 'application.status.changed',
      actor_type: context.actorType,
      actor_id: context.actorId ?? null,
      previous_status: currentStatus,
      new_status: nextStatus,
      payload: {
        reason: context.reason,
        metadata: context.metadata,
      },
    })
    .select()
    .single();
  
  if (eventError) {
    console.error('Failed to create workflow event:', eventError);
  }
  
  // Publish event
  await publishApplicationEvent({
    type: 'application.status.changed',
    applicationId,
    previousStatus: currentStatus,
    newStatus: nextStatus,
  });
  
  return {
    applicationId,
    previousStatus: currentStatus,
    currentStatus: nextStatus,
    createdTaskIds: [], // Tasks created by ZORA
  };
}

/**
 * Submit application for review
 */
export async function submitApplication(
  applicationId: string,
  applicantId: string,
): Promise<WorkflowResult> {
  const supabase = getServiceClient();
  
  // Verify ownership
  const { data: application, error } = await supabase
    .from('paris_applications')
    .select('id, workflow_status, first_name, last_name, email, phone, program_id, applicant_id')
    .eq('id', applicationId)
    .eq('applicant_id', applicantId)
    .single();
  
  if (error || !application) {
    throw new Error('Application not found or access denied');
  }
  
  // Check required fields
  if (!application.first_name || !application.last_name || 
      !application.email || !application.phone || !application.program_id) {
    throw new Error('Application is missing required fields');
  }
  
  // Submit and transition
  const result = await transitionApplication(
    applicationId,
    'ELIGIBILITY_REVIEW',
    {
      actorId: applicantId,
      actorType: 'APPLICANT',
      reason: 'Applicant submitted application',
    },
  );
  
  // Publish submission event
  await publishApplicationEvent({
    type: 'application.submitted',
    applicationId,
  });
  
  return result;
}

/**
 * Record admissions decision
 */
export async function recordAdmissionsDecision(
  applicationId: string,
  input: AdmissionsDecisionInput,
  decidedById: string,
): Promise<WorkflowResult> {
  const supabase = getServiceClient();
  
  // Map decision to status
  const statusMap: Record<string, ApplicationWorkflowStatus> = {
    PENDING: 'ADMISSIONS_REVIEW',
    CONDITIONAL_ACCEPTANCE: 'CONDITIONALLY_ACCEPTED',
    ACCEPTED: 'ACCEPTED',
    WAITLISTED: 'WAITLISTED',
    REFERRED: 'REFERRED',
    REJECTED: 'REJECTED',
  };
  
  const nextStatus = statusMap[input.decision];
  if (!nextStatus) {
    throw new Error(`Invalid decision: ${input.decision}`);
  }
  
  // Create decision record
  const { error: decisionError } = await supabase
    .from('paris_application_decisions')
    .insert({
      application_id: applicationId,
      decision: input.decision,
      reason: input.reason ?? null,
      conditions: input.conditions ?? [],
      decided_by_id: decidedById,
    });
  
  if (decisionError) {
    throw new Error(`Failed to create decision: ${decisionError.message}`);
  }
  
  // Update application decision field
  await supabase
    .from('paris_applications')
    .update({ admissions_decision: input.decision })
    .eq('id', applicationId);
  
  // Transition status
  const result = await transitionApplication(
    applicationId,
    nextStatus,
    {
      actorId: decidedById,
      actorType: 'ADMISSIONS',
      reason: input.reason,
      metadata: { conditions: input.conditions },
    },
  );
  
  // Publish decision event
  await publishApplicationEvent({
    type: 'admissions.decision.recorded',
    applicationId,
    decision: input.decision,
  });
  
  return result;
}

// ============================================
// DOCUMENT OPERATIONS
// ============================================

/**
 * Upload document
 */
export async function uploadDocument(
  applicationId: string,
  requirementCode: string,
  file: Buffer,
  fileName: string,
  mimeType: string,
): Promise<ParisApplicationDocument> {
  const supabase = getServiceClient();
  
  // Get requirement info
  const { data: existingDoc, error: findError } = await supabase
    .from('paris_application_documents')
    .select('*')
    .eq('application_id', applicationId)
    .eq('requirement_code', requirementCode)
    .single();
  
  if (findError && findError.code !== 'PGRST116') {
    throw new Error(`Failed to find document: ${findError.message}`);
  }
  
  // Generate storage key
  const storageKey = `applications/${applicationId}/documents/${requirementCode}/${Date.now()}-${fileName}`;
  
  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from('paris-documents')
    .upload(storageKey, file, {
      contentType: mimeType,
      upsert: true,
    });
  
  if (uploadError) {
    throw new Error(`Failed to upload file: ${uploadError.message}`);
  }
  
  // Update document record
  const documentData = {
    application_id: applicationId,
    storage_key: storageKey,
    file_name: fileName,
    mime_type: mimeType,
    size_bytes: file.length,
    status: 'UPLOADED' as const,
    uploaded_at: new Date().toISOString(),
  };
  
  let document: ParisApplicationDocument;
  
  if (existingDoc) {
    const { data, error: updateError } = await supabase
      .from('paris_application_documents')
      .update(documentData)
      .eq('id', existingDoc.id)
      .select()
      .single();
    
    if (updateError) {
      throw new Error(`Failed to update document: ${updateError.message}`);
    }
    document = data;
  } else {
    throw new Error('Document requirement not found in application');
  }
  
  // Publish upload event
  await publishApplicationEvent({
    type: 'document.uploaded',
    applicationId,
    documentId: document.id,
  });
  
  return document;
}

/**
 * Update document status (for staff review)
 */
export async function updateDocumentStatus(
  documentId: string,
  status: 'APPROVED' | 'REJECTED',
  rejectionReason: string | undefined,
  reviewedById: string,
): Promise<ParisApplicationDocument> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('paris_application_documents')
    .update({
      status,
      rejection_reason: rejectionReason ?? null,
      reviewed_by_id: reviewedById,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', documentId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to update document status: ${error.message}`);
  }
  
  // Publish rejection event if rejected
  if (status === 'REJECTED') {
    await publishApplicationEvent({
      type: 'document.rejected',
      applicationId: data.application_id,
      documentId: data.id,
      reason: rejectionReason ?? 'No reason provided',
    });
  }
  
  return data;
}

/**
 * Get document for download (returns signed URL)
 */
export async function getDocumentUrl(documentId: string): Promise<string | null> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('paris_application_documents')
    .select('storage_key')
    .eq('id', documentId)
    .single();
  
  if (error || !data) return null;
  
  const { data: urlData } = await supabase.storage
    .from('paris-documents')
    .createSignedUrl(data.storage_key, 3600); // 1 hour
  
  return urlData?.signedUrl ?? null;
}

// ============================================
// TASK OPERATIONS
// ============================================

/**
 * Create a workflow task
 */
export async function createTask(input: {
  applicationId: string;
  taskType: string;
  title: string;
  description?: string;
  assignedRole?: string;
  assignedUserId?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueAt?: Date;
  metadata?: Record<string, unknown>;
}): Promise<ParisWorkflowTask> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('paris_workflow_tasks')
    .insert({
      application_id: input.applicationId,
      task_type: input.taskType,
      title: input.title,
      description: input.description ?? null,
      assigned_role: input.assignedRole ?? null,
      assigned_user_id: input.assignedUserId ?? null,
      priority: input.priority ?? 'NORMAL',
      status: 'OPEN',
      due_at: input.dueAt?.toISOString() ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
  
  return data;
}

/**
 * Complete a task
 */
export async function completeTask(taskId: string): Promise<ParisWorkflowTask> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('paris_workflow_tasks')
    .update({
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to complete task: ${error.message}`);
  }
  
  return data;
}

/**
 * Get open tasks for user or role
 */
export async function getOpenTasks(
  userId?: string,
  role?: string,
): Promise<ParisWorkflowTask[]> {
  const supabase = getServiceClient();
  
  let query = supabase
    .from('paris_workflow_tasks')
    .select('*, application:paris_applications(*)')
    .eq('status', 'OPEN')
    .order('due_at', { ascending: true });
  
  if (userId) {
    query = query.eq('assigned_user_id', userId);
  } else if (role) {
    query = query.eq('assigned_role', role);
  }
  
  const { data, error } = await query;
  
  if (error) throw error;
  return data ?? [];
}

/**
 * Get tasks for an application
 */
export async function getApplicationTasks(applicationId: string): Promise<ParisWorkflowTask[]> {
  const supabase = getServiceClient();
  
  const { data, error } = await supabase
    .from('paris_workflow_tasks')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data ?? [];
}

// ============================================
// FUNDING OPERATIONS
// ============================================

/**
 * Update funding case status
 */
export async function updateFundingCase(
  fundingCaseId: string,
  updates: {
    status?: string;
    approvedAmount?: number;
    studentBalance?: number;
    externalReference?: string;
    denialReason?: string;
  },
): Promise<ParisFundingCase> {
  const supabase = getServiceClient();
  
  const updateData: Record<string, unknown> = {};
  if (updates.status) updateData.status = updates.status;
  if (updates.approvedAmount !== undefined) updateData.approved_amount = updates.approvedAmount;
  if (updates.studentBalance !== undefined) updateData.student_balance = updates.studentBalance;
  if (updates.externalReference) updateData.external_reference = updates.externalReference;
  if (updates.denialReason) updateData.denial_reason = updates.denialReason;
  
  if (updates.status === 'APPROVED' || updates.status === 'PARTIALLY_APPROVED') {
    updateData.approved_at = new Date().toISOString();
  }
  
  const { data, error } = await supabase
    .from('paris_funding_cases')
    .update(updateData)
    .eq('id', fundingCaseId)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to update funding case: ${error.message}`);
  }
  
  // Publish funding update event
  await publishApplicationEvent({
    type: 'funding.updated',
    applicationId: data.application_id,
    fundingCaseId: data.id,
  });
  
  return data;
}
