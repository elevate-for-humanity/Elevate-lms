/**
 * lib/curriculum/approval-workflow.ts
 * 
 * Human Review and Approval Workflow
 * Triggers review process after validation
 */

import { createAdminClient } from '@/lib/supabase/admin';
import type { CurriculumPackage, ApprovalPacket } from '@/lib/curriculum/package/types';

export type ApprovalStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'revision_requested';

export interface ApprovalWorkflow {
  id: string;
  programId: string;
  programTitle: string;
  version: string;
  status: ApprovalStatus;
  submittedAt: string;
  submittedBy: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  revisionNotes?: string[];
  checklist: ApprovalChecklistItem[];
  package: {
    instructorGuides: boolean;
    syllabus: boolean;
    skillsChecklists: boolean;
    practicalRubrics: boolean;
    labActivities: boolean;
    clockHoursComplete: boolean;
  };
  requiredApprovals: string[];
  completedApprovals: string[];
}

export interface ApprovalChecklistItem {
  id: string;
  label: string;
  required: boolean;
  verified: boolean;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

/**
 * Default approval checklist
 */
export function createDefaultChecklist(): ApprovalChecklistItem[] {
  return [
    { id: 'prog-desc', label: 'Program description is complete and accurate', required: true, verified: false },
    { id: 'prog-obj', label: 'Program learning objectives align with credential requirements', required: true, verified: false },
    { id: 'clock-hours', label: 'Total clock hours meet minimum requirements', required: true, verified: false },
    { id: 'hour-breakdown', label: 'Clock hours are categorized correctly (lecture/lab/clinical)', required: true, verified: false },
    { id: 'modules', label: 'All required modules are present', required: true, verified: false },
    { id: 'lessons', label: 'Lesson content meets quality standards', required: true, verified: false },
    { id: 'objectives', label: 'Learning objectives are measurable and aligned', required: true, verified: false },
    { id: 'instructor-guide', label: 'Instructor guide is complete', required: true, verified: false },
    { id: 'syllabus', label: 'Syllabus includes all required policies', required: true, verified: false },
    { id: 'checklists', label: 'Skills checklists cover all competencies', required: true, verified: false },
    { id: 'rubrics', label: 'Practical rubrics have clear evaluation criteria', required: true, verified: false },
    { id: 'assessments', label: 'Assessments align with learning objectives', required: true, verified: false },
    { id: 'competencies', label: 'Competency coverage is complete', required: true, verified: false },
    { id: 'compliance', label: 'Program complies with state/federal regulations', required: true, verified: false },
    { id: 'materials', label: 'Required materials are listed', required: false, verified: false },
  ];
}

/**
 * Submit package for approval review
 */
export async function submitForApproval(
  programId: string,
  pkg: CurriculumPackage,
  submittedBy: string
): Promise<ApprovalWorkflow> {
  const supabase = createAdminClient();
  const workflowId = crypto.randomUUID();

  const workflow: ApprovalWorkflow = {
    id: workflowId,
    programId,
    programTitle: pkg.programTitle,
    version: pkg.version,
    status: 'pending',
    submittedAt: new Date().toISOString(),
    submittedBy,
    checklist: createDefaultChecklist(),
    package: {
      instructorGuides: !!pkg.instructorGuides,
      syllabus: !!pkg.syllabus,
      skillsChecklists: pkg.skillsChecklists.length > 0,
      practicalRubrics: pkg.practicalRubrics.length > 0,
      labActivities: pkg.labActivities.length > 0,
      clockHoursComplete: pkg.clockHourBreakdown.length > 0,
    },
    requiredApprovals: ['program_director', 'compliance_officer', 'state_liaison'],
    completedApprovals: [],
  };

  // Insert into database
  await supabase.from('approval_workflows').insert({
    id: workflow.id,
    program_id: workflow.programId,
    program_title: workflow.programTitle,
    version: workflow.version,
    status: workflow.status,
    submitted_at: workflow.submittedAt,
    submitted_by: workflow.submittedBy,
    checklist_json: workflow.checklist,
    package_json: workflow.package,
    required_approvals: workflow.requiredApprovals,
    completed_approvals: workflow.completedApprovals,
  });

  // Create notification for reviewers
  await supabase.from('notifications').insert({
    user_id: submittedBy, // Self-notification for now
    type: 'approval_submitted',
    title: 'Curriculum Package Submitted for Review',
    message: `${pkg.programTitle} has been submitted for approval review.`,
    metadata: { workflowId, programId },
  });

  return workflow;
}

/**
 * Get approval workflow
 */
export async function getApprovalWorkflow(workflowId: string): Promise<ApprovalWorkflow | null> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    programId: data.program_id,
    programTitle: data.program_title,
    version: data.version,
    status: data.status,
    submittedAt: data.submitted_at,
    submittedBy: data.submitted_by,
    reviewedAt: data.reviewed_at,
    reviewedBy: data.reviewed_by,
    reviewNotes: data.review_notes,
    revisionNotes: data.revision_notes || [],
    checklist: data.checklist_json,
    package: data.package_json,
    requiredApprovals: data.required_approvals,
    completedApprovals: data.completed_approvals,
  };
}

