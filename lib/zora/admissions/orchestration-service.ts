/**
 * ZORA Orchestration Service
 * 
 * ZORA monitors the application journey, assigns work, catches failures,
 * and escalates anything that stalls.
 * 
 * PARIS moves the applicant through the journey.
 * ZORA monitors the journey, assigns work, catches failures, and escalates.
 */

import type { ApplicationEvent } from '@/lib/events/application-events';
import type {
  ParisApplication,
  ParisApplicationDocument,
  ParisFundingCase,
  ParisWorkflowTask,
} from '@/lib/paris/admissions/types';
import { createClient } from '@supabase/supabase-js';
import {
  evaluateApplicationCompleteness,
  calculateRiskScore,
  calculateTaskPriority,
  needsStaffFollowUp,
  requiresPaymentArrangement,
} from './rules';
import { transitionApplication } from '@/lib/paris/admissions/application-service';
import { sendWorkflowNotification } from '@/lib/integrations/notifications';
import type { ApplicationWorkflowStatus } from '@/lib/paris/admissions/types';

// ============================================
// SUPABASE CLIENT
// ============================================

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase configuration');
  }
  
  return createClient(supabaseUrl, serviceRoleKey);
}

// ============================================
// DATA FETCHING
// ============================================

interface ApplicationWithRelations {
  id: string;
  workflow_status: ApplicationWorkflowStatus;
  applicant_id: string;
  email: string;
  first_name: string;
  last_name: string;
  program_id: string;
  updated_at: string;
  created_at: string;
  documents: ParisApplicationDocument[];
  funding_cases: ParisFundingCase[];
  tasks: ParisWorkflowTask[];
}

/**
 * Fetch application with all workflow relations
 */
async function fetchApplicationWithRelations(
  applicationId: string,
): Promise<ApplicationWithRelations | null> {
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
  
  if (error || !data) {
    console.error('Failed to fetch application:', error);
    return null;
  }
  
  return data;
}

// ============================================
// TASK MANAGEMENT
// ============================================

/**
 * Ensure a task exists, skip if already open
 */
async function ensureTask(input: {
  applicationId: string;
  taskType: string;
  title: string;
  description?: string;
  assignedRole?: string;
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  dueAt?: Date;
  metadata?: Record<string, unknown>;
}): Promise<ParisWorkflowTask | null> {
  const supabase = getServiceClient();
  
  // Check for existing open task of same type
  const { data: existing } = await supabase
    .from('paris_workflow_tasks')
    .select('*')
    .eq('application_id', input.applicationId)
    .eq('task_type', input.taskType)
    .in('status', ['OPEN', 'IN_PROGRESS', 'BLOCKED'])
    .single();
  
  if (existing) {
    return existing;
  }
  
  // Calculate priority based on application state
  const application = await fetchApplicationWithRelations(input.applicationId);
  const priority = input.priority ?? calculateTaskPriority(
    application as ApplicationWithRelations,
    input.taskType,
  );
  
  // Create new task
  const { data: task, error } = await supabase
    .from('paris_workflow_tasks')
    .insert({
      application_id: input.applicationId,
      task_type: input.taskType,
      title: input.title,
      description: input.description ?? null,
      assigned_role: input.assignedRole ?? null,
      priority,
      status: 'OPEN',
      due_at: input.dueAt?.toISOString() ?? null,
      metadata: input.metadata ?? {},
    })
    .select()
    .single();
  
  if (error) {
    console.error('Failed to create task:', error);
    return null;
  }
  
  return task;
}

/**
 * Cancel all open tasks of a specific type
 */
async function cancelTasks(
  applicationId: string,
  taskType: string,
): Promise<void> {
  const supabase = getServiceClient();
  
  await supabase
    .from('paris_workflow_tasks')
    .update({ status: 'CANCELLED' })
    .eq('application_id', applicationId)
    .eq('task_type', taskType)
    .in('status', ['OPEN', 'IN_PROGRESS']);
}

