/**
 * ZORA Admissions Orchestration
 *
 * Database rows are normalized once at this boundary into the canonical PARIS
 * camelCase domain model. Rules, transitions and notifications therefore share
 * one application shape instead of mixing database snake_case with domain types.
 */

import { createClient } from '@supabase/supabase-js';
import type { ApplicationEvent } from '@/lib/events/application-events';
import type {
  AdmissionsDecision,
  ApplicationDocumentStatus,
  ApplicationWorkflowStatus,
  ApplicationWorkflowType,
  FundingCaseStatus,
  FundingType,
  ParisApplication,
  ParisApplicationDocument,
  ParisFundingCase,
  ParisWorkflowTask,
  WorkflowTaskPriority,
  WorkflowTaskStatus,
} from '@/lib/paris/admissions/types';
import { transitionApplication } from '@/lib/paris/admissions/application-service';
import { sendWorkflowNotification, type NotificationTemplate } from '@/lib/integrations/notifications';
import {
  calculateRiskScore,
  calculateTaskPriority,
  evaluateApplicationCompleteness,
  needsStaffFollowUp,
  requiresPaymentArrangement,
  type ApplicationWithRelations,
} from './rules';

function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('Missing Supabase configuration');
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

type RawRow = Record<string, any>;

type ZoraApplication = ApplicationWithRelations & {
  tasks: ParisWorkflowTask[];
};

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function asNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function mapDocument(row: RawRow): ParisApplicationDocument {
  return {
    id: asString(row.id),
    applicationId: asString(row.application_id ?? row.applicationId),
    requirementCode: asString(row.requirement_code ?? row.requirementCode),
    documentType: asString(row.document_type ?? row.documentType),
    displayName: asString(row.display_name ?? row.displayName ?? row.document_type, 'Document'),
    status: asString(row.status, 'REQUIRED') as ApplicationDocumentStatus,
    storageKey: asOptionalString(row.storage_key ?? row.storageKey),
    fileName: asOptionalString(row.file_name ?? row.fileName),
    mimeType: asOptionalString(row.mime_type ?? row.mimeType),
    sizeBytes: asNumber(row.size_bytes ?? row.sizeBytes),
    rejectionReason: asOptionalString(row.rejection_reason ?? row.rejectionReason),
    reviewedById: asOptionalString(row.reviewed_by_id ?? row.reviewedById),
    reviewedAt: asOptionalString(row.reviewed_at ?? row.reviewedAt),
    uploadedAt: asOptionalString(row.uploaded_at ?? row.uploadedAt),
    expirationDate: asOptionalString(row.expiration_date ?? row.expirationDate),
    createdAt: asString(row.created_at ?? row.createdAt, new Date().toISOString()),
    updatedAt: asString(row.updated_at ?? row.updatedAt, new Date().toISOString()),
  };
}

function mapFundingCase(row: RawRow): ParisFundingCase {
  return {
    id: asString(row.id),
    applicationId: asString(row.application_id ?? row.applicationId),
    fundingType: asString(row.funding_type ?? row.fundingType, 'OTHER') as FundingType,
    status: asString(row.status, 'NOT_STARTED') as FundingCaseStatus,
    requestedAmount: asNumber(row.requested_amount ?? row.requestedAmount),
    approvedAmount: asNumber(row.approved_amount ?? row.approvedAmount),
    studentBalance: asNumber(row.student_balance ?? row.studentBalance),
    externalReference: asOptionalString(row.external_reference ?? row.externalReference),
    eligibilityResult:
      row.eligibility_result && typeof row.eligibility_result === 'object'
        ? row.eligibility_result
        : row.eligibilityResult && typeof row.eligibilityResult === 'object'
          ? row.eligibilityResult
          : undefined,
    denialReason: asOptionalString(row.denial_reason ?? row.denialReason),
    expirationDate: asOptionalString(row.expiration_date ?? row.expirationDate),
    submittedAt: asOptionalString(row.submitted_at ?? row.submittedAt),
    approvedAt: asOptionalString(row.approved_at ?? row.approvedAt),
    createdAt: asString(row.created_at ?? row.createdAt, new Date().toISOString()),
    updatedAt: asString(row.updated_at ?? row.updatedAt, new Date().toISOString()),
  };
}

