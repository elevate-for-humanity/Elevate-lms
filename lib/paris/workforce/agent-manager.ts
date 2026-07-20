/**
 * PARIS AI Workforce - Agent Manager
 * Core system for managing AI agents
 */

import { createClient } from '@supabase/supabase-js';
import {
  AIAgent,
  AgentRole,
  AgentConfig,
  AgentPermissions,
  AgentMetrics,
  AgentActivity,
  ApprovalWorkflow,
  AgentKnowledge,
  AgentMemory,
  AVAILABLE_TOOLS,
  AGENT_TEMPLATES,
} from './types';

// Supabase client for persistence
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * Create a new AI agent
 */
export async function createAgent(
  ownerId: string,
  role: AgentRole,
  customConfig?: Partial<AgentConfig>,
  customPermissions?: Partial<AgentPermissions>
): Promise<AIAgent | null> {
  const template = AGENT_TEMPLATES[role];
  
  if (!template.config || !template.permissions) {
    throw new Error(`No template found for role: ${role}`);
  }

  const agent: AIAgent = {
    id: `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name: customConfig?.systemPrompt ? extractNameFromPrompt(customConfig.systemPrompt) : template.name!,
    role,
    status: 'training',
    config: {
      ...template.config,
      ...customConfig,
    },
    permissions: {
      ...template.permissions,
      ...customPermissions,
    },
    tools: template.config?.tools.map(toolId => 
      AVAILABLE_TOOLS.find(t => t.id === toolId)!
    ).filter(Boolean) || [],
    metrics: {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      averageResponseTime: 0,
      averageResolutionTime: 0,
      escalationRate: 0,
      firstContactResolution: 0,
      activeHours: 0,
      tasksByCategory: {},
      recentErrors: [],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ownerId,
    isClone: false,
  };

  // Save to database
  const { data, error } = await supabase
    .from('ai_agents')
    .insert({
      id: agent.id,
      name: agent.name,
      role: agent.role,
      status: agent.status,
      config: agent.config,
      permissions: agent.permissions,
      tools: agent.tools.map(t => t.id),
      metrics: agent.metrics,
      owner_id: agent.ownerId,
      is_clone: false,
      created_at: agent.createdAt,
      updated_at: agent.updatedAt,
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create agent:', error);
    return null;
  }

  return agent;
}

/**
 * Get agent by ID
 */
export async function getAgent(agentId: string): Promise<AIAgent | null> {
  const { data, error } = await supabase
    .from('ai_agents')
    .select('*')
    .eq('id', agentId)
    .single();

  if (error || !data) {
    return null;
  }

  return formatAgentFromDb(data);
}

/**
 * List agents for owner
 */
export async function listAgents(
  ownerId: string,
  options?: {
    role?: AgentRole;
    status?: AIAgent['status'];
    limit?: number;
  }
): Promise<AIAgent[]> {
  let query = supabase
    .from('ai_agents')
    .select('*')
    .eq('owner_id', ownerId);

  if (options?.role) {
    query = query.eq('role', options.role);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(formatAgentFromDb);
}

/**
 * Update agent configuration
 */
export async function updateAgent(
  agentId: string,
  updates: Partial<Pick<AIAgent, 'name' | 'status' | 'config' | 'permissions' | 'tools'>>
): Promise<AIAgent | null> {
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updates.name) updateData.name = updates.name;
  if (updates.status) updateData.status = updates.status;
  if (updates.config) updateData.config = updates.config;
  if (updates.permissions) updateData.permissions = updates.permissions;
  if (updates.tools) updateData.tools = updates.tools.map(t => typeof t === 'string' ? t : t.id);

  const { data, error } = await supabase
    .from('ai_agents')
    .update(updateData)
    .eq('id', agentId)
    .select()
    .single();

  if (error || !data) {
    return null;
  }

  return formatAgentFromDb(data);
}

/**
 * Update agent metrics
 */
export async function updateAgentMetrics(
  agentId: string,
  metrics: Partial<AgentMetrics>
): Promise<void> {
  await supabase.rpc('update_agent_metrics', {
    p_agent_id: agentId,
    p_metrics: metrics,
  });
}

/**
 * Delete agent
 */
export async function deleteAgent(agentId: string): Promise<boolean> {
  const { error } = await supabase
    .from('ai_agents')
    .delete()
    .eq('id', agentId);

  if (error) {
    return false;
  }

  // Clean up related data
  await Promise.all([
    supabase.from('agent_activities').delete().eq('agent_id', agentId),
    supabase.from('agent_memories').delete().eq('agent_id', agentId),
    supabase.from('agent_knowledge').delete().eq('agent_id', agentId),
    supabase.from('approval_workflows').delete().eq('agent_id', agentId),
  ]);

  return true;
}

/**
 * Create agent clone
 */
export async function cloneAgent(
  originalAgentId: string,
  newOwnerId: string,
  name?: string
): Promise<AIAgent | null> {
  const original = await getAgent(originalAgentId);
  
  if (!original) {
    return null;
  }

  const cloned = await createAgent(
    newOwnerId,
    original.role,
    {
      ...original.config,
      systemPrompt: `${original.config.systemPrompt}\n\nNote: You are a clone of ${original.name}.`,
    },
    original.permissions
  );

  if (!cloned) {
    return null;
  }

  // Update clone metadata
  cloned.isClone = true;
  cloned.cloneOf = originalAgentId;
  cloned.name = name || `${original.name} (Clone)`;

  await supabase
    .from('ai_agents')
    .update({
      is_clone: true,
      clone_of: originalAgentId,
      name: cloned.name,
    })
    .eq('id', cloned.id);

  // Copy knowledge base
  const { data: knowledge } = await supabase
    .from('agent_knowledge')
    .select('*')
    .eq('agent_id', originalAgentId);

  if (knowledge && knowledge.length > 0) {
    await supabase.from('agent_knowledge').insert(
      knowledge.map(k => ({
        ...k,
        id: `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agent_id: cloned.id,
        created_at: new Date().toISOString(),
      }))
    );
  }

  return cloned;
}

