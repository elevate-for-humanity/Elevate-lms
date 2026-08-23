import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { evaluateExecution } from '@/lib/platform/orchestration/evaluator';
import {
  getOpenHandsLifecycle,
  startOpenHandsTask,
  type OpenHandsLifecycle,
  type OpenHandsStartTask,
} from './client';

export type OpenHandsDispatchInput = {
  actorId: string;
  task: string;
  repository?: string | null;
  correlationId?: string | null;
  tenantId?: string | null;
};

export type OpenHandsDispatchResult = {
  taskId: string;
  startTaskId: string;
  conversationId?: string | null;
  status: 'queued' | 'running';
};

async function appendLog(
  taskId: string,
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
  tenantId?: string | null,
  actorId?: string | null,
) {
  const db = await requireAdminClient();
  await db.from('ai_task_logs').insert({
    task_id: taskId,
    level,
    message,
    metadata: { provider: 'openhands' },
    tenant_id: tenantId ?? null,
    user_id: actorId ?? null,
  });
}

async function findDeveloperAgentId(): Promise<string | null> {
  const db = await requireAdminClient();
  const { data } = await db
    .from('ai_agents')
    .select('id')
    .eq('slug', 'ai-developer')
    .maybeSingle();
  return data?.id ?? null;
}

async function findExistingTask(correlationId?: string | null) {
  if (!correlationId) return null;
  const db = await requireAdminClient();
  const { data } = await db
    .from('ai_tasks')
    .select('*')
    .eq('correlation_id', correlationId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? null;
}

async function attachStartTask(
  taskId: string,
  start: OpenHandsStartTask,
  tenantId?: string | null,
  actorId?: string | null,
) {
  const db = await requireAdminClient();
  const external = {
    provider: 'openhands',
    start_task_id: start.id,
    conversation_id: start.app_conversation_id ?? null,
    sandbox_id: start.sandbox_id ?? null,
    start_status: start.status,
  };
  await db
    .from('ai_tasks')
    .update({
      status: 'running',
      tool_name: 'openhands.execute',
      tool_output: external,
      result_json: { ok: true, status: 'running', external_run: external },
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', taskId);
  await appendLog(
    taskId,
    `OpenHands accepted engineering work (start task ${start.id}).`,
    'info',
    tenantId,
    actorId,
  );
}

export async function dispatchOpenHandsTask(
  input: OpenHandsDispatchInput,
): Promise<OpenHandsDispatchResult> {
  const db = await requireAdminClient();
  const existing = await findExistingTask(input.correlationId);
  let taskId = existing?.id as string | undefined;

  if (!taskId) {
    const agentId = await findDeveloperAgentId();
    const plan = [
      {
        name: 'Dispatch OpenHands engineering agent',
        action_type: 'execute',
        input_json: { provider: 'openhands' },
      },
      {
        name: 'Verify OpenHands outcome',
        action_type: 'record',
        input_json: { provider: 'openhands' },
      },
    ];
    const now = new Date().toISOString();
    const { data: created, error } = await db
      .from('ai_tasks')
      .insert({
        title: 'OpenHands engineering task',
        description: input.task,
        command: input.task,
        status: 'running',
        priority: 'medium',
        requires_approval: false,
        approval_status: 'not_required',
        plan,
        plan_json: { steps: plan },
        requested_by: input.actorId,
        created_by: input.actorId,
        user_id: input.actorId,
        tenant_id: input.tenantId ?? null,
        agent_id: agentId,
        agent_type: 'LIZZY',
        intent: 'engineering',
        trace_id: input.correlationId ?? null,
        correlation_id: input.correlationId ?? null,
        tool_name: 'openhands.execute',
        tool_input: { task: input.task, repository: input.repository ?? null },
        attempts: 1,
        max_attempts: 1,
        timeout_ms: 3_600_000,
        started_at: now,
        updated_at: now,
      })
      .select('id')
      .single();
    if (error || !created?.id) throw new Error(error?.message ?? 'Unable to create canonical OpenHands task');
    taskId = created.id;

    await db.from('ai_task_steps').insert(
      plan.map((step, index) => ({
        task_id: taskId,
        step_order: index,
        action: step.action_type,
        name: step.name,
        action_type: step.action_type,
        status: index === 0 ? 'running' : 'pending',
        input_json: step.input_json,
        tenant_id: input.tenantId ?? null,
        user_id: input.actorId,
        started_at: index === 0 ? now : null,
      })),
    );
  }

  const start = await startOpenHandsTask({
    message: input.task,
    repository: input.repository,
    traceId: input.correlationId,
    taskId,
    tags: ['engineering'],
  });
  await attachStartTask(taskId, start, input.tenantId, input.actorId);

  return {
    taskId,
    startTaskId: start.id,
    conversationId: start.app_conversation_id ?? null,
    status: String(start.status).toUpperCase() === 'READY' ? 'running' : 'queued',
  };
}

function terminalTaskStatus(lifecycle: OpenHandsLifecycle): 'completed' | 'failed' | 'awaiting_approval' | 'running' {
  if (lifecycle.status === 'completed') return 'completed';
  if (lifecycle.status === 'failed') return 'failed';
  if (lifecycle.status === 'approval_required') return 'awaiting_approval';
  return 'running';
}

export async function refreshOpenHandsTask(input: {
  taskId: string;
  actorId?: string | null;
}): Promise<OpenHandsLifecycle> {
  const db = await requireAdminClient();
  const { data: task, error } = await db
    .from('ai_tasks')
    .select('*')
    .eq('id', input.taskId)
    .single();
  if (error || !task) throw new Error(error?.message ?? 'Canonical OpenHands task not found');

  const external = (task.tool_output && typeof task.tool_output === 'object'
    ? task.tool_output
    : {}) as Record<string, unknown>;
  const lifecycle = await getOpenHandsLifecycle({
    startTaskId: typeof external.start_task_id === 'string' ? external.start_task_id : null,
    conversationId: typeof external.conversation_id === 'string' ? external.conversation_id : null,
  });

  const status = terminalTaskStatus(lifecycle);
  const now = new Date().toISOString();
  const mergedExternal = {
    ...external,
    start_task_id: lifecycle.startTaskId ?? external.start_task_id ?? null,
    conversation_id: lifecycle.conversationId ?? external.conversation_id ?? null,
    sandbox_status: lifecycle.sandboxStatus ?? null,
    execution_status: lifecycle.executionStatus ?? null,
    repository: lifecycle.repository ?? null,
    branch: lifecycle.branch ?? null,
    pr_numbers: lifecycle.prNumbers ?? [],
  };

  const evaluation = evaluateExecution({
    tool: 'openhands.execute',
    result: lifecycle.status === 'completed' ? lifecycle.raw ?? lifecycle : null,
    error: lifecycle.status === 'failed' ? lifecycle.error || 'OpenHands execution failed' : null,
    attempts: Number(task.attempts ?? 1),
    maxAttempts: Number(task.max_attempts ?? 1),
    approvalRequired: lifecycle.status === 'approval_required',
    approvedBy: lifecycle.status === 'approval_required' ? null : input.actorId ?? null,
    expectedOutput: 'A completed OpenHands engineering run with independently verifiable repository evidence.',
    verificationRule: 'OpenHands completion is necessary but repository effects must still be verified before merge or deployment.',
  });

  await db
    .from('ai_tasks')
    .update({
      status,
      tool_output: mergedExternal,
      result_json: {
        ok: lifecycle.status === 'completed',
        status: lifecycle.status,
        provider: 'openhands',
        external_run: mergedExternal,
        evaluation,
      },
      result: lifecycle.status === 'completed' ? { provider: 'openhands', lifecycle, evaluation } : task.result,
      error_message: lifecycle.status === 'failed' ? lifecycle.error || 'OpenHands execution failed' : null,
      approval_status: lifecycle.status === 'approval_required' ? 'pending' : task.approval_status,
      completed_at: ['completed', 'failed'].includes(status) ? now : null,
      updated_at: now,
    })
    .eq('id', task.id);

  const { data: steps } = await db
    .from('ai_task_steps')
    .select('id, action_type, action')
    .eq('task_id', task.id)
    .order('step_order', { ascending: true });
  const executeStep = (steps ?? []).find((step: any) => step.action_type === 'execute' || step.action === 'execute');
  const verifyStep = (steps ?? []).find((step: any) => step.action_type === 'record' || step.action === 'record');

  if (executeStep) {
    await db
      .from('ai_task_steps')
      .update({
        status: status === 'completed' ? 'completed' : status === 'failed' ? 'failed' : status === 'awaiting_approval' ? 'awaiting_approval' : 'running',
        output: `OpenHands status: ${lifecycle.status}`,
        output_json: { lifecycle, evaluation },
        error_message: lifecycle.status === 'failed' ? lifecycle.error || 'OpenHands execution failed' : null,
        completed_at: ['completed', 'failed'].includes(status) ? now : null,
      })
      .eq('id', executeStep.id);
  }

  if (verifyStep) {
    await db
      .from('ai_task_steps')
      .update({
        status: evaluation.status === 'PASS' ? 'completed' : evaluation.status === 'REQUIRES_HUMAN_REVIEW' ? 'awaiting_approval' : status === 'failed' ? 'failed' : 'pending',
        output: evaluation.reasons.join(' '),
        output_json: evaluation,
        completed_at: evaluation.status === 'PASS' ? now : null,
      })
      .eq('id', verifyStep.id);
  }

  if (lifecycle.status === 'completed') {
    const summary = `OpenHands engineering run completed. Conversation: ${lifecycle.conversationId ?? 'unknown'}. Branch: ${lifecycle.branch ?? 'not reported'}. PRs: ${(lifecycle.prNumbers ?? []).join(', ') || 'not reported'}.`;
    await db.from('ai_memory').upsert(
      {
        scope: 'task',
        task_id: task.id,
        agent_id: task.agent_id ?? null,
        category: 'task_result',
        key: `task:${task.id}:openhands`,
        value: summary,
        content: summary,
        metadata: { provider: 'openhands', lifecycle, evaluation },
        tenant_id: task.tenant_id ?? null,
        user_id: input.actorId ?? task.user_id ?? null,
        updated_at: now,
      },
      { onConflict: 'key' },
    );
  }

  await appendLog(
    task.id,
    `OpenHands lifecycle refreshed: ${lifecycle.status}.`,
    lifecycle.status === 'failed' ? 'error' : lifecycle.status === 'approval_required' ? 'warn' : 'info',
    task.tenant_id,
    input.actorId ?? task.user_id,
  );

  return lifecycle;
}