/**
 * Verify checklist item
 */
export async function verifyChecklistItem(
  workflowId: string,
  itemId: string,
  verified: boolean,
  verifiedBy: string,
  notes?: string
): Promise<void> {
  const supabase = createAdminClient();

  const workflow = await getApprovalWorkflow(workflowId);
  if (!workflow) return;

  const updatedChecklist = workflow.checklist.map(item =>
    item.id === itemId
      ? { ...item, verified, verifiedBy, verifiedAt: new Date().toISOString(), notes }
      : item
  );

  // Check if all required items are verified
  const allRequiredVerified = updatedChecklist
    .filter(item => item.required)
    .every(item => item.verified);

  // Update status if ready
  const newStatus: ApprovalStatus = allRequiredVerified ? 'in_review' : 'pending';

  await supabase
    .from('approval_workflows')
    .update({
      checklist_json: updatedChecklist,
      status: newStatus,
    })
    .eq('id', workflowId);
}

/**
 * Approve workflow
 */
export async function approveWorkflow(
  workflowId: string,
  reviewerId: string,
  reviewNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = createAdminClient();

  const workflow = await getApprovalWorkflow(workflowId);
  if (!workflow) {
    return { success: false, error: 'Workflow not found' };
  }

  // Check all required items are verified
  const unverifiedRequired = workflow.checklist.filter(item => item.required && !item.verified);
  if (unverifiedRequired.length > 0) {
    return { 
      success: false, 
      error: `Cannot approve: ${unverifiedRequired.length} required items not verified` 
    };
  }

  // Add reviewer to completed approvals
  const updatedApprovals = [...workflow.completedApprovals, reviewerId];
  const allApproved = updatedApprovals.length >= workflow.requiredApprovals.length;

  const newStatus: ApprovalStatus = allApproved ? 'approved' : 'in_review';

  await supabase
    .from('approval_workflows')
    .update({
      status: newStatus,
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      review_notes: reviewNotes,
      completed_approvals: updatedApprovals,
    })
    .eq('id', workflowId);

  // If fully approved, publish the curriculum
  if (allApproved) {
    await supabase
      .from('programs')
      .update({ status: 'published' })
      .eq('id', workflow.programId);
  }

  return { success: true };
}

/**
 * Request revision
 */
export async function requestRevision(
  workflowId: string,
  reviewerId: string,
  revisionNotes: string
): Promise<void> {
  const supabase = createAdminClient();

  const workflow = await getApprovalWorkflow(workflowId);
  if (!workflow) return;

  await supabase
    .from('approval_workflows')
    .update({
      status: 'revision_requested',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      review_notes: revisionNotes,
      revision_notes: [...(workflow.revisionNotes || []), revisionNotes],
    })
    .eq('id', workflowId);
}

/**
 * Reject workflow
 */
export async function rejectWorkflow(
  workflowId: string,
  reviewerId: string,
  rejectionReason: string
): Promise<void> {
  const supabase = createAdminClient();

  await supabase
    .from('approval_workflows')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      review_notes: rejectionReason,
    })
    .eq('id', workflowId);
}

/**
 * Get workflows by program
 */
export async function getWorkflowsByProgram(programId: string): Promise<ApprovalWorkflow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('program_id', programId)
    .order('submitted_at', { ascending: false });

  if (error) return [];

  return (data || []).map(row => ({
    id: row.id,
    programId: row.program_id,
    programTitle: row.program_title,
    version: row.version,
    status: row.status,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    reviewNotes: row.review_notes,
    revisionNotes: row.revision_notes || [],
    checklist: row.checklist_json,
    package: row.package_json,
    requiredApprovals: row.required_approvals,
    completedApprovals: row.completed_approvals,
  }));
}

/**
 * Get pending workflows for reviewer
 */
export async function getPendingWorkflows(): Promise<ApprovalWorkflow[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('approval_workflows')
    .select('*')
    .in('status', ['pending', 'in_review'])
    .order('submitted_at', { ascending: true });

  if (error) return [];

  return (data || []).map(row => ({
    id: row.id,
    programId: row.program_id,
    programTitle: row.program_title,
    version: row.version,
    status: row.status,
    submittedAt: row.submitted_at,
    submittedBy: row.submitted_by,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    reviewNotes: row.review_notes,
    revisionNotes: row.revision_notes || [],
    checklist: row.checklist_json,
    package: row.package_json,
    requiredApprovals: row.required_approvals,
    completedApprovals: row.completed_approvals,
  }));
}