function mapTask(row: RawRow): ParisWorkflowTask {
  return {
    id: asString(row.id),
    applicationId: asString(row.application_id ?? row.applicationId),
    taskType: asString(row.task_type ?? row.taskType),
    title: asString(row.title, 'Workflow task'),
    description: asOptionalString(row.description),
    assignedRole: asOptionalString(row.assigned_role ?? row.assignedRole),
    assignedUserId: asOptionalString(row.assigned_user_id ?? row.assignedUserId),
    priority: asString(row.priority, 'NORMAL') as WorkflowTaskPriority,
    status: asString(row.status, 'OPEN') as WorkflowTaskStatus,
    dueAt: asOptionalString(row.due_at ?? row.dueAt),
    completedAt: asOptionalString(row.completed_at ?? row.completedAt),
    metadata: row.metadata && typeof row.metadata === 'object' ? row.metadata : {},
    createdAt: asString(row.created_at ?? row.createdAt, new Date().toISOString()),
    updatedAt: asString(row.updated_at ?? row.updatedAt, new Date().toISOString()),
  };
}

function mapApplication(row: RawRow): ZoraApplication {
  const documents = (Array.isArray(row.documents) ? row.documents : []).map(mapDocument);
  const fundingCases = (Array.isArray(row.funding_cases)
    ? row.funding_cases
    : Array.isArray(row.fundingCases)
      ? row.fundingCases
      : []
  ).map(mapFundingCase);
  const tasks = (Array.isArray(row.tasks) ? row.tasks : []).map(mapTask);

  return {
    id: asString(row.id),
    applicationNumber: asString(row.application_number ?? row.applicationNumber ?? row.id),
    applicantId: asString(row.applicant_id ?? row.applicantId),
    programId: asString(row.program_id ?? row.programId),
    programSlug: asOptionalString(row.program_slug ?? row.programSlug),
    applicationType: asString(row.application_type ?? row.applicationType, 'STUDENT') as ApplicationWorkflowType,
    workflowStatus: asString(row.workflow_status ?? row.workflowStatus, 'DRAFT') as ApplicationWorkflowStatus,
    admissionsDecision: asString(row.admissions_decision ?? row.admissionsDecision, 'PENDING') as AdmissionsDecision,
    firstName: asString(row.first_name ?? row.firstName),
    middleName: asOptionalString(row.middle_name ?? row.middleName),
    lastName: asString(row.last_name ?? row.lastName),
    dateOfBirth: asOptionalString(row.date_of_birth ?? row.dateOfBirth),
    email: asString(row.email),
    phone: asString(row.phone),
    addressLine1: asOptionalString(row.address_line1 ?? row.addressLine1),
    addressLine2: asOptionalString(row.address_line2 ?? row.addressLine2),
    city: asOptionalString(row.city),
    state: asOptionalString(row.state),
    postalCode: asOptionalString(row.postal_code ?? row.postalCode),
    highestEducation: asOptionalString(row.highest_education ?? row.highestEducation),
    employmentStatus: asOptionalString(row.employment_status ?? row.employmentStatus),
    preferredSchedule: asOptionalString(row.preferred_schedule ?? row.preferredSchedule),
    desiredStartDate: asOptionalString(row.desired_start_date ?? row.desiredStartDate),
    careerGoal: asOptionalString(row.career_goal ?? row.careerGoal),
    barriers: Array.isArray(row.barriers) ? row.barriers.filter((value: unknown): value is string => typeof value === 'string') : [],
    eligibilityAnswers:
      row.eligibility_answers && typeof row.eligibility_answers === 'object'
        ? row.eligibility_answers
        : row.eligibilityAnswers && typeof row.eligibilityAnswers === 'object'
          ? row.eligibilityAnswers
          : {},
    eligibilityScore: Number(row.eligibility_score ?? row.eligibilityScore ?? 0),
    riskScore: Number(row.risk_score ?? row.riskScore ?? 0),
    source: asOptionalString(row.source),
    referralCode: asOptionalString(row.referral_code ?? row.referralCode),
    assignedRecruiterId: asOptionalString(row.assigned_recruiter_id ?? row.assignedRecruiterId),
    assignedAt: asOptionalString(row.assigned_at ?? row.assignedAt),
    submittedAt: asOptionalString(row.submitted_at ?? row.submittedAt),
    acceptedAt: asOptionalString(row.accepted_at ?? row.acceptedAt),
    enrolledAt: asOptionalString(row.enrolled_at ?? row.enrolledAt),
    createdAt: asString(row.created_at ?? row.createdAt, new Date().toISOString()),
    updatedAt: asString(row.updated_at ?? row.updatedAt, new Date().toISOString()),
    documents,
    fundingCases,
    tasks,
  };
}

