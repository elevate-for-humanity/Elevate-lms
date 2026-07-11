/**
 * PARIS AI Workforce
 * AI employee system with roles, permissions, and approval workflows
 */

export * from './types';
export * from './agent-manager';
export * from './approval-workflow';

import { createAgent, getAgent, listAgents, updateAgent, deleteAgent, cloneAgent } from './agent-manager';
import { requestApproval, approveWorkflow, rejectWorkflow, getPendingApprovals, getApprovalHistory } from './approval-workflow';
import type { AIAgent, AgentRole, AgentConfig, AgentPermissions } from './types';

/**
 * Create a specialized AI employee
 */
export async function hireAgent(
  ownerId: string,
  role: AgentRole,
  name?: string,
  config?: Partial<AgentConfig>,
  permissions?: Partial<AgentPermissions>
): Promise<AIAgent | null> {
  return createAgent(ownerId, role, config, permissions);
}

/**
 * Get team of AI agents
 */
export async function getAgentTeam(ownerId: string): Promise<{
  all: AIAgent[];
  active: AIAgent[];
  byRole: Record<AgentRole, AIAgent[]>;
}> {
  const all = await listAgents(ownerId);
  const active = all.filter(a => a.status === 'active');
  
  const byRole: Record<AgentRole, AIAgent[]> = {} as Record<AgentRole, AIAgent[]>;
  for (const agent of all) {
    if (!byRole[agent.role]) {
      byRole[agent.role] = [];
    }
    byRole[agent.role].push(agent);
  }

  return { all, active, byRole };
}

/**
 * Execute agent task with approval workflow
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
  }
): Promise<{
  success: boolean;
  result?: Record<string, unknown>;
  approvalId?: string;
  error?: string;
}> {
  const agent = await getAgent(agentId);
  
  if (!agent) {
    return { success: false, error: 'Agent not found' };
  }

  if (agent.status !== 'active') {
    return { success: false, error: 'Agent is not active' };
  }

  // Check if approval is required
  if (!options?.skipApproval && agent.config.approvalRequired) {
    if (agent.config.approvalTypes.includes(task.type) || agent.config.approvalTypes.includes('*')) {
      const approval = await requestApproval(agentId, `task_${Date.now()}`, task.type, task.action, task.details);
      
      if (approval?.status === 'pending') {
        return {
          success: true,
          approvalId: approval.id,
          result: { status: 'pending_approval', approvalId: approval.id },
        };
      }
    }
  }

  // Execute task (would integrate with AI model)
  try {
    // Placeholder for actual AI execution
    const result = await executeTask(agent, task);
    return { success: true, result };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Task execution failed',
    };
  }
}

/**
 * Placeholder for actual AI task execution
 */
async function executeTask(
  agent: AIAgent,
  task: { type: string; action: string; details: Record<string, unknown> }
): Promise<Record<string, unknown>> {
  // Would call AI model here
  return {
    executed: true,
    agentId: agent.id,
    taskType: task.type,
    action: task.action,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Get agent performance summary
 */
export async function getAgentPerformance(agentId: string): Promise<{
  metrics: AIAgent['metrics'];
  recentActivity: number;
  approvalRate: number;
  status: string;
} | null> {
  const agent = await getAgent(agentId);
  
  if (!agent) return null;

  const pending = await getPendingApprovals({ agentId });
  const history = await getApprovalHistory(agent.ownerId, { limit: 100 });

  const totalApprovals = history.filter(h => h.agentId === agentId).length;
  const approved = history.filter(h => h.agentId === agentId && h.status === 'approved').length;

  return {
    metrics: agent.metrics,
    recentActivity: agent.metrics.totalTasks,
    approvalRate: totalApprovals > 0 ? approved / totalApprovals : 0,
    status: agent.status,
  };
}

/**
 * Reassign agent role
 */
export async function reassignAgentRole(
  agentId: string,
  newRole: AgentRole
): Promise<AIAgent | null> {
  return updateAgent(agentId, { 
    // Would need to update config and permissions from new template
  });
}

/**
 * Pause agent
 */
export async function pauseAgent(agentId: string): Promise<AIAgent | null> {
  return updateAgent(agentId, { status: 'inactive' });
}

/**
 * Resume agent
 */
export async function resumeAgent(agentId: string): Promise<AIAgent | null> {
  return updateAgent(agentId, { status: 'active' });
}

/**
 * Train agent with new knowledge
 */
export async function trainAgent(
  agentId: string,
  knowledge: {
    content: string;
    source?: string;
    metadata?: Record<string, unknown>;
  }[]
): Promise<number> {
  const { addAgentKnowledge } = await import('./agent-manager');
  
  let added = 0;
  for (const k of knowledge) {
    await addAgentKnowledge(agentId, k.content, 'manual', k.metadata);
    added++;
  }

  // Update agent status to training
  await updateAgent(agentId, { status: 'training' });

  return added;
}

/**
 * Get agent availability
 */
export async function getAgentAvailability(agentId: string): Promise<{
  isAvailable: boolean;
  currentLoad: number;
  maxLoad: number;
  waitingTasks: number;
}> {
  const agent = await getAgent(agentId);
  
  if (!agent) {
    return { isAvailable: false, currentLoad: 0, maxLoad: 0, waitingTasks: 0 };
  }

  const pending = await getPendingApprovals({ agentId });

  return {
    isAvailable: agent.status === 'active',
    currentLoad: agent.metrics.activeHours,
    maxLoad: agent.permissions.maxRecordsPerAction,
    waitingTasks: pending.length,
  };
}
