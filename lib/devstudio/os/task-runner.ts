import type { SupabaseClient } from '@supabase/supabase-js';
import { approvalReason, detectRiskTags, requiresApproval } from './risk';
import { newTraceId, writeDevAuditLog } from './audit';
import type { CreateTaskInput, TaskPlanStep } from './types';
import { executeAICommand } from '@/lib/ai/runtime/command-executor';
import { getAITool, type AIAgentId } from '@/lib/ai/tools/registry';
import { planAIToolFromCommand } from '@/lib/ai/tools/planner';

export type TaskExecutionRuntimeContext = {
  actorRoles: readonly string[];
  tenantId?: string | null;
  requestHeaders?: Headers | Record<string, string | null | undefined>;
  adminOrigin?: string;
  appOrigin?: string;
  approvalGranted?: boolean;
};

function buildPlan(command: string): TaskPlanStep[] {
  return [
    { name: 'Resolve command', action_type: 'resolve', input_json: { command } },
    { name: 'Execute authorized action', action_type: 'execute', input_json: { command } },
    { name: 'Record verified outcome', action_type: 'record', input_json: { command } },
  ];
}

function normalizePriority(value?: number): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 'medium';
  if (value >= 75 || value >= 4) return 'critical';
  if (value >= 50 || value === 3) return 'high';
  if (value >= 25 || value === 2) return 'medium';
  return 'low';
}

function runtimeAgentForDevAgent(slug?: string | null, role?: string | null): AIAgentId {
  const haystack = `${slug ?? ''} ${role ?? ''}`.toLowerCase();
  if (haystack.includes('paris') || haystack.includes('public_guide')) return 'PARIS';
  if (haystack.includes('ellie') || haystack.includes('curriculum')) return 'ELLIE';
  if (haystack.includes('lizzy') || haystack.includes('platform_operations')) return 'LIZZY';
  if (haystack.includes('compliance') || haystack.includes('qa')) return 'ZORA';
  return 'LIZZY';
}

function commandFromTask(task: Record<string, any>): string {
  if (typeof task.command === 'string' && task.command.trim()) return task.command.trim();
  const steps = task.plan_json?.steps;
  const fromPlan = Array.isArray(steps)
    ? steps.find((step: any) => typeof step?.input_json?.command === 'string')?.input_json?.command
    : null;
  if (typeof fromPlan === 'string' && fromPlan.trim()) return fromPlan.trim();
  return `${task.title ?? ''} ${task.description ?? ''}`.trim();
}