async function fetchApplicationWithRelations(applicationId: string): Promise<ZoraApplication | null> {
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
    .maybeSingle();

  if (error || !data) {
    console.error('ZORA failed to fetch application', { applicationId, error });
    return null;
  }
  return mapApplication(data as RawRow);
}

async function notify(
  application: ParisApplication,
  template: NotificationTemplate,
  variables: Record<string, string> = {},
): Promise<void> {
  if (!application.email) return;
  await sendWorkflowNotification({
    template,
    applicationId: application.id,
    recipient: application.email,
    variables: {
      applicationId: application.id,
      firstName: application.firstName,
      ...variables,
    },
  });
}

async function ensureTask(input: {
  applicationId: string;
  taskType: string;
  title: string;
  description?: string;
  assignedRole?: string;
  priority?: WorkflowTaskPriority;
  dueAt?: Date;
  metadata?: Record<string, unknown>;
}): Promise<ParisWorkflowTask | null> {
  const supabase = getServiceClient();
  const { data: existing } = await supabase
    .from('paris_workflow_tasks')
    .select('*')
    .eq('application_id', input.applicationId)
    .eq('task_type', input.taskType)
    .in('status', ['OPEN', 'IN_PROGRESS', 'BLOCKED'])
    .maybeSingle();
  if (existing) return mapTask(existing as RawRow);

  const application = await fetchApplicationWithRelations(input.applicationId);
  if (!application) return null;
  const priority = input.priority ?? calculateTaskPriority(application, input.taskType);

  const { data, error } = await supabase
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
    .select('*')
    .maybeSingle();

  if (error || !data) {
    console.error('ZORA failed to create task', { applicationId: input.applicationId, error });
    return null;
  }
  return mapTask(data as RawRow);
}

async function cancelTasks(applicationId: string, taskTypes: string[]): Promise<void> {
  if (!taskTypes.length) return;
  await getServiceClient()
    .from('paris_workflow_tasks')
    .update({ status: 'CANCELLED' })
    .eq('application_id', applicationId)
    .in('task_type', taskTypes)
    .in('status', ['OPEN', 'IN_PROGRESS', 'BLOCKED']);
}

async function requestDocuments(application: ZoraApplication): Promise<void> {
  const evaluation = evaluateApplicationCompleteness(application);
  const missing = evaluation.missingRequiredDocuments;
  const codes = missing.map((document) => document.requirementCode).filter(Boolean);
  if (codes.length) {
    await getServiceClient()
      .from('paris_application_documents')
      .update({ status: 'REQUESTED' })
      .eq('application_id', application.id)
      .in('requirement_code', codes);
  }

  await transitionApplication(application.id, 'DOCUMENTS_REQUIRED', {
    actorType: 'ZORA',
    reason: 'Required documents are incomplete',
    metadata: { missingDocuments: codes },
  });
  await ensureTask({
    applicationId: application.id,
    taskType: 'COMPLETE_DOCUMENTS',
    title: 'Upload required documents',
    description: `Please upload: ${missing.map((document) => document.displayName).join(', ')}`,
    assignedRole: 'APPLICANT',
    priority: 'HIGH',
    dueAt: new Date(Date.now() + 3 * 86_400_000),
    metadata: { documentCodes: codes },
  });
  await notify(application, 'DOCUMENTS_REQUIRED');
}

async function initiateFundingReview(application: ZoraApplication): Promise<void> {
  const supabase = getServiceClient();
  for (const fundingCase of application.fundingCases) {
    if (fundingCase.status === 'NOT_STARTED') {
      await supabase.from('paris_funding_cases').update({ status: 'SCREENING' }).eq('id', fundingCase.id);
    }
  }
  await transitionApplication(application.id, 'FUNDING_REVIEW', {
    actorType: 'ZORA',
    reason: 'Funding review initiated',
    metadata: { fundingCount: application.fundingCases.length },
  });
  await ensureTask({
    applicationId: application.id,
    taskType: 'FUNDING_REVIEW',
    title: 'Review funding applications',
    description: 'Review and process active funding cases.',
    assignedRole: 'FINANCE',
    priority: 'NORMAL',
    dueAt: new Date(Date.now() + 5 * 86_400_000),
  });
}