// ============================================
// STATUS TRANSITIONS
// ============================================

/**
 * Transition to document required status
 */
async function requestDocuments(
  applicationId: string,
  missingDocuments: ParisApplicationDocument[],
): Promise<void> {
  const docCodes = missingDocuments.map((d) => d.requirement_code);
  
  // Update document statuses to REQUESTED
  const supabase = getServiceClient();
  await supabase
    .from('paris_application_documents')
    .update({ status: 'REQUESTED' })
    .eq('application_id', applicationId)
    .in('requirement_code', docCodes);
  
  // Transition to DOCUMENTS_REQUIRED if not already there
  await transitionApplication(applicationId, 'DOCUMENTS_REQUIRED', {
    actorType: 'ZORA',
    reason: 'Required documents are incomplete',
    metadata: { missingDocuments: docCodes },
  });
  
  // Create task for applicant
  await ensureTask({
    applicationId,
    taskType: 'COMPLETE_DOCUMENTS',
    title: 'Upload required documents',
    description: `Please upload the following documents: ${missingDocuments.map((d) => d.display_name).join(', ')}`,
    assignedRole: 'APPLICANT',
    priority: 'HIGH',
    dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    metadata: { documentCodes: docCodes },
  });
}

/**
 * Transition to funding review status
 */
async function initiateFundingReview(
  applicationId: string,
  fundingCases: ParisFundingCase[],
): Promise<void> {
  // Update funding cases to SCREENING
  const supabase = getServiceClient();
  for (const fc of fundingCases) {
    if (fc.status === 'NOT_STARTED') {
      await supabase
        .from('paris_funding_cases')
        .update({ status: 'SCREENING' })
        .eq('id', fc.id);
    }
  }
  
  // Transition to FUNDING_REVIEW
  await transitionApplication(applicationId, 'FUNDING_REVIEW', {
    actorType: 'ZORA',
    reason: 'Funding review initiated',
    metadata: { fundingCount: fundingCases.length },
  });
  
  // Create task for finance
  await ensureTask({
    applicationId,
    taskType: 'FUNDING_REVIEW',
    title: 'Review funding applications',
    description: 'Review and process funding applications',
    assignedRole: 'FINANCE',
    priority: 'NORMAL',
    dueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
  });
}

/**
 * Transition to admissions review status
 */
async function initiateAdmissionsReview(
  applicationId: string,
): Promise<void> {
  await transitionApplication(applicationId, 'ADMISSIONS_REVIEW', {
    actorType: 'ZORA',
    reason: 'Documents and funding review are complete',
  });
  
  // Create task for admissions
  await ensureTask({
    applicationId,
    taskType: 'ADMISSIONS_DECISION',
    title: 'Record admissions decision',
    description: 'Review application and record admissions decision',
    assignedRole: 'ADMISSIONS',
    priority: 'HIGH',
    dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
  });
}

/**
 * Handle accepted application
 */
async function handleAcceptedApplication(
  applicationId: string,
  evaluation: ReturnType<typeof evaluateApplicationCompleteness>,
): Promise<void> {
  const requiresPayment = requiresPaymentArrangement(evaluation);
  
  const nextStatus = requiresPayment ? 'PAYMENT_REQUIRED' : 'READY_TO_ENROLL';
  
  await transitionApplication(applicationId, nextStatus, {
    actorType: 'ZORA',
    reason: requiresPayment
      ? 'Student balance requires payment arrangement'
      : 'Acceptance and funding requirements complete',
  });
  
  // Send notification
  await sendWorkflowNotification({
    template: requiresPayment ? 'PAYMENT_REQUIRED' : 'ACCEPTANCE',
    applicationId,
  });
  
  // Create enrollment task if no payment needed
  if (!requiresPayment) {
    await ensureTask({
      applicationId,
      taskType: 'FINAL_ENROLLMENT_REVIEW',
      title: 'Complete final enrollment verification',
      assignedRole: 'REGISTRAR',
      priority: 'URGENT',
      dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
    });
  }
}