async function appendTaskLog(
  db: SupabaseClient,
  taskId: string,
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
  stepId?: string,
  tenantId?: string | null,
  userId?: string | null,
) {
  await db.from('ai_task_logs').insert({
    task_id: taskId,
    level,
    message,
    metadata: stepId ? { step_id: stepId } : {},
    tenant_id: tenantId ?? null,
    user_id: userId ?? null,
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

async function createPendingApproval(
  db: SupabaseClient,
  taskId: string,
  requestedBy: string,
  reason: string,
  riskTags: string[],
  tenantId?: string | null,
) {
  const { data: existing } = await db
    .from('ai_approvals')
    .select('id')
    .eq('task_id', taskId)
    .eq('status', 'pending')
    .maybeSingle();
  if (existing?.id) return;
  await db.from('ai_approvals').insert({
    task_id: taskId,
    status: 'pending',
    requested_by: requestedBy,
    reason,
    risk_tags: riskTags,
    tenant_id: tenantId ?? null,
  });
}

export async function createAiTask(
  db: SupabaseClient,
  input: CreateTaskInput,
  runtime: TaskExecutionRuntimeContext = { actorRoles: [] },
) {
  const command = `${input.title} ${input.description ?? ''} ${input.command ?? ''}`.trim();
  const plannedTool = planAIToolFromCommand(command);
  const tool = plannedTool ? getAITool(plannedTool.name) : null;
  const riskTags = Array.from(
    new Set([...detectRiskTags(command), ...(tool?.approvalRequired ? [`tool:${tool.name}`] : [])]),
  );
  const needsApproval = requiresApproval(command) || Boolean(tool?.approvalRequired);
  const traceId = input.traceId ?? newTraceId();

  let agent: {
    id: string;
    slug?: string | null;
    name?: string | null;
    role?: string | null;
  } | null = null;
  if (input.agentSlug) {
    const { data } = await db
      .from('ai_agents')
      .select('id, slug, name, role')
      .eq('slug', input.agentSlug)
      .maybeSingle();
    agent = data ?? null;
  }
  if (!agent) {
    const { data } = await db
      .from('ai_agents')
      .select('id, slug, name, role')
      .eq('slug', 'ai-developer')
      .maybeSingle();
    agent = data ?? null;
  }

  const runtimeAgent = runtimeAgentForDevAgent(agent?.slug, agent?.role);
  const plan = buildPlan(command);
  const { data: task, error } = await db
    .from('ai_tasks')
    .insert({
      title: input.title,
      description: input.description ?? null,
      command,
      status: needsApproval ? 'awaiting_approval' : 'planning',
      priority: normalizePriority(input.priority),
      agent_id: agent?.id ?? null,
      agent_type: runtimeAgent,
      requested_by: input.requestedBy,
      created_by: input.requestedBy,
      user_id: input.requestedBy,
      tenant_id: runtime.tenantId ?? null,
      trace_id: traceId,
      correlation_id: traceId,
      plan: plan,
      plan_json: { steps: plan },
      requires_approval: needsApproval,
      approval_status: needsApproval ? 'pending' : 'not_required',
      approval_reason: needsApproval
        ? approvalReason(riskTags) || `Human approval required for ${tool?.name ?? 'this action'}.`
        : null,
      risk_tags: riskTags,
      tool_name: plannedTool?.name ?? null,
      tool_input: plannedTool?.input ?? null,
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
    action: step.action_type,
    name: step.name,
    action_type: step.action_type,
    status: needsApproval ? 'awaiting_approval' : 'pending',
    input_json: step.input_json ?? {},
    tenant_id: runtime.tenantId ?? null,
    user_id: input.requestedBy,
  }));

  const { error: stepError } = await db.from('ai_task_steps').insert(stepRows);
  if (stepError) {
    await db
      .from('ai_tasks')
      .update({ status: 'failed', error_message: stepError.message })
      .eq('id', task.id);
    throw new Error(stepError.message);
  }

  if (needsApproval) {
    await createPendingApproval(
      db,
      task.id,
      input.requestedBy,
      approvalReason(riskTags) || `Human approval required for ${tool?.name ?? 'this action'}.`,
      riskTags,
      runtime.tenantId,
    );
    await appendTaskLog(
      db,
      task.id,
      `Task paused — approval required (${riskTags.join(', ') || tool?.name || 'protected action'})`,
      'warn',
      undefined,
      runtime.tenantId,
      input.requestedBy,
    );
  } else {
    await runTaskExecution(db, task.id, input.requestedBy, runtime);
  }

  await writeDevAuditLog(db, {
    actorId: input.requestedBy,
    action: 'task.create',
    resourceType: 'ai_tasks',
    resourceId: task.id,
    traceId,
    metadata: {
      title: input.title,
      requires_approval: needsApproval,
      risk_tags: riskTags,
      planned_tool: plannedTool?.name ?? null,
    },
  });

  return task;
}

export async function runTaskExecution(
  db: SupabaseClient,
  taskId: string,
  actorId: string,
  runtime: TaskExecutionRuntimeContext = { actorRoles: [] },
): Promise<void> {
  const { data: task } = await db.from('ai_tasks').select('*').eq('id', taskId).single();
  if (!task) throw new Error('Task not found');

  if (task.status === 'awaiting_approval') {
    throw new Error('Task is awaiting approval');
  }

  const { data: agentRecord } = task.agent_id
    ? await db
        .from('ai_agents')
        .select('id, slug, name, role')
        .eq('id', task.agent_id)
        .maybeSingle()
    : { data: null };
  const runtimeAgent =
    (task.agent_type as AIAgentId | null) ??
    runtimeAgentForDevAgent(agentRecord?.slug, agentRecord?.role);
  const command = commandFromTask(task as Record<string, any>);
  const adminOrigin =
    runtime.adminOrigin ??
    process.env.NEXT_PUBLIC_ADMIN_URL ??
    'https://admin.elevateforhumanity.org';
  const appOrigin = runtime.appOrigin ?? process.env.NEXT_PUBLIC_APP_URL ?? adminOrigin;

  await setAgentStatus(db, task.agent_id, 'busy');
  await db
    .from('ai_tasks')
    .update({
      status: 'running',
      updated_at: new Date().toISOString(),
      attempts: Number(task.attempts ?? 0) + 1,
    })
    .eq('id', taskId);

  const { data: steps } = await db
    .from('ai_task_steps')
    .select('*')
    .eq('task_id', taskId)
    .order('step_order', { ascending: true });

  const resolveStep = (steps ?? []).find(
    (step: any) => step.action_type === 'resolve' || step.action === 'resolve',
  );
  const executeStep = (steps ?? []).find(
    (step: any) => step.action_type === 'execute' || step.action === 'execute',
  );
  const recordStep = (steps ?? []).find(
    (step: any) => step.action_type === 'record' || step.action === 'record',
  );

  const plannedTool = planAIToolFromCommand(command, {
    toolName: task.tool_name ?? undefined,
    toolInput: task.tool_input ?? undefined,
  });

  if (resolveStep) {
    await db
      .from('ai_task_steps')
      .update({
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        output: plannedTool
          ? `Resolved registered tool ${plannedTool.name}`
          : 'Resolved advisory AI task',
        output_json: plannedTool
          ? { tool: plannedTool.name, input: plannedTool.input }
          : { mode: 'advisory' },
      })
      .eq('id', resolveStep.id);
    await appendTaskLog(
      db,
      taskId,
      plannedTool
        ? `Resolved registered tool: ${plannedTool.name}`
        : 'No registered operational tool matched; using advisory AI runtime.',
      'info',
      resolveStep.id,
      runtime.tenantId ?? task.tenant_id,
      actorId,
    );
  }

  if (executeStep) {
    await db
      .from('ai_task_steps')
      .update({ status: 'running', started_at: new Date().toISOString() })
      .eq('id', executeStep.id);
    await appendTaskLog(
      db,
      taskId,
      'Executing through canonical AI runtime',
      'info',
      executeStep.id,
      runtime.tenantId ?? task.tenant_id,
      actorId,
    );
  }

  try {
    const result = await executeAICommand(command, {
      agent: runtimeAgent,
      agentLabel: agentRecord?.name ?? runtimeAgent,
      agentRole: agentRecord?.role ?? 'Dev Studio operator',
      actorId,
      actorRoles: runtime.actorRoles,
      tenantId: runtime.tenantId ?? task.tenant_id ?? null,
      correlationId: task.trace_id ?? task.correlation_id ?? taskId,
      requestHeaders: runtime.requestHeaders,
      adminOrigin,
      appOrigin,
      idempotencyKey: `devstudio:${taskId}:${plannedTool?.name ?? 'advisory'}`,
      approvalGranted: runtime.approvalGranted === true,
      commandContext: {
        toolName: task.tool_name ?? undefined,
        toolInput: task.tool_input ?? undefined,
      },
    });

    if (result.status === 'approval_required') {
      const riskTags = Array.from(
        new Set([...(task.risk_tags ?? []), `tool:${result.tool ?? 'protected'}`]),
      );
      if (executeStep) {
        await db
          .from('ai_task_steps')
          .update({
            status: 'awaiting_approval',
            output: result.message,
            output_json: {
              ok: false,
              status: result.status,
              tool: result.tool,
              required_confirmation: result.requiredConfirmation,
            },
          })
          .eq('id', executeStep.id);
      }
      await db
        .from('ai_tasks')
        .update({
          status: 'awaiting_approval',
          requires_approval: true,
          approval_status: 'pending',
          approval_reason: result.requiredConfirmation
            ? `Human approval required. Protected confirmation: ${result.requiredConfirmation}`
            : result.message,
          risk_tags: riskTags,
          tool_name: result.tool ?? task.tool_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      await createPendingApproval(
        db,
        taskId,
        actorId,
        result.requiredConfirmation
          ? `Human approval required for ${result.tool}.`
          : result.message,
        riskTags,
        runtime.tenantId ?? task.tenant_id,
      );
      await setAgentStatus(db, task.agent_id, 'idle');
      await appendTaskLog(
        db,
        taskId,
        `Execution paused for human approval: ${result.tool ?? 'protected action'}`,
        'warn',
        executeStep?.id,
        runtime.tenantId ?? task.tenant_id,
        actorId,
      );
      return;
    }

    if (!result.ok) {
      if (executeStep) {
        await db
          .from('ai_task_steps')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
            error_message: result.message,
            output: result.message,
            output_json: {
              ok: false,
              status: result.status,
              tool: result.tool ?? null,
              payload: result.payload ?? null,
            },
          })
          .eq('id', executeStep.id);
      }
      if (recordStep)
        await db.from('ai_task_steps').update({ status: 'skipped' }).eq('id', recordStep.id);
      await db
        .from('ai_tasks')
        .update({
          status: 'failed',
          error_message: result.message,
          result_json: {
            ok: false,
            executed: result.executed,
            status: result.status,
            tool: result.tool ?? null,
            trace_id: result.traceId ?? null,
          },
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      await setAgentStatus(db, task.agent_id, 'error');
      await appendTaskLog(
        db,
        taskId,
        `Task failed: ${result.message}`,
        'error',
        executeStep?.id,
        runtime.tenantId ?? task.tenant_id,
        actorId,
      );
      return;
    }

    if (result.status === 'running') {
      if (executeStep) {
        await db
          .from('ai_task_steps')
          .update({
            status: 'running',
            output: result.message,
            output_json: {
              ok: true,
              executed: result.executed,
              status: result.status,
              tool: result.tool ?? null,
              payload: result.payload ?? null,
              trace_id: result.traceId ?? null,
            },
          })
          .eq('id', executeStep.id);
      }
      await db
        .from('ai_tasks')
        .update({
          status: 'running',
          result_json: {
            ok: true,
            executed: result.executed,
            status: 'running',
            message: result.message,
            tool: result.tool ?? null,
            payload: result.payload ?? null,
            trace_id: result.traceId ?? null,
          },
          tool_output: result.payload ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);
      await setAgentStatus(db, task.agent_id, 'idle');
      await appendTaskLog(
        db,
        taskId,
        'External tool accepted the task; canonical task remains running until status verification completes.',
        'info',
        executeStep?.id,
        runtime.tenantId ?? task.tenant_id,
        actorId,
      );
      return;
    }

    if (executeStep) {
      await db
        .from('ai_task_steps')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          output: result.message,
          output_json: {
            ok: true,
            executed: result.executed,
            status: result.status,
            tool: result.tool ?? null,
            provider: result.provider ?? null,
            payload: result.payload ?? null,
            trace_id: result.traceId ?? null,
          },
        })
        .eq('id', executeStep.id);
    }

    if (recordStep) {
      await db
        .from('ai_task_steps')
        .update({
          status: 'completed',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          output: 'Verified task outcome persisted',
          output_json: { persisted: true, executed: result.executed, tool: result.tool ?? null },
        })
        .eq('id', recordStep.id);
    }

    const summary =
      `${result.executed ? 'Executed' : 'Completed advisory task'} "${task.title}" at ${new Date().toISOString()}. ${result.message}`.slice(
        0,
        12_000,
      );
    await db.from('ai_memory').insert({
      scope: 'task',
      task_id: taskId,
      agent_id: task.agent_id,
      category: 'task_result',
      key: `task:${taskId}:summary`,
      value: summary,
      content: summary,
      metadata: {
        trace_id: task.trace_id,
        tool: result.tool ?? null,
        executed: result.executed,
      },
      tenant_id: runtime.tenantId ?? task.tenant_id ?? null,
      user_id: actorId,
      updated_at: new Date().toISOString(),
    });

    await db
      .from('ai_tasks')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        result: {
          ok: true,
          executed: result.executed,
          message: result.message,
          tool: result.tool ?? null,
        },
        result_json: {
          ok: true,
          executed: result.executed,
          status: result.status,
          message: result.message,
          tool: result.tool ?? null,
          provider: result.provider ?? null,
          trace_id: result.traceId ?? null,
        },
        tool_output: result.payload ?? null,
        approval_status: runtime.approvalGranted ? 'approved' : task.approval_status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    await setAgentStatus(db, task.agent_id, 'idle');
    await appendTaskLog(
      db,
      taskId,
      'Task completed through canonical AI runtime',
      'info',
      undefined,
      runtime.tenantId ?? task.tenant_id,
      actorId,
    );

    await writeDevAuditLog(db, {
      actorId,
      action: 'task.complete',
      resourceType: 'ai_tasks',
      resourceId: taskId,
      traceId: task.trace_id,
      metadata: {
        executed: result.executed,
        tool: result.tool ?? null,
        provider: result.provider ?? null,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (executeStep) {
      await db
        .from('ai_task_steps')
        .update({
          status: 'failed',
          completed_at: new Date().toISOString(),
          error_message: message,
          output: message,
        })
        .eq('id', executeStep.id);
    }
    await db
      .from('ai_tasks')
      .update({
        status: 'failed',
        error_message: message,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);
    await setAgentStatus(db, task.agent_id, 'error');
    await appendTaskLog(
      db,
      taskId,
      `Task execution error: ${message}`,
      'error',
      executeStep?.id,
      runtime.tenantId ?? task.tenant_id,
      actorId,
    );
    throw error;
  }
}

export async function approveTask(
  db: SupabaseClient,
  taskId: string,
  reviewerId: string,
  runtime: TaskExecutionRuntimeContext = { actorRoles: [] },
): Promise<void> {
  const { data: task } = await db.from('ai_tasks').select('*').eq('id', taskId).single();
  if (!task) throw new Error('Task not found');

  await db
    .from('ai_approvals')
    .update({
      status: 'approved',
      approved_by: reviewerId,
      decided_at: new Date().toISOString(),
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
      approval_status: 'approved',
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

  await runTaskExecution(db, taskId, reviewerId, { ...runtime, approvalGranted: true });
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
    `Task marked rolled back (${snapshots?.length ?? 0} snapshots referenced)`,
    'warn',
    undefined,
    task.tenant_id,
    actorId,
  );

  await writeDevAuditLog(db, {
    actorId,
    action: 'task.rollback',
    resourceType: 'ai_tasks',
    resourceId: taskId,
    traceId: task.trace_id,
  });
}