async function initiateAdmissionsReview(application: ZoraApplication): Promise<void> {
  await transitionApplication(application.id, 'ADMISSIONS_REVIEW', {
    actorType: 'ZORA',
    reason: 'Documents and funding review are complete',
  });
  await ensureTask({
    applicationId: application.id,
    taskType: 'ADMISSIONS_DECISION',
    title: 'Record admissions decision',
    description: 'Review application and record the admissions decision.',
    assignedRole: 'ADMISSIONS',
    priority: 'HIGH',
    dueAt: new Date(Date.now() + 2 * 86_400_000),
  });
}

async function handleAcceptedApplication(application: ZoraApplication): Promise<void> {
  const evaluation = evaluateApplicationCompleteness(application);
  const requiresPayment = requiresPaymentArrangement(evaluation);
  const nextStatus: ApplicationWorkflowStatus = requiresPayment ? 'PAYMENT_REQUIRED' : 'READY_TO_ENROLL';
  await transitionApplication(application.id, nextStatus, {
    actorType: 'ZORA',
    reason: requiresPayment
      ? 'Student balance requires payment arrangement'
      : 'Acceptance and funding requirements complete',
  });
  await notify(application, requiresPayment ? 'PAYMENT_REQUIRED' : 'ACCEPTANCE');
  if (!requiresPayment) {
    await ensureTask({
      applicationId: application.id,
      taskType: 'FINAL_ENROLLMENT_REVIEW',
      title: 'Complete final enrollment verification',
      assignedRole: 'REGISTRAR',
      priority: 'URGENT',
      dueAt: new Date(Date.now() + 86_400_000),
    });
  }
}

export async function runZoraOrchestration(event: ApplicationEvent): Promise<void> {
  const applicationId = 'applicationId' in event ? event.applicationId : null;
  if (!applicationId) return;

  const application = await fetchApplicationWithRelations(applicationId);
  if (!application) return;

  const evaluation = evaluateApplicationCompleteness(application);
  const riskScore = calculateRiskScore(application);
  await getServiceClient().from('paris_applications').update({ risk_score: riskScore }).eq('id', applicationId);

  switch (event.type) {
    case 'application.created':
      await ensureTask({
        applicationId,
        taskType: 'COMPLETE_APPLICATION',
        title: 'Complete your application',
        description: 'Review and submit your application for review.',
        assignedRole: 'APPLICANT',
        priority: 'NORMAL',
        dueAt: new Date(Date.now() + 3 * 86_400_000),
      });
      break;

    case 'application.submitted':
      await ensureTask({
        applicationId,
        taskType: 'RECRUITER_REVIEW',
        title: 'Review new application',
        description: 'Review application for completeness and eligibility.',
        assignedRole: 'RECRUITER',
        priority: 'HIGH',
        dueAt: new Date(Date.now() + 86_400_000),
      });
      await notify(application, 'APPLICATION_RECEIVED');
      if (!evaluation.documentsComplete) await requestDocuments(application);
      else if (!evaluation.fundingComplete) await initiateFundingReview(application);
      else await initiateAdmissionsReview(application);
      break;

    case 'document.uploaded':
    case 'document.status_changed': {
      const updated = await fetchApplicationWithRelations(applicationId);
      if (!updated) break;
      const updatedEvaluation = evaluateApplicationCompleteness(updated);
      if (updatedEvaluation.readyForAdmissions) await initiateAdmissionsReview(updated);
      else if (updatedEvaluation.documentsComplete && !updatedEvaluation.fundingComplete) {
        await initiateFundingReview(updated);
      }
      break;
    }

    case 'document.rejected':
      await notify(application, 'DOCUMENT_REJECTED', { rejectionReason: event.reason });
      await ensureTask({
        applicationId,
        taskType: 'DOCUMENT_REUPLOAD',
        title: 'Re-upload rejected document',
        description: `Document was rejected: ${event.reason}`,
        assignedRole: 'APPLICANT',
        priority: 'HIGH',
        dueAt: new Date(Date.now() + 2 * 86_400_000),
      });
      break;

    case 'funding.updated':
    case 'funding.approved':
    case 'funding.denied': {
      const updated = await fetchApplicationWithRelations(applicationId);
      if (!updated) break;
      const updatedEvaluation = evaluateApplicationCompleteness(updated);
      if (updatedEvaluation.readyForAdmissions) await initiateAdmissionsReview(updated);
      if (event.type === 'funding.approved') {
        await notify(updated, 'FUNDING_APPROVED', { approvedAmount: String(event.approvedAmount) });
      } else if (event.type === 'funding.denied') {
        await notify(updated, 'FUNDING_DENIED');
      } else {
        await notify(updated, 'FUNDING_UPDATE');
      }
      break;
    }

    case 'admissions.decision.recorded':
      if (event.decision === 'ACCEPTED') await handleAcceptedApplication(application);
      else if (event.decision === 'REJECTED') await notify(application, 'REJECTION');
      else if (event.decision === 'WAITLISTED') await notify(application, 'WAITLIST');
      break;

    case 'application.ready-to-enroll':
      await ensureTask({
        applicationId,
        taskType: 'FINAL_ENROLLMENT_REVIEW',
        title: 'Complete final enrollment verification',
        assignedRole: 'REGISTRAR',
        priority: 'URGENT',
        dueAt: new Date(Date.now() + 86_400_000),
      });
      break;

    case 'application.enrolled':
      await notify(application, 'ENROLLMENT_COMPLETE');
      await cancelTasks(applicationId, [
        'COMPLETE_APPLICATION',
        'RECRUITER_REVIEW',
        'COMPLETE_DOCUMENTS',
        'DOCUMENT_REUPLOAD',
        'FUNDING_REVIEW',
        'ADMISSIONS_DECISION',
        'FINAL_ENROLLMENT_REVIEW',
      ]);
      break;

    case 'application.status.changed':
      if (needsStaffFollowUp(application)) {
        await ensureTask({
          applicationId,
          taskType: 'FOLLOW_UP',
          title: 'Application requires follow-up',
          description: `Application status is ${event.newStatus} and may need attention.`,
          assignedRole: 'RECRUITER',
          priority: 'HIGH',
        });
      }
      break;

    case 'task.overdue':
      await ensureTask({
        applicationId,
        taskType: 'TASK_OVERDUE',
        title: 'Overdue application task',
        assignedRole: 'RECRUITER',
        priority: 'URGENT',
        metadata: { originalTaskId: event.taskId },
      });
      break;

    default:
      break;
  }
}