/**
 * Log agent activity
 */
export async function logActivity(
  agentId: string,
  activity: Omit<AgentActivity, 'id' | 'agentId' | 'timestamp'>
): Promise<string> {
  const id = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await supabase.from('agent_activities').insert({
    id,
    agent_id: agentId,
    type: activity.type,
    action: activity.action,
    input: activity.input,
    output: activity.output,
    status: activity.status,
    duration: activity.duration,
    user_id: activity.userId,
    requires_approval: activity.requiresApproval,
    approved_by: activity.approvedBy,
    error: activity.error,
    timestamp: new Date().toISOString(),
  });

  return id;
}

/**
 * Get agent activity history
 */
export async function getAgentActivity(
  agentId: string,
  options?: {
    type?: AgentActivity['type'];
    limit?: number;
    since?: string;
  }
): Promise<AgentActivity[]> {
  let query = supabase
    .from('agent_activities')
    .select('*')
    .eq('agent_id', agentId);

  if (options?.type) {
    query = query.eq('type', options.type);
  }

  if (options?.since) {
    query = query.gte('timestamp', options.since);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query.order('timestamp', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    agentId: row.agent_id,
    type: row.type,
    action: row.action,
    input: row.input,
    output: row.output,
    status: row.status,
    duration: row.duration,
    timestamp: row.timestamp,
    userId: row.user_id,
    requiresApproval: row.requires_approval,
    approvedBy: row.approved_by,
    error: row.error,
  }));
}

/**
 * Add knowledge to agent
 */
export async function addAgentKnowledge(
  agentId: string,
  content: string,
  source: AgentKnowledge['source'] = 'manual',
  metadata?: Record<string, unknown>
): Promise<string> {
  const id = `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  await supabase.from('agent_knowledge').insert({
    id,
    agent_id: agentId,
    source,
    content,
    metadata,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    usage_count: 0,
    relevance: 0.5,
  });

  return id;
}

/**
 * Search agent knowledge
 */
export async function searchAgentKnowledge(
  agentId: string,
  query: string,
  limit: number = 10
): Promise<AgentKnowledge[]> {
  const { data, error } = await supabase
    .from('agent_knowledge')
    .select('*')
    .eq('agent_id', agentId)
    .or(`content.ilike.%${query}%,metadata->>'title'.ilike.%${query}%`)
    .order('relevance', { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  // Update usage count
  for (const row of data) {
    await supabase
      .from('agent_knowledge')
      .update({ 
        usage_count: row.usage_count + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq('id', row.id);
  }

  return data.map(row => ({
    id: row.id,
    agentId: row.agent_id,
    source: row.source,
    content: row.content,
    metadata: row.metadata,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    usageCount: row.usage_count,
    lastUsedAt: row.last_used_at,
    relevance: row.relevance,
  }));
}

/**
 * Add memory to agent
 */
export async function addAgentMemory(
  agentId: string,
  type: AgentMemory['type'],
  content: AgentMemory['content'],
  importance: number = 0.5
): Promise<string> {
  const id = `memory_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Calculate expiration for short-term memory
  const expiresAt = type === 'short_term' 
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
    : undefined;

  await supabase.from('agent_memories').insert({
    id,
    agent_id: agentId,
    type,
    content,
    importance,
    created_at: new Date().toISOString(),
    expires_at: expiresAt,
    access_count: 0,
  });

  return id;
}

/**
 * Get agent memories
 */
export async function getAgentMemories(
  agentId: string,
  type?: AgentMemory['type']
): Promise<AgentMemory[]> {
  let query = supabase
    .from('agent_memories')
    .select('*')
    .eq('agent_id', agentId)
    .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);

  if (type) {
    query = query.eq('type', type);
  }

  const { data, error } = await query.order('importance', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map(row => ({
    id: row.id,
    agentId: row.agent_id,
    type: row.type,
    content: row.content,
    importance: row.importance,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    accessCount: row.access_count,
  }));
}

// Helper function to format agent from database
function formatAgentFromDb(row: Record<string, unknown>): AIAgent {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as AgentRole,
    status: row.status as AIAgent['status'],
    config: row.config as AgentConfig,
    permissions: row.permissions as AgentPermissions,
    tools: (row.tools as string[]).map(toolId => 
      AVAILABLE_TOOLS.find(t => t.id === toolId)!
    ).filter(Boolean),
    metrics: row.metrics as AgentMetrics,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
    ownerId: row.owner_id as string,
    isClone: row.is_clone as boolean,
    cloneOf: row.clone_of as string | undefined,
  };
}

// Helper to extract name from system prompt
function extractNameFromPrompt(prompt: string): string {
  const match = prompt.match(/^You are (?:an? |the )?(.+?)(?: for|,|\.|of)/i);
  return match ? match[1].trim() : 'AI Assistant';
}
