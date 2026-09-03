/**
 * PARIS AI Workforce
 * AI employee system with roles, permissions, and approval workflows.
 *
 * Agent configuration remains here; execution is delegated to the canonical
 * Elevate AI command/tool runtime so this module cannot become a second AI
 * execution authority.
 */

export * from './types';
export * from './agent-manager';
export * from './approval-workflow';

import { createAgent, getAgent, listAgents, updateAgent, deleteAgent, cloneAgent, logActivity } from './agent-manager';
import { requestApproval, approveWorkflow, rejectWorkflow, getPendingApprovals, getApprovalHistory } from './approval-workflow';
import type { AIAgent, AgentRole, AgentConfig, AgentPermissions } from './types';
import { executeAICommand } from '@/lib/ai/runtime/command-executor';
import type { AIAgentId } from '@/lib/ai/tools/registry';

export async function hireAgent(
  ownerId: string,
  role: AgentRole,
  name?: string,
  config?: Partial<AgentConfig>,
  permissions?: Partial<AgentPermissions>,
): Promise<AIAgent | null> {
  void name;
  return createAgent(ownerId, role, config, permissions);
}

export async function getAgentTeam(ownerId: string): Promise<{
  all: AIAgent[];
  active: AIAgent[];
  byRole: Record<AgentRole, AIAgent[]>;
}> {
  const all = await listAgents(ownerId);
  const active = all.filter((agent) => agent.status === 'active');
  const byRole: Record<AgentRole, AIAgent[]> = {} as Record<AgentRole, AIAgent[]>;
  for (const agent of all) {
    if (!byRole[agent.role]) byRole[agent.role] = [];
    byRole[agent.role].push(agent);
  }
  return { all, active, byRole };
}

function canonicalAgentForRole(role: AgentRole): AIAgentId {
  switch (role) {
    case 'recruiter':
    case 'admissions_specialist':
      return 'PARIS';
    case 'career_coach':
    case 'instructor':
    case 'customer_support':
      return 'ELLIE';
    case 'compliance_officer':
    case 'data_analyst':
      return 'ZORA';
    default:
      return 'LIZZY';
  }
}

/**
 * Compatibility execution entry point for workforce agents.
 *
 * The old implementation returned a synthetic `executed: true` placeholder.
 * It now delegates to executeAICommand(), which is the canonical permission,
 * tool, approval, audit, and provider-aware runtime.
 */