export async function checkOverdueTasks(): Promise<void> {
  const supabase = getServiceClient();
  const { data: overdueTasks } = await supabase
    .from('paris_workflow_tasks')
    .select('*, application:paris_applications(id,email,first_name)')
    .eq('status', 'OPEN')
    .lt('due_at', new Date().toISOString());

  for (const raw of overdueTasks ?? []) {
    const task = raw as RawRow;
    await ensureTask({
      applicationId: asString(task.application_id),
      taskType: 'TASK_OVERDUE',
      title: `Overdue: ${asString(task.title, 'Workflow task')}`,
      description: task.due_at ? `Task was due ${new Date(task.due_at).toLocaleDateString()}` : 'Task is overdue.',
      assignedRole: asOptionalString(task.assigned_role) ?? 'RECRUITER',
      priority: 'URGENT',
      metadata: { originalTaskId: task.id },
    });

    const applicationJoin = Array.isArray(task.application) ? task.application[0] : task.application;
    const recipient = asOptionalString(applicationJoin?.email);
    if (recipient && task.assigned_role !== 'APPLICANT') {
      await sendWorkflowNotification({
        template: 'TASK_OVERDUE',
        applicationId: asString(task.application_id),
        recipient,
        variables: {
          firstName: asString(applicationJoin?.first_name),
          taskTitle: asString(task.title),
          dueDate: task.due_at ? new Date(task.due_at).toLocaleDateString() : '',
        },
      });
    }
  }
}

export async function checkStalledApplications(): Promise<void> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
  const { data: stalledApps } = await getServiceClient()
    .from('paris_applications')
    .select('id,updated_at')
    .not('workflow_status', 'in', '("ENROLLED","REJECTED","WITHDRAWN")')
    .lt('updated_at', sevenDaysAgo);

  for (const app of stalledApps ?? []) {
    await ensureTask({
      applicationId: app.id,
      taskType: 'ESCALATE_STALLED',
      title: 'Stalled application - escalation required',
      description: 'Application has not been updated in over 7 days.',
      assignedRole: 'COMPLIANCE',
      priority: 'HIGH',
      metadata: { lastUpdate: app.updated_at },
    });
  }
}