// ============================================
// MAIN ORCHESTRATION
// ============================================

/**
 * Main ZORA orchestration handler
 * Called for each application event
 */
export async function runZoraOrchestration(
  event: ApplicationEvent,
): Promise<void> {
  console.warn('ZORA processing event:', event.type, {
    applicationId: 'applicationId' in event ? event.applicationId : 'unknown',
  });
  
  const applicationId = 'applicationId' in event ? event.applicationId : null;
  
  if (!applicationId) {
    console.warn('ZORA: Event missing applicationId', event.type);
    return;
  }
  
  // Fetch application with relations
  const application = await fetchApplicationWithRelations(applicationId);
  
  if (!application) {
    console.error('ZORA: Application not found', applicationId);
    return;
  }
  
  // Evaluate completeness and risk
  const evaluation = evaluateApplicationCompleteness(application as ApplicationWithRelations);
  const riskScore = calculateRiskScore(application as ApplicationWithRelations);
  
  // Update risk score
  const supabase = getServiceClient();
  await supabase
    .from('paris_applications')
    .update({ risk_score: riskScore })
    .eq('id', applicationId);
  
  // Process based on event type
  switch (event.type) {
    case 'application.created': {
      // Create initial task for applicant
      await ensureTask({
        applicationId,
        taskType: 'COMPLETE_APPLICATION',
        title: 'Complete your application',
        description: 'Review and submit your application for review',
        assignedRole: 'APPLICANT',
        priority: 'NORMAL',
        dueAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
      });
      break;
    }
    
    case 'application.submitted': {
      // Assign to recruiter
      await ensureTask({
        applicationId,
        taskType: 'RECRUITER_REVIEW',
        title: 'Review new application',
        description: 'Review application for completeness and eligibility',
        assignedRole: 'RECRUITER',
        priority: 'HIGH',
        dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      });
      
      // Notify applicant
      await sendWorkflowNotification({
        template: 'APPLICATION_RECEIVED',
        applicationId,
      });
      
      // Determine next status based on completeness
      if (!evaluation.documentsComplete) {
        await requestDocuments(applicationId, evaluation.missingRequiredDocuments);
      } else if (!evaluation.fundingComplete) {
        await initiateFundingReview(applicationId, application.funding_cases);
      } else {
        await initiateAdmissionsReview(applicationId);
      }
      break;
    }
    
    case 'document.uploaded': {
      // Re-evaluate completeness
      const updatedApp = await fetchApplicationWithRelations(applicationId);
      const updatedEval = evaluateApplicationCompleteness(updatedApp!);
      
      // Check if ready for admissions
      if (
        updatedEval.readyForAdmissions &&
        ['DOCUMENTS_REQUIRED', 'FUNDING_REVIEW'].includes(application.workflow_status)
      ) {
        await initiateAdmissionsReview(applicationId);
      } else if (updatedEval.documentsComplete) {
        // Documents done, initiate funding if not done
        await initiateFundingReview(applicationId, application.funding_cases);
      }
      break;
    }
    
    case 'funding.updated': {
      // Re-evaluate completeness
      const updatedApp = await fetchApplicationWithRelations(applicationId);
      const updatedEval = evaluateApplicationCompleteness(updatedApp!);
      
      // Check if ready for admissions
      if (
        updatedEval.readyForAdmissions &&
        ['DOCUMENTS_REQUIRED', 'FUNDING_REVIEW'].includes(application.workflow_status)
      ) {
        await initiateAdmissionsReview(applicationId);
      }
      break;
    }
    
    case 'admissions.decision.recorded': {
      if (event.decision === 'ACCEPTED') {
        await handleAcceptedApplication(applicationId, evaluation);
      }
      break;
    }
    
    case 'application.ready-to-enroll': {
      await ensureTask({
        applicationId,
        taskType: 'FINAL_ENROLLMENT_REVIEW',
        title: 'Complete final enrollment verification',
        assignedRole: 'REGISTRAR',
        priority: 'URGENT',
        dueAt: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day
      });
      break;
    }
    
    case 'application.enrolled': {
      await sendWorkflowNotification({
        template: 'ENROLLMENT_COMPLETE',
        applicationId,
      });
      
      // Cancel any remaining tasks
      await cancelTasks(applicationId, 'COMPLETE_APPLICATION');
      await cancelTasks(applicationId, 'RECRUITER_REVIEW');
      await cancelTasks(applicationId, 'DOCUMENT_UPLOAD');
      await cancelTasks(applicationId, 'FUNDING_REVIEW');
      await cancelTasks(applicationId, 'ADMISSIONS_DECISION');
      break;
    }
    
    // Status changes - update risk and create alerts if needed
    case 'application.status.changed': {
      if (needsStaffFollowUp(application as ApplicationWithRelations)) {
        await ensureTask({
          applicationId,
          taskType: 'FOLLOW_UP',
          title: 'Application requires follow-up',
          description: `Application status is ${event.newStatus} and may need attention`,
          assignedRole: 'RECRUITER',
          priority: 'HIGH',
        });
      }
      break;
    }
    
    // Document rejection - notify and create task
    case 'document.rejected': {
      await sendWorkflowNotification({
        template: 'DOCUMENT_REJECTED',
        applicationId,
        variables: { reason: event.reason },
      });
      
      await ensureTask({
        applicationId,
        taskType: 'DOCUMENT_REUPLOAD',
        title: 'Re-upload rejected document',
        description: `Document was rejected: ${event.reason}`,
        assignedRole: 'APPLICANT',
        priority: 'HIGH',
        dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      });
      break;
    }
    
    default:
      // No action needed
      break;
  }
  
  console.info('ZORA orchestration complete for:', event.type, { applicationId });
}