export async function executeAgentTask(
  agentId: string,
  task: {
    type: string;
    action: string;
    details: Record<string, unknown>;
  },
  options?: {
    skipApproval?: boolean;
    forceApproval?: boolean;
    actorId?: string;
    actorRoles?: readonly string[];
    tenantId?: string | null;
    correlationId?: string;
    requestHeaders?: Headers | Record<string, string | null | undefined>;
    adminOrigin?: string;
    appOrigin?: string;
    approvalGranted?: boolean;
  },
): Promise<{
  success: boolean;
  result?: Record<string, unknown>;
  approvalId?: string;
  requiredConfirmation?: string;
  error?: string;
}> {
  const agent = await getAgent(agentId);
  if (!agent) return { success: false, error: 'Agent not found' };
  if (agent.status !== 'active') return { success: false, error: 'Agent is not active' };

  if (!options?.skipApproval && (options?.forceApproval || agent.config.approvalRequired)) {
    if (options?.forceApproval || agent.config.approvalTypes.includes(task.type) || agent.config.approvalTypes.includes('*')) {
      const approval = await requestApproval(
        agentId,
        `task_${Date.now()}`,
        task.type,
        task.action,
        task.details,
      );
      if (approval?.status === 'pending') {
        return {
          success: true,
          approvalId: approval.id,
          result: { status: 'pending_approval', approvalId: approval.id },
        };
      }
    }
  }

  const canonicalAgent = canonicalAgentForRole(agent.role);
  const actorId = options?.actorId ?? agent.ownerId;
  const command = [
    task.type,
    task.action,
    Object.keys(task.details).length ? JSON.stringify(task.details) : '',
  ].filter(Boolean).join(' ');
  const started = Date.now();

  try {
    const execution = await executeAICommand(command, {
      agent: canonicalAgent,
      agentLabel: agent.name,
      agentRole: agent.role,
      actorId,
      actorRoles: options?.actorRoles ?? [],
      tenantId: options?.tenantId ?? null,
      correlationId: options?.correlationId ?? `paris-workforce:${agent.id}:${Date.now()}`,
      requestHeaders: options?.requestHeaders,
      adminOrigin: options?.adminOrigin ?? process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.elevateforhumanity.org',
      appOrigin: options?.appOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://app.elevateforhumanity.org',
      approvalGranted: options?.approvalGranted === true,
      commandContext: {
        toolInput: task.details,
      },
    });

    await logActivity(agent.id, {
      type: task.type as any,
      action: task.action,
      input: task.details,
      output: execution.payload as Record<string, unknown> | undefined,
      status: execution.ok ? 'completed' : execution.status === 'approval_required' ? 'pending' : 'failed',
      duration: Date.now() - started,
      userId: actorId,
      requiresApproval: execution.status === 'approval_required',
      error: execution.ok ? undefined : execution.message,
    });

    if (execution.status === 'approval_required') {
      return {
        success: true,
        requiredConfirmation: execution.requiredConfirmation,
        result: {
          status: 'pending_approval',
          tool: execution.tool,
          risk: execution.risk,
          traceId: execution.traceId,
        },
      };
    }

    if (!execution.ok) {
      return {
        success: false,
        error: execution.message,
        result: {
          status: execution.status,
          tool: execution.tool,
          traceId: execution.traceId,
        },
      };
    }

    return {
      success: true,
      result: {
        status: execution.status,
        executed: execution.executed,
        message: execution.message,
        tool: execution.tool,
        provider: execution.provider,
        payload: execution.payload,
        traceId: execution.traceId,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Task execution failed';
    await logActivity(agent.id, {
      type: task.type as any,
      action: task.action,
      input: task.details,
      status: 'failed',
      duration: Date.now() - started,
      userId: actorId,
      requiresApproval: false,
      error: message,
    }).catch(() => undefined);
    return { success: false, error: message };
  }
}

export async function getAgentPerformance(agentId: string): Promise<{
  metrics: AIAgent['metrics'];
  recentActivity: number;
  approvalRate: number;
  status: string;
} | null> {
  const agent = await getAgent(agentId);
  if (!agent) return null;

  const pending = await getPendingApprovals({ agentId });
  void pending;
  const history = await getApprovalHistory(agent.ownerId, { limit: 100 });
  const totalApprovals = history.filter((item) => item.agentId === agentId).length;
  const approved = history.filter((item) => item.agentId === agentId && item.status === 'approved').length;

  return {
    metrics: agent.metrics,
    recentActivity: agent.metrics.totalTasks,
    approvalRate: totalApprovals > 0 ? approved / totalApprovals : 0,
    status: agent.status,
  };
}

export async function reassignAgentRole(
  agentId: string,
  newRole: AgentRole,
): Promise<AIAgent | null> {
  void newRole;
  return updateAgent(agentId, {});
}

export async function pauseAgent(agentId: string): Promise<AIAgent | null> {
  return updateAgent(agentId, { status: 'inactive' });
}

export async function resumeAgent(agentId: string): Promise<AIAgent | null> {
  return updateAgent(agentId, { status: 'active' });
}

export async function trainAgent(
  agentId: string,
  knowledge: {
    content: string;
    source?: string;
    metadata?: Record<string, unknown>;
  }[],
): Promise<number> {
  const { addAgentKnowledge } = await import('./agent-manager');
  let added = 0;
  for (const item of knowledge) {
    await addAgentKnowledge(agentId, item.content, 'manual', item.metadata);
    added += 1;
  }
  await updateAgent(agentId, { status: 'training' });
  return added;
}

export async function getAgentAvailability(agentId: string): Promise<{
  isAvailable: boolean;
  currentLoad: number;
  maxLoad: number;
  waitingTasks: number;
}> {
  const agent = await getAgent(agentId);
  if (!agent) return { isAvailable: false, currentLoad: 0, maxLoad: 0, waitingTasks: 0 };

  const pending = await getPendingApprovals({ agentId });
  return {
    isAvailable: agent.status === 'active',
    currentLoad: agent.metrics.activeHours,
    maxLoad: agent.permissions.maxRecordsPerAction,
    waitingTasks: pending.length,
  };
}
