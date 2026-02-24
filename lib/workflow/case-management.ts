import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import { auditLog, AuditAction, AuditEntity } from '@/lib/logging/auditLog';

export type CaseStatus = 'draft' | 'pending_signatures' | 'active' | 'in_progress' | 'completed' | 'closed' | 'cancelled';
export type SignerRole = 'student' | 'employer' | 'program_holder' | 'witness' | 'admin';

export interface EnrollmentCase {
  id: string;
  case_number: string;
  student_id: string;
  program_id?: string;
  program_holder_id?: string;
  employer_id?: string;
  program_slug: string;
  program_type: string;
  region_id: string;
  funding_source?: string;
  status: CaseStatus;
  signatures_required: SignerRole[];
  signatures_completed: SignerRole[];
  all_signatures_complete: boolean;
  signatures_completed_at?: string;
  created_at: string;
  updated_at: string;
  activated_at?: string;
  completed_at?: string;
}

export interface CreateCaseParams {
  studentId: string;
  programSlug: string;
  programType?: string;
  programId?: string;
  programHolderId?: string;
  employerId?: string;
  regionId?: string;
  fundingSource?: string;
  signaturesRequired?: SignerRole[];
}

export interface SignatureParams {
  caseId: string;
  signerRole: SignerRole;
  signerId: string;
  signerName: string;
  signerEmail: string;
  agreementType: string;
  agreementVersion?: string;
  signatureData?: any;
}

export interface SignatureCompleteness {
  complete: boolean;
  required: SignerRole[];
  completed: SignerRole[];
  missing: SignerRole[];
}

export async function createEnrollmentCase(params: CreateCaseParams): Promise<EnrollmentCase | null> {
  const supabase = createAdminClient();
  
  const defaultSignatures: SignerRole[] = params.signaturesRequired || ['student', 'employer', 'program_holder'];
  
  const { data, error } = await supabase
    .from('enrollment_cases')
    .insert({
      student_id: params.studentId,
      program_slug: params.programSlug,
      program_type: params.programType || 'apprenticeship',
      program_id: params.programId,
      program_holder_id: params.programHolderId,
      employer_id: params.employerId,
      region_id: params.regionId || 'IN',
      funding_source: params.fundingSource,
      signatures_required: defaultSignatures,
      status: 'draft',
    })
    .select('*')
    .single();

  if (error) {
    logger.error('[createEnrollmentCase] Error:', error);
    return null;
  }

  await auditLog({
    actorId: params.studentId,
    actorRole: 'student',
    action: AuditAction.CASE_CREATED,
    entity: AuditEntity.ENROLLMENT_CASE,
    entityId: data.id,
    metadata: {
      case_number: data.case_number,
      program_slug: params.programSlug,
      signatures_required: defaultSignatures,
    },
  });

  await supabase.from('case_events').insert({
    case_id: data.id,
    event_type: 'case_created',
    actor_id: params.studentId,
    actor_role: 'student',
    after_state: { status: 'draft', program_slug: params.programSlug },
    metadata: { signatures_required: defaultSignatures },
  });

  return data;
}

export async function checkSignatureCompleteness(caseId: string): Promise<SignatureCompleteness> {
  const supabase = createAdminClient();

  const { data: caseData } = await supabase
    .from('enrollment_cases')
    .select('signatures_required, signatures_completed')
    .eq('id', caseId)
    .single();

  if (!caseData) {
    return { complete: false, required: [], completed: [], missing: [] };
  }

  const required: SignerRole[] = caseData.signatures_required || [];
  const completed: SignerRole[] = caseData.signatures_completed || [];
  const missing = required.filter(role => !completed.includes(role));

  return {
    complete: missing.length === 0,
    required,
    completed,
    missing,
  };
}

