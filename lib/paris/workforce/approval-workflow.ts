/**
 * PARIS AI Workforce - Approval Workflow System
 * Human-in-the-loop approval workflows for AI agents
 */

import { createClient } from '@supabase/supabase-js';
import { logActivity } from './agent-manager';
import type { ApprovalWorkflow, AIAgent } from './types';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Approval type configurations
export const APPROVAL_CONFIGS: Record<string, {
  label: string;
  description: string;
  autoApprove: boolean;
  conditions?: {
    maxAmount?: number;
    maxRecords?: number;
    timeWindow?: number; // minutes
    requiresUser?: string[];
  };
  escalationTimeout?: number; // hours
}> = {
  enrollment_decision: {
    label: 'Enrollment Decision',
    description: 'Approve or deny student enrollment applications',
    autoApprove: false,
    conditions: {
      maxAmount: 0,
    },
    escalationTimeout: 48,
  },
  funding_approval: {
    label: 'Funding Approval',
    description: 'Approve funding for student programs',
    autoApprove: true,
    conditions: {
      maxAmount: 500,
    },
    escalationTimeout: 24,
  },
  job_posting: {
    label: 'Job Posting',
    description: 'Approve job postings for job board',
    autoApprove: true,
    conditions: {
      requiresUser: ['employer_relations'],
    },
    escalationTimeout: 72,
  },
  candidate_referral: {
    label: 'Candidate Referral',
    description: 'Refer candidates to employers',
    autoApprove: false,
    escalationTimeout: 24,
  },
  grant_submission: {
    label: 'Grant Submission',
    description: 'Submit grant proposals',
    autoApprove: false,
    escalationTimeout: 168,
  },
  budget_approval: {
    label: 'Budget Approval',
    description: 'Approve budget allocations',
    autoApprove: false,
    conditions: {
      maxAmount: 1000,
    },
    escalationTimeout: 48,
  },
  compliance_exception: {
    label: 'Compliance Exception',
    description: 'Grant compliance exceptions',
    autoApprove: false,
    escalationTimeout: 4,
  },
  audit_review: {
    label: 'Audit Review',
    description: 'Review audit findings',
    autoApprove: false,
    escalationTimeout: 72,
  },
  curriculum_publish: {
    label: 'Curriculum Publish',
    description: 'Publish curriculum changes',
    autoApprove: true,
    conditions: {
      requiresUser: ['instructor'],
    },
    escalationTimeout: 168,
  },
  campaign_launch: {
    label: 'Campaign Launch',
    description: 'Launch marketing campaigns',
    autoApprove: false,
    conditions: {
      maxAmount: 500,
    },
    escalationTimeout: 48,
  },
  budget_spend: {
    label: 'Budget Spend',
    description: 'Approve marketing spend',
    autoApprove: false,
    conditions: {
      maxAmount: 200,
    },
    escalationTimeout: 24,
  },
  post_publish: {
    label: 'Post Publish',
    description: 'Publish social media posts',
    autoApprove: true,
    conditions: {
      maxRecords: 5,
      timeWindow: 60,
    },
  },
  content_publish: {
    label: 'Content Publish',
    description: 'Publish marketing content',
    autoApprove: true,
    conditions: {
      maxRecords: 10,
      timeWindow: 120,
    },
  },
  page_publish: {
    label: 'Page Publish',
    description: 'Publish website pages',
    autoApprove: false,
    conditions: {
      requiresUser: ['website_designer'],
    },
    escalationTimeout: 24,
  },
  code_deploy: {
    label: 'Code Deploy',
    description: 'Deploy code to production',
    autoApprove: false,
    escalationTimeout: 2,
  },
  exam_results: {
    label: 'Exam Results',
    description: 'Release exam results to students',
    autoApprove: true,
  },
  credential_issue: {
    label: 'Credential Issue',
    description: 'Issue credentials to graduates',
    autoApprove: true,
    conditions: {
      requiresUser: ['testing_proctor'],
    },
  },
  payment_plan: {
    label: 'Payment Plan',
    description: 'Set up payment plans',
    autoApprove: true,
    conditions: {
      maxAmount: 200,
    },
    escalationTimeout: 24,
  },
  agreement_sign: {
    label: 'Agreement Sign',
    description: 'Sign employer agreements',
    autoApprove: false,
    escalationTimeout: 72,
  },
  partnership_approval: {
    label: 'Partnership Approval',
    description: 'Approve new partnerships',
    autoApprove: false,
    escalationTimeout: 168,
  },
  calendar_booking: {
    label: 'Calendar Booking',
    description: 'Book executive calendar',
    autoApprove: false,
    escalationTimeout: 2,
  },
  communication_send: {
    label: 'Communication Send',
    description: 'Send official communications',
    autoApprove: false,
    escalationTimeout: 4,
  },
};

/**
 * Request approval from human
 */
