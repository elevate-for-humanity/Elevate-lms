import type { SupabaseClient } from '@supabase/supabase-js';
import { approvalReason, detectRiskTags, requiresApproval } from './risk';
import { newTraceId, writeDevAuditLog } from './audit';
import type { CreateTaskInput, TaskPlanStep } from './types';

function buildPlan(command: string): TaskPlanStep[] {
  return [
    { name: 'Analyze request', action_type: 'analyze', input_json: { command } },
    { name: 'Prepare changes', action_type: 'prepare', input_json: { command } },
    { name: 'Validate', action_type: 'validate', input_json: { command } },
    { name: 'Record outcome', action_type: 'record', input_json: { command } },
  ];
}

async function appendTaskLog(
  db: SupabaseClient,
  taskId: string,
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
  stepId?: string,
) {
  await db.from('ai_task_logs').insert({
    task_id: taskId,
    step_id: stepId ?? null,
    level,
    message,
    metadata: {},
  });
}

async function setAgentStatus(
  db: SupabaseClient,
  agentId: string | null,
  status: 'idle' | 'busy' | 'offline' | 'error',
) {
  if (!agentId) return;
  await db
    .from('ai_agents')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', agentId);
}

export async function createAiTask(db: SupabaseClient, input: CreateTaskInput) {
  const command = `${input.title} ${input.description ?? ''} ${input.command ?? ''}`.trim();
  const riskTags = detectRiskTags(command);
  const needsApproval = requiresApproval(command);
  const traceId = input.traceId ?? newTraceId();

  let agentId: string | null = null;
  if (input.agentSlug) {
    const { data: agent } = await db
      .from('ai_agents')
      .select('id')
      .eq('slug', input.agentSlug)
      .maybeSingle();
    agentId = agent?.id ?? null;
  }
  if (!agentId) {
    const { data: fallback } = await db
      .from('ai_agents')
      .select('id')
      .eq('slug', 'ai-developer')
      .maybeSingle();
    agentId = fallback?.id ?? null;
  }

  const plan = buildPlan(command);
  const { data: task, error } = await db
    .from('ai_tasks')
    .insert({
      title: input.title,
      description: input.description ?? null,
      status: needsApproval ? 'awaiting_approval' : 'planning',
      priority: input.priority ?? 0,
      agent_id: agentId,
      requested_by: input.requestedBy,
      trace_id: traceId,
      plan_json: { steps: plan },
      requires_approval: needsApproval,
      approval_reason: needsApproval ? approvalReason(riskTags) : null,
      risk_tags: riskTags,
      started_at: new Date().toISOString(),
    })
    .select('*')
    .single();

  if (error || !task) {
    throw new Error(error?.message ?? 'Failed to create task');
  }

  const stepRows = plan.map((step, index) => ({
    task_id: task.id,
    step_order: index,
    name: step.name,
    action_type: step.action_type,
    status: needsApproval ? 'awaiting_approval' : 'pending',
    input_json: step.input_json ?? {},
  }));

  await db.from('ai_task_steps').insert(stepRows);

  if (needsApproval) {
    await db.from('ai_approvals').insert({
      task_id: task.id,
      status: 'pending',
      requested_by: input.requestedBy,
      reason: approvalReason(riskTags),
      risk_tags: riskTags,
    });
    await appendTaskLog(
      db,
      task.id,
      `Task paused — approval required (${riskTags.join(', ')})`,
      'warn',
    );
  } else {
    await runTaskExecution(db, task.id, input.requestedBy);
  }

  await setAgentStatus(db, agentId, needsApproval ? 'idle' : 'busy');

  await writeDevAuditLog(db, {
    actorId: input.requestedBy,
    action: 'task.create',
    resourceType: 'ai_tasks',
    resourceId: task.id,
    traceId,
    metadata: { title: input.title, requires_approval: needsApproval, risk_tags: riskTags },
  });

  return task;
}

export async function runTaskExecution(
  db: SupabaseClient,
  taskId: string,
  actorId: string,
): Promise<void> {
  const { data: task } = await db.from('ai_tasks').select('*').eq('id', taskId).single();
  if (!task) throw new Error('Task not found');

  if (task.status === 'awaiting_approval') {
    throw new Error('Task is awaiting approval');
  }

  await db
    .from('ai_tasks')
    .update({ status: 'running', updated_at: new Date().toISOString() })
    .eq('id', taskId);

  const { data: steps } = await db
    .from('ai_task_steps')
    .select('*')
    .eq('task_id', taskId)
    .order('step_order', { ascending: true });

  for (const step of steps ?? []) {
    if (step.status === 'awaiting_approval') continue;

    await db
      .from('ai_task_steps')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', step.id);

    await appendTaskLog(db, taskId, `Running step: ${step.name}`, 'info', step.id);

    await db
      .from('ai_task_steps')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        output_json: { ok: true, simulated: true },
      })
      .eq('id', step.id);
  }

  await db.from('ai_memory').upsert(
    {
      scope: 'task',
      task_id: taskId,
      agent_id: task.agent_id,
      key: `task:${taskId}:summary`,
      content: `Completed task "${task.title}" at ${new Date().toISOString()}`,
      metadata: { trace_id: task.trace_id },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'scope,key,agent_id', ignoreDuplicates: false },
  );

  await db
    .from('ai_tasks')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      result_json: { ok: true },
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  await setAgentStatus(db, task.agent_id, 'idle');
  await appendTaskLog(db, taskId, 'Task completed successfully', 'info');

  await writeDevAuditLog(db, {
    actorId,
    action: 'task.complete',
    resourceType: 'ai_tasks',
    resourceId: taskId,
    traceId: task.trace_id,
  });
}

export async function approveTask(
  db: SupabaseClient,
  taskId: string,
  reviewerId: string,
): Promise<void> {
  const { data: task } = await db.from('ai_tasks').select('*').eq('id', taskId).single();
  if (!task) throw new Error('Task not found');

  await db
    .from('ai_approvals')
    .update({
      status: 'approved',
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq('task_id', taskId)
    .eq('status', 'pending');

  await db
    .from('ai_task_steps')
    .update({ status: 'pending' })
    .eq('task_id', taskId)
    .eq('status', 'awaiting_approval');

  await db
    .from('ai_tasks')
    .update({
      status: 'planning',
      requires_approval: false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  await writeDevAuditLog(db, {
    actorId: reviewerId,
    action: 'task.approve',
    resourceType: 'ai_tasks',
    resourceId: taskId,
    traceId: task.trace_id,
  });

  await runTaskExecution(db, taskId, reviewerId);
}

export async function rollbackTask(
  db: SupabaseClient,
  taskId: string,
  actorId: string,
): Promise<void> {
  const { data: task } = await db.from('ai_tasks').select('*').eq('id', taskId).single();
  if (!task) throw new Error('Task not found');

  const { data: snapshots } = await db
    .from('ai_file_snapshots')
    .select('id, repo_path, snapshot_type')
    .eq('task_id', taskId)
    .eq('snapshot_type', 'before');

  await db
    .from('ai_tasks')
    .update({
      status: 'rolled_back',
      completed_at: new Date().toISOString(),
      result_json: { rolled_back: true, snapshots: snapshots?.length ?? 0 },
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);

  await setAgentStatus(db, task.agent_id, 'idle');
  await appendTaskLog(
    db,
    taskId,
    `Task rolled back (${snapshots?.length ?? 0} snapshots referenced)`,
    'warn',
  );

  await writeDevAuditLog(db, {
    actorId,
    action: 'task.rollback',
    resourceType: 'ai_tasks',
    resourceId: taskId,
    traceId: task.trace_id,
  });
}
