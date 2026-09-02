import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { evaluateExecution, type EvaluationResult } from '@/lib/platform/orchestration/evaluator';
import {
  getOpenHandsLifecycle,
  startOpenHandsTask,
  type OpenHandsLifecycle,
  type OpenHandsStartTask,
} from './client';
import { verifyOpenHandsGitHubOutcome, type OpenHandsGitHubEvidence } from './github-verifier';

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
        input_json: { provider: 'openhands', verifier: 'github' },
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
        max_attempts: 3,
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

function lifecycleTaskStatus(lifecycle: OpenHandsLifecycle): 'failed' | 'awaiting_approval' | 'running' {
  if (lifecycle.status === 'failed') return 'failed';
  if (lifecycle.status === 'approval_required') return 'awaiting_approval';
  return 'running';
}

function failingChecks(evidence: OpenHandsGitHubEvidence): string[] {
  const failures = new Set<string>();
  for (const pr of evidence.pullRequests) {
    if (pr.combinedStatus === 'failure' || pr.combinedStatus === 'error') {
      failures.add(`PR #${pr.number} combined status is ${pr.combinedStatus}`);
    }
    for (const check of pr.checkRuns) {
      if (['failure', 'cancelled', 'timed_out', 'action_required'].includes(check.conclusion ?? '')) {
        failures.add(`PR #${pr.number} check ${check.name} concluded ${check.conclusion}`);
      }
    }
  }
  return [...failures];
}

function pendingChecks(evidence: OpenHandsGitHubEvidence): string[] {
  const pending = new Set<string>();
  for (const pr of evidence.pullRequests) {
    if (pr.combinedStatus === 'pending') pending.add(`PR #${pr.number} combined status is pending`);
    for (const check of pr.checkRuns) {
      if (check.status !== 'completed') pending.add(`PR #${pr.number} check ${check.name} is ${check.status}`);
    }
  }
  return [...pending];
}

function evaluateOpenHandsCompletion(
  lifecycle: OpenHandsLifecycle,
  github: OpenHandsGitHubEvidence | null,
  attempts: number,
  maxAttempts: number,
): EvaluationResult {
  if (lifecycle.status === 'approval_required') {
    return {
      status: 'REQUIRES_HUMAN_REVIEW',
      reasons: ['OpenHands is waiting for confirmation. Elevate retains approval authority.'],
      evidence: { provider: 'openhands', conversation_id: lifecycle.conversationId ?? null },
    };
  }

  if (lifecycle.status === 'failed') {
    const reason = lifecycle.error || 'OpenHands execution failed';
    return {
      status: attempts < maxAttempts ? 'FAIL_RETRYABLE' : 'FAIL_BLOCKING',
      reasons: [reason],
      evidence: { provider: 'openhands', attempts, max_attempts: maxAttempts, error: reason },
    };
  }

  if (lifecycle.status !== 'completed') {
    return {
      status: 'FAIL_RETRYABLE',
      reasons: ['OpenHands execution is still in progress.'],
      evidence: { provider: 'openhands', lifecycle_status: lifecycle.status },
    };
  }

  if (!github?.verified) {
    return {
      status: 'REQUIRES_HUMAN_REVIEW',
      reasons: [
        'OpenHands reports completion, but no branch or pull request was independently verified through GitHub.',
        ...(github?.reasons ?? []),
      ],
      evidence: { provider: 'openhands', github: github ?? null },
    };
  }

  const failed = failingChecks(github);
  if (failed.length) {
    return {
      status: attempts < maxAttempts ? 'FAIL_RETRYABLE' : 'FAIL_BLOCKING',
      reasons: failed,
      evidence: { provider: 'openhands', attempts, max_attempts: maxAttempts, github },
    };
  }

  const pending = pendingChecks(github);
  if (pending.length) {
    return {
      status: 'REQUIRES_HUMAN_REVIEW',
      reasons: ['GitHub evidence exists, but CI/check verification is not complete.', ...pending],
      evidence: { provider: 'openhands', github },
    };
  }

  return evaluateExecution({
    tool: 'openhands.execute',
    result: github,
    attempts,
    maxAttempts,
    expectedOutput: 'A completed OpenHands engineering run with independently verifiable repository evidence.',
    verificationRule: 'At least one reported branch or pull request must exist in GitHub and reported CI must not be failing.',
  });
}