export async function requestApproval(
  agentId: string,
  taskId: string,
  type: string,
  description: string,
  details: Record<string, unknown> = {}
): Promise<ApprovalWorkflow | null> {
  const config = APPROVAL_CONFIGS[type];
  
  if (!config) {
    throw new Error(`Unknown approval type: ${type}`);
  }

  // Check auto-approval conditions
  const canAutoApprove = checkAutoApproval(config, details);
  
  if (canAutoApprove) {
    // Auto-approve
    const workflow: ApprovalWorkflow = {
      id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId,
      taskId,
      type,
      description,
      status: 'approved',
      requestedAt: new Date().toISOString(),
      requestedBy: agentId,
      reviewedAt: new Date().toISOString(),
      autoApproved: true,
    };

    await saveWorkflow(workflow);
    await logActivity(agentId, {
      type: 'approval_request',
      action: `Auto-approved: ${type}`,
      output: { workflowId: workflow.id, details },
      status: 'approved',
    });

    return workflow;
  }

  // Create pending approval
  const workflow: ApprovalWorkflow = {
    id: `approval_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentId,
    taskId,
    type,
    description,
    status: 'pending',
    requestedAt: new Date().toISOString(),
    requestedBy: agentId,
  };

  await saveWorkflow(workflow);

  // Send notification (would integrate with notification system)
  await sendApprovalNotification(workflow);

  // Log the request
  await logActivity(agentId, {
    type: 'approval_request',
    action: `Requested approval: ${type}`,
    input: details,
    output: { workflowId: workflow.id },
    status: 'pending',
    requiresApproval: true,
  });

  return workflow;
}

/**
 * Check if approval can be auto-approved
 */
function checkAutoApproval(
  config: typeof APPROVAL_CONFIGS[string],
  details: Record<string, unknown>
): boolean {
  if (!config.autoApprove) return false;

  const { conditions } = config;
  if (!conditions) return true;

  // Check amount limits
  if (conditions.maxAmount !== undefined) {
    const amount = details.amount as number || details.total as number || 0;
    if (amount > conditions.maxAmount) return false;
  }

  // Check record limits
  if (conditions.maxRecords !== undefined) {
    const records = details.records as unknown[] || [];
    if (records.length > conditions.maxRecords) return false;
  }

  // Check required roles
  if (conditions.requiresUser) {
    // Would check if current user has required role
    // For now, return false to require approval
    return false;
  }

  return true;
}

/**
 * Approve a workflow
 */
export async function approveWorkflow(
  workflowId: string,
  reviewerId: string,
  comments?: string
): Promise<ApprovalWorkflow | null> {
  const { data: existing } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (!existing) return null;

  if (existing.status !== 'pending') {
    throw new Error('Workflow is not pending');
  }

  const updated: ApprovalWorkflow = {
    id: workflowId,
    agentId: existing.agent_id,
    taskId: existing.task_id,
    type: existing.type,
    description: existing.description,
    status: 'approved',
    requestedAt: existing.requested_at,
    requestedBy: existing.requested_by,
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    comments,
  };

  await supabase
    .from('approval_workflows')
    .update({
      status: 'approved',
      reviewed_at: updated.reviewedAt,
      reviewed_by: reviewerId,
      comments,
    })
    .eq('id', workflowId);

  await logActivity(existing.agent_id, {
    type: 'approval_request',
    action: `Approved: ${existing.type}`,
    output: { workflowId, comments },
    status: 'approved',
    userId: reviewerId,
  });

  return updated;
}

/**
 * Reject a workflow
 */
export async function rejectWorkflow(
  workflowId: string,
  reviewerId: string,
  comments: string
): Promise<ApprovalWorkflow | null> {
  const { data: existing } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('id', workflowId)
    .single();

  if (!existing) return null;

  if (existing.status !== 'pending') {
    throw new Error('Workflow is not pending');
  }

  await supabase
    .from('approval_workflows')
    .update({
      status: 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: reviewerId,
      comments,
    })
    .eq('id', workflowId);

  await logActivity(existing.agent_id, {
    type: 'approval_request',
    action: `Rejected: ${existing.type}`,
    output: { workflowId, comments },
    status: 'rejected',
    userId: reviewerId,
  });

  return {
    id: workflowId,
    agentId: existing.agent_id,
    taskId: existing.task_id,
    type: existing.type,
    description: existing.description,
    status: 'rejected',
    requestedAt: existing.requested_at,
    requestedBy: existing.requested_by,
    reviewedAt: new Date().toISOString(),
    reviewedBy: reviewerId,
    comments,
  };
}

/**
 * Get pending approvals
 */
export async function getPendingApprovals(
  options?: {
    agentId?: string;
    type?: string;
    assignedTo?: string;
    limit?: number;
  }
): Promise<ApprovalWorkflow[]> {
  let query = supabase
    .from('approval_workflows')
    .select('*')
    .eq('status', 'pending');

  if (options?.agentId) {
    query = query.eq('agent_id', options.agentId);
  }

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order('requested_at', { ascending: true });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    agentId: row.agent_id,
    taskId: row.task_id,
    type: row.type,
    description: row.description,
    status: row.status as ApprovalWorkflow['status'],
    requestedAt: row.requested_at,
    requestedBy: row.requested_by,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    comments: row.comments || undefined,
  }));
}

/**
 * Get approval history
 */
export async function getApprovalHistory(
  userId: string,
  options?: {
    status?: ApprovalWorkflow['status'];
    type?: string;
    limit?: number;
  }
): Promise<ApprovalWorkflow[]> {
  let query = supabase
    .from('approval_workflows')
    .select('*')
    .or(`requested_by.eq.${userId},reviewed_by.eq.${userId}`);

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order('requested_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    agentId: row.agent_id,
    taskId: row.task_id,
    type: row.type,
    description: row.description,
    status: row.status as ApprovalWorkflow['status'],
    requestedAt: row.requested_at,
    requestedBy: row.requested_by,
    reviewedAt: row.reviewed_at || undefined,
    reviewedBy: row.reviewed_by || undefined,
    comments: row.comments || undefined,
  }));
}

/**
 * Check for expired approvals
 */
export async function expireOldApprovals(): Promise<number> {
  const now = new Date();
  
  // Find pending approvals older than their escalation timeout
  const { data: pending } = await supabase
    .from('approval_workflows')
    .select('*')
    .eq('status', 'pending');

  if (!pending) return 0;

  let expiredCount = 0;

  for (const workflow of pending) {
    const config = APPROVAL_CONFIGS[workflow.type];
    if (!config?.escalationTimeout) continue;

    const requestedAt = new Date(workflow.requested_at);
    const escalationTime = new Date(requestedAt.getTime() + config.escalationTimeout * 60 * 60 * 1000);

    if (now > escalationTime) {
      await supabase
        .from('approval_workflows')
        .update({ status: 'expired' })
        .eq('id', workflow.id);
      
      expiredCount++;

      await logActivity(workflow.agent_id, {
        type: 'approval_request',
        action: `Expired: ${workflow.type}`,
        output: { workflowId: workflow.id },
        status: 'expired',
      });
    }
  }

  return expiredCount;
}

/**
 * Helper: Save workflow to database
 */
async function saveWorkflow(workflow: ApprovalWorkflow): Promise<void> {
  await supabase.from('approval_workflows').insert({
    id: workflow.id,
    agent_id: workflow.agentId,
    task_id: workflow.taskId,
    type: workflow.type,
    description: workflow.description,
    status: workflow.status,
    requested_at: workflow.requestedAt,
    requested_by: workflow.requestedBy,
    reviewed_at: workflow.reviewedAt,
    reviewed_by: workflow.reviewedBy,
    comments: workflow.comments,
    auto_approved: workflow.autoApproved,
  });
}

/**
 * Helper: Send approval notification
 */
async function sendApprovalNotification(workflow: ApprovalWorkflow): Promise<void> {
  const config = APPROVAL_CONFIGS[workflow.type];
  
  // Would integrate with notification system
  // For now, just log
  console.info(`[Approval Notification] New approval request:
    Type: ${config?.label || workflow.type}
    Description: ${workflow.description}
    From: ${workflow.agentId}
    ID: ${workflow.id}
  `);
}

/**
 * Get approval statistics
 */
export async function getApprovalStats(
  timeRange?: { start: string; end: string }
): Promise<{
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  expired: number;
  avgResponseTime: number;
  byType: Record<string, { total: number; approved: number; rejected: number }>;
}> {
  let query = supabase.from('approval_workflows').select('*');

  if (timeRange) {
    query = query.gte('requested_at', timeRange.start).lte('requested_at', timeRange.end);
  }

  const { data, error } = await query;

  if (error || !data) {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      expired: 0,
      avgResponseTime: 0,
      byType: {},
    };
  }

  const stats = {
    total: data.length,
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    avgResponseTime: 0,
    byType: {} as Record<string, { total: number; approved: number; rejected: number }>,
  };

  let totalResponseTime = 0;
  let responseCount = 0;

  for (const row of data) {
    // Count by status
    switch (row.status) {
      case 'pending': stats.pending++; break;
      case 'approved': stats.approved++; break;
      case 'rejected': stats.rejected++; break;
      case 'expired': stats.expired++; break;
    }

    // Group by type
    if (!stats.byType[row.type]) {
      stats.byType[row.type] = { total: 0, approved: 0, rejected: 0 };
    }
    stats.byType[row.type].total++;

    if (row.status === 'approved') stats.byType[row.type].approved++;
    if (row.status === 'rejected') stats.byType[row.type].rejected++;

    // Calculate response time
    if (row.reviewed_at) {
      const requested = new Date(row.requested_at).getTime();
      const reviewed = new Date(row.reviewed_at).getTime();
      totalResponseTime += reviewed - requested;
      responseCount++;
    }
  }

  stats.avgResponseTime = responseCount > 0 ? totalResponseTime / responseCount / 1000 / 60 : 0; // minutes

  return stats;
}