export async function addSignature(params: SignatureParams): Promise<{ success: boolean; completeness: SignatureCompleteness }> {
  const supabase = createAdminClient();

  // agreement_acceptances: subject_type, subject_id, agreement_key, agreement_version, accepted_name, accepted_email, accepted_ip, user_agent
  const { data: signature, error } = await supabase
    .from('agreement_acceptances')
    .insert({
      subject_type: params.signerRole === 'host_shop' ? 'host_shop' : 'apprentice',
      subject_id: params.signerId,
      agreement_key: params.agreementType,
      agreement_version: params.agreementVersion || '1.0',
      accepted_name: params.signerName,
      accepted_email: params.signerEmail,
      accepted_at: new Date().toISOString(),
      accepted_ip: '0.0.0.0',
      user_agent: 'case-management',
    })
    .select('id')
    .single();

  if (error) {
    logger.error('[addSignature] Error:', error);
    return { success: false, completeness: { complete: false, required: [], completed: [], missing: [] } };
  }

  await auditLog({
    actorId: params.signerId,
    actorRole: params.signerRole,
    action: AuditAction.SIGNATURE_ADDED,
    entity: AuditEntity.SIGNATURE,
    entityId: signature.id,
    metadata: {
      case_id: params.caseId,
      agreement_type: params.agreementType,
      signer_role: params.signerRole,
    },
  });

  const completeness = await checkSignatureCompleteness(params.caseId);
  return { success: true, completeness };
}

export async function transitionCaseStatus(caseId: string, newStatus: CaseStatus, actorId?: string, actorRole?: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: currentCase } = await supabase
    .from('enrollment_cases')
    .select('status')
    .eq('id', caseId)
    .single();

  if (!currentCase) return false;

  const oldStatus = currentCase.status;

  const updateData: any = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  if (newStatus === 'active') {
    updateData.activated_at = new Date().toISOString();
  } else if (newStatus === 'completed') {
    updateData.completed_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from('enrollment_cases')
    .update(updateData)
    .eq('id', caseId);

  if (error) {
    logger.error('[transitionCaseStatus] Error:', error);
    return false;
  }

  await auditLog({
    actorId,
    actorRole,
    action: AuditAction.CASE_STATUS_CHANGED,
    entity: AuditEntity.ENROLLMENT_CASE,
    entityId: caseId,
    metadata: { old_status: oldStatus, new_status: newStatus },
  });

  return true;
}

export async function getCaseTimeline(caseId: string): Promise<any[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('case_events')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });

  return data || [];
}

export async function getCaseTasks(caseId: string): Promise<any[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from('case_tasks')
    .select('*')
    .eq('case_id', caseId)
    .order('sequence_order', { ascending: true });

  return data || [];
}

export async function completeTask(taskId: string, completedBy: string, evidenceUrl?: string, evidenceMetadata?: any): Promise<boolean> {
  const supabase = createAdminClient();

  const { data: task, error } = await supabase
    .from('case_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      completed_by: completedBy,
      evidence_url: evidenceUrl,
      evidence_metadata: evidenceMetadata || {},
    })
    .eq('id', taskId)
    .select('case_id, task_type, title, assigned_to_role')
    .single();

  if (error) {
    logger.error('[completeTask] Error:', error);
    return false;
  }

  await auditLog({
    actorId: completedBy,
    actorRole: task.assigned_to_role,
    action: AuditAction.TASK_COMPLETED,
    entity: AuditEntity.TASK,
    entityId: taskId,
    metadata: {
      case_id: task.case_id,
      task_type: task.task_type,
      title: task.title,
    },
  });

  return true;
}

export async function initializeCaseTasks(caseId: string): Promise<number> {
  const supabase = createAdminClient();

  const { data } = await supabase.rpc('initialize_case_tasks', { p_case_id: caseId });

  if (data && data > 0) {
    await auditLog({
      actorRole: 'system',
      action: AuditAction.TASK_CREATED,
      entity: AuditEntity.ENROLLMENT_CASE,
      entityId: caseId,
      metadata: { task_count: data, trigger: 'manual_initialization' },
    });
  }

  return data || 0;
}

export async function submitCaseForSignatures(caseId: string, actorId: string): Promise<boolean> {
  return transitionCaseStatus(caseId, 'pending_signatures', actorId, 'student');
}