async function retryOpenHandsTask(input: {
  task: Record<string, any>;
  reasons: string[];
  attempt: number;
}): Promise<void> {
  const db = await requireAdminClient();
  const taskInput = input.task.tool_input && typeof input.task.tool_input === 'object'
    ? input.task.tool_input as Record<string, unknown>
    : {};
  const previous = input.task.tool_output && typeof input.task.tool_output === 'object'
    ? input.task.tool_output as Record<string, unknown>
    : {};
  const originalTask = typeof taskInput.task === 'string'
    ? taskInput.task
    : String(input.task.command ?? input.task.description ?? input.task.title ?? 'Repair the verified engineering failure.');
  const repository = typeof taskInput.repository === 'string'
    ? taskInput.repository
    : typeof previous.repository === 'string'
      ? previous.repository
      : null;
  const attempt = input.attempt;
  const retryMessage = `${originalTask}\n\nPrevious verification failed. Repair the implementation and rerun the relevant checks. Do not merely explain the failure. Verified evidence:\n- ${input.reasons.join('\n- ')}`;
  const start = await startOpenHandsTask({
    message: retryMessage,
    repository,
    traceId: input.task.correlation_id ?? input.task.trace_id ?? null,
    taskId: input.task.id,
    tags: ['engineering', 'verification-repair', `attempt-${attempt}`],
  });

  await db
    .from('ai_tasks')
    .update({
      attempts: attempt,
      status: 'running',
      requires_approval: false,
      approval_status: 'approved',
      approval_reason: null,
      error_message: null,
      completed_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.task.id);
  await attachStartTask(
    input.task.id,
    start,
    input.task.tenant_id,
    input.task.user_id,
  );
  await appendLog(
    input.task.id,
    `Verification repair attempt ${attempt}/${Number(input.task.max_attempts ?? 3)} dispatched.`,
    'warn',
    input.task.tenant_id,
    input.task.user_id,
  );
}

export async function reconcileOpenHandsTasks(limit = 10): Promise<{
  checked: number;
  completed: number;
  running: number;
  retried: number;
  failed: number;
  errors: string[];
}> {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('ai_tasks')
    .select('*')
    .eq('tool_name', 'openhands.execute')
    .in('status', ['running', 'failed'])
    .order('updated_at', { ascending: true })
    .limit(Math.max(1, Math.min(limit, 50)));
  if (error) throw new Error(`Unable to load OpenHands reconciliation queue: ${error.message}`);

  const result = { checked: 0, completed: 0, running: 0, retried: 0, failed: 0, errors: [] as string[] };
  for (const candidate of data ?? []) {
    result.checked += 1;
    try {
      if (candidate.status === 'running') {
        await refreshOpenHandsTask({ taskId: candidate.id, actorId: candidate.user_id });
      }
      const { data: refreshed } = await db.from('ai_tasks').select('*').eq('id', candidate.id).single();
      if (!refreshed) continue;
      if (refreshed.status === 'completed') {
        result.completed += 1;
        continue;
      }
      if (refreshed.status === 'running') {
        result.running += 1;
        continue;
      }
      const evaluation = refreshed.result_json?.evaluation as EvaluationResult | undefined;
      const attempts = Number(refreshed.attempts ?? 1);
      const maxAttempts = Number(refreshed.max_attempts ?? 3);
      if (
        refreshed.status === 'failed' &&
        evaluation?.status === 'FAIL_RETRYABLE' &&
        attempts < maxAttempts
      ) {
        const nextAttempt = attempts + 1;
        const { data: claimed, error: claimError } = await db
          .from('ai_tasks')
          .update({
            status: 'planning',
            attempts: nextAttempt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', refreshed.id)
          .eq('status', 'failed')
          .eq('attempts', attempts)
          .select('id')
          .maybeSingle();
        if (claimError) throw claimError;
        if (claimed?.id) {
          await retryOpenHandsTask({
            task: { ...refreshed, attempts: nextAttempt },
            reasons: evaluation.reasons,
            attempt: nextAttempt,
          });
          result.retried += 1;
        }
      } else if (refreshed.status === 'failed') {
        result.failed += 1;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await db
        .from('ai_tasks')
        .update({
          status: 'failed',
          error_message: message,
          updated_at: new Date().toISOString(),
        })
        .eq('id', candidate.id)
        .eq('status', 'planning');
      result.errors.push(`${candidate.id}:${message}`);
    }
  }
  return result;
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

  let githubEvidence: OpenHandsGitHubEvidence | null = null;
  if (lifecycle.status === 'completed') {
    try {
      githubEvidence = await verifyOpenHandsGitHubOutcome({
        repository: lifecycle.repository,
        branch: lifecycle.branch,
        prNumbers: lifecycle.prNumbers,
      });
    } catch (verificationError) {
      githubEvidence = {
        verified: false,
        repository: lifecycle.repository || 'elevate-for-humanity/Elevate-lms',
        pullRequests: [],
        reasons: [verificationError instanceof Error ? verificationError.message : String(verificationError)],
      };
    }
  }

  const evaluation = evaluateOpenHandsCompletion(
    lifecycle,
    githubEvidence,
    Number(task.attempts ?? 1),
    Number(task.max_attempts ?? 1),
  );
  const now = new Date().toISOString();
  const verificationStillRunning =
    lifecycle.status === 'completed' &&
    githubEvidence !== null &&
    pendingChecks(githubEvidence).length > 0;
  const needsHumanApproval =
    evaluation.status === 'REQUIRES_HUMAN_REVIEW' && !verificationStillRunning;
  const taskStatus =
    evaluation.status === 'PASS'
      ? 'completed'
      : evaluation.status === 'FAIL_BLOCKING'
        ? 'failed'
        : evaluation.status === 'FAIL_RETRYABLE'
          ? 'failed'
          : needsHumanApproval
            ? 'awaiting_approval'
            : verificationStillRunning
              ? 'running'
              : lifecycleTaskStatus(lifecycle);

  const mergedExternal = {
    ...external,
    start_task_id: lifecycle.startTaskId ?? external.start_task_id ?? null,
    conversation_id: lifecycle.conversationId ?? external.conversation_id ?? null,
    sandbox_status: lifecycle.sandboxStatus ?? null,
    execution_status: lifecycle.executionStatus ?? null,
    repository: lifecycle.repository ?? null,
    branch: lifecycle.branch ?? null,
    pr_numbers: lifecycle.prNumbers ?? [],
    github_verification: githubEvidence,
  };

  await db
    .from('ai_tasks')
    .update({
      status: taskStatus,
      tool_output: mergedExternal,
      result_json: {
        ok: evaluation.status === 'PASS',
        status: lifecycle.status,
        provider: 'openhands',
        external_run: mergedExternal,
        evaluation,
      },
      result: evaluation.status === 'PASS' ? { provider: 'openhands', lifecycle, githubEvidence, evaluation } : task.result,
      error_message: evaluation.status === 'FAIL_BLOCKING' ? evaluation.reasons.join(' ') : null,
      requires_approval: needsHumanApproval,
      approval_status: needsHumanApproval ? 'pending' : task.approval_status,
      approval_reason: needsHumanApproval ? evaluation.reasons.join(' ') : task.approval_reason,
      completed_at: ['completed', 'failed'].includes(taskStatus) ? now : null,
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
        status: lifecycle.status === 'completed' ? 'completed' : lifecycle.status === 'failed' ? 'failed' : lifecycle.status === 'approval_required' ? 'awaiting_approval' : 'running',
        output: `OpenHands status: ${lifecycle.status}`,
        output_json: { lifecycle },
        error_message: lifecycle.status === 'failed' ? lifecycle.error || 'OpenHands execution failed' : null,
        completed_at: ['completed', 'failed'].includes(lifecycle.status) ? now : null,
      })
      .eq('id', executeStep.id);
  }

  if (verifyStep) {
    await db
      .from('ai_task_steps')
      .update({
        status: evaluation.status === 'PASS' ? 'completed' : needsHumanApproval ? 'awaiting_approval' : evaluation.status === 'FAIL_BLOCKING' || evaluation.status === 'FAIL_RETRYABLE' ? 'failed' : 'pending',
        output: evaluation.reasons.join(' '),
        output_json: { evaluation, github: githubEvidence },
        completed_at: evaluation.status === 'PASS' ? now : null,
      })
      .eq('id', verifyStep.id);
  }

  if (needsHumanApproval) {
    await createPendingApprovalForVerification(task.id, input.actorId ?? task.user_id, evaluation.reasons, task.tenant_id);
  }

  if (evaluation.status === 'PASS') {
    const summary = `OpenHands engineering run independently verified. Conversation: ${lifecycle.conversationId ?? 'unknown'}. Branch: ${lifecycle.branch ?? 'not reported'}. PRs: ${(lifecycle.prNumbers ?? []).join(', ') || 'not reported'}.`;
    await db.from('ai_memory').upsert(
      {
        scope: 'task',
        task_id: task.id,
        agent_id: task.agent_id ?? null,
        category: 'task_result',
        key: `task:${task.id}:openhands`,
        value: summary,
        content: summary,
        metadata: { provider: 'openhands', lifecycle, github: githubEvidence, evaluation },
        tenant_id: task.tenant_id ?? null,
        user_id: input.actorId ?? task.user_id ?? null,
        updated_at: now,
      },
      { onConflict: 'key' },
    );
  }

  await appendLog(
    task.id,
    `OpenHands lifecycle refreshed: ${lifecycle.status}; evaluation: ${evaluation.status}.`,
    evaluation.status === 'FAIL_BLOCKING' ? 'error' : evaluation.status === 'REQUIRES_HUMAN_REVIEW' ? 'warn' : 'info',
    task.tenant_id,
    input.actorId ?? task.user_id,
  );

  return lifecycle;
}

async function createPendingApprovalForVerification(
  taskId: string,
  requestedBy: string | null | undefined,
  reasons: string[],
  tenantId?: string | null,
) {
  if (!requestedBy) return;
  const db = await requireAdminClient();
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
    reason: reasons.join(' '),
    risk_tags: ['openhands_verification'],
    tenant_id: tenantId ?? null,
  });
}