/**
 * Check for overdue tasks and create alerts
 * Should be called by a cron job
 */
export async function checkOverdueTasks(): Promise<void> {
  const supabase = getServiceClient();
  
  // Find overdue tasks
  const { data: overdueTasks } = await supabase
    .from('paris_workflow_tasks')
    .select('*, application:paris_applications(*)')
    .eq('status', 'OPEN')
    .lt('due_at', new Date().toISOString());
  
  if (!overdueTasks?.length) return;
  
  for (const task of overdueTasks) {
    // Create alert task
    await ensureTask({
      applicationId: task.application_id,
      taskType: 'TASK_OVERDUE',
      title: `Overdue: ${task.title}`,
      description: `Task was due ${new Date(task.due_at).toLocaleDateString()}`,
      assignedRole: task.assigned_role ?? 'RECRUITER',
      priority: 'URGENT',
      metadata: { originalTaskId: task.id },
    });
    
    // Notify if staff task
    if (task.assigned_role && task.assigned_role !== 'APPLICANT') {
      await sendWorkflowNotification({
        template: 'TASK_OVERDUE',
        applicationId: task.application_id,
        variables: {
          taskTitle: task.title,
          dueDate: new Date(task.due_at).toLocaleDateString(),
        },
      });
    }
  }
}

/**
 * Check for stalled applications and escalate
 * Should be called by a cron job
 */
export async function checkStalledApplications(): Promise<void> {
  const supabase = getServiceClient();
  
  // Find applications not updated in 7 days
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  const { data: stalledApps } = await supabase
    .from('paris_applications')
    .select('*')
    .not('workflow_status', 'in', '("ENROLLED","REJECTED","WITHDRAWN")')
    .lt('updated_at', sevenDaysAgo);
  
  if (!stalledApps?.length) return;
  
  for (const app of stalledApps) {
    // Create escalation task
    await ensureTask({
      applicationId: app.id,
      taskType: 'ESCALATE_STALLED',
      title: 'Stalled application - escalation required',
      description: `Application has not been updated in over 7 days`,
      assignedRole: 'COMPLIANCE',
      priority: 'HIGH',
      metadata: { lastUpdate: app.updated_at },
    });
  }
}
