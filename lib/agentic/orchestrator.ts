import { requireAdminClient } from '@/lib/supabase/admin';
import { getAgenticWorker, workerCanHandle } from './worker-registry';
import type {
  AgenticActionResult,
  AgenticExecutionStatus,
  AgenticPlan,
  AgenticPlanTask,
  AgenticTargetType,
} from './types';

function taskId(prefix: string, index: number) {
  return `${prefix}-${index + 1}`;
}

/**
 * Deterministic baseline planner. Domain workers may replace/refine this plan,
 * but PARIS always persists an inspectable task graph before mutations begin.
 */
export function createBaselineAgenticPlan(
  targetType: AgenticTargetType,
  prompt: string,
): AgenticPlan {
  const trimmed = prompt.trim().slice(0, 4000);
  const tasks: AgenticPlanTask[] = [];
  const push = (
    worker: string,
    action: string,
    input: Record<string, unknown>,
    dependencies: string[] = [],
  ) => {
    const definition = getAgenticWorker(worker);
    if (!definition || !workerCanHandle(worker, targetType)) {
      throw new Error(`Worker ${worker} cannot handle ${targetType}`);
    }
    const id = taskId(worker, tasks.length);
    tasks.push({
      id,
      worker,
      action,
      dependencies,
      input,
      costClass: definition.costClass,
      approvalRequired: Boolean(definition.approvalRequired),
      idempotencyKey: `${worker}:${action}`,
    });
    return id;
  };

  if (targetType === 'application') {
    const interview = push('application-interview', 'collect_next_required_answer', {
      prompt: trimmed,
    });
    const qa = push('admissions-qa', 'evaluate_completeness', {}, [interview]);
    push('application-documents', 'evaluate_document_requirements', {}, [interview]);
    push('funding-guidance', 'evaluate_funding_pathway', {}, [interview]);
    push('enrollment', 'wait_for_authorized_approval', {}, [qa]);
  } else if (targetType === 'course' || targetType === 'program') {
    const architecture = push('course-architect', 'plan_learning_structure', { prompt: trimmed });
    const instruction =
      targetType === 'course'
        ? push('instructional-designer', 'design_learning_experience', {}, [architecture])
        : architecture;
    const design = push('visual-designer', 'compose_visual_system', {}, [architecture]);
    const media = push('media-director', 'plan_media', {}, [instruction, design]);
    const qa = push('compliance-qa', 'validate_build', {}, [instruction, design, media]);
    push('publisher', 'persist_canonical_build', {}, [qa]);
  } else if (targetType === 'website' || targetType === 'store_workspace') {
    const site = push('website-builder', 'compose_site', { prompt: trimmed });
    const design = push('visual-designer', 'compose_visual_system', {}, [site]);
    const media = push('media-director', 'plan_media', {}, [site, design]);
    const qa = push('compliance-qa', 'validate_build', {}, [site, design, media]);
    push('publisher', 'persist_canonical_build', {}, [qa]);
  } else if (targetType === 'workflow' || targetType === 'dev_studio') {
    const workflow = push('workflow-builder', 'compose_workflow', { prompt: trimmed });
    const qa = push('compliance-qa', 'validate_build', {}, [workflow]);
    push('publisher', 'persist_canonical_build', {}, [qa]);
  } else if (targetType === 'apprenticeship') {
    const intake = push('apprenticeship-intake', 'plan_apprenticeship_flow', { prompt: trimmed });
    const qa = push('compliance-qa', 'validate_build', {}, [intake]);
    push('publisher', 'persist_canonical_build', {}, [qa]);
  } else if (targetType === 'marketing_campaign') {
    const design = push('visual-designer', 'compose_campaign_design', { prompt: trimmed });
    const media = push('media-director', 'plan_campaign_media', {}, [design]);
    const qa = push('compliance-qa', 'validate_build', {}, [design, media]);
    push('publisher', 'persist_canonical_build', {}, [qa]);
  }

  return {
    summary: trimmed
      ? `Plan for ${targetType}: ${trimmed.slice(0, 180)}`
      : `Plan for ${targetType}`,
    tasks,
  };
}

export async function startAgenticRun(input: {
  projectId: string;
  targetType: AgenticTargetType;
  prompt: string;
  plan?: AgenticPlan;
}) {
  const db = await requireAdminClient();
  const plan = input.plan ?? createBaselineAgenticPlan(input.targetType, input.prompt);
  const { data: run, error: runError } = await db
    .from('agentic_build_runs')
    .insert({
      project_id: input.projectId,
      prompt: input.prompt,
      plan,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select('id, project_id, status, plan, started_at')
    .single();
  if (runError || !run)
    throw new Error(`Unable to start agentic run: ${runError?.message || 'unknown error'}`);

  const idMap = new Map<string, string>();
  for (const task of plan.tasks) {
    const dependencyIds = task.dependencies
      .map((dependency) => idMap.get(dependency))
      .filter(Boolean) as string[];
    const { data: row, error } = await db
      .from('agentic_build_tasks')
      .insert({
        run_id: run.id,
        worker: task.worker,
        action: task.action,
        dependencies: dependencyIds,
        status: 'queued',
        input: task.input,
        output: {},
        cost_class: task.costClass,
        requires_approval: task.approvalRequired,
        idempotency_key: task.idempotencyKey ?? `${task.worker}:${task.action}`,
        started_at: null,
      })
      .select('id')
      .single();
    if (error || !row)
      throw new Error(
        `Unable to create agentic task ${task.worker}: ${error?.message || 'unknown error'}`,
      );
    idMap.set(task.id, row.id);
  }

  await db.from('agentic_build_events').insert({
    project_id: input.projectId,
    run_id: run.id,
    event_type: 'agentic.run.started',
    summary: plan.summary,
    payload: { target_type: input.targetType, task_count: plan.tasks.length },
  });

  return { run, plan, taskIds: Object.fromEntries(idMap) };
}

export async function recordAgenticTaskResult(input: {
  projectId: string;
  runId: string;
  taskId: string;
  result: AgenticActionResult;
}) {
  const db = await requireAdminClient();
  const now = new Date().toISOString();
  const status: AgenticExecutionStatus = input.result.status;
  const { error } = await db
    .from('agentic_build_tasks')
    .update({
      status,
      output: input.result,
      error: input.result.errors?.join('\n') || null,
      completed_at:
        status === 'completed' || status === 'failed' || status === 'canceled' ? now : null,
    })
    .eq('id', input.taskId)
    .eq('run_id', input.runId);
  if (error) throw new Error(`Unable to record agentic task result: ${error.message}`);

  if (input.result.creditsUsed > 0) {
    await db
      .rpc('increment_agentic_run_credits', {
        p_run_id: input.runId,
        p_credits: input.result.creditsUsed,
      })
      .then(({ error: rpcError }) => {
        if (rpcError) throw new Error(`Unable to record run credits: ${rpcError.message}`);
      });
  }

  await db.from('agentic_build_events').insert({
    project_id: input.projectId,
    run_id: input.runId,
    task_id: input.taskId,
    event_type: `agentic.task.${status}`,
    summary: input.result.summary,
    payload: {
      preview_updates: input.result.previewUpdates ?? [],
      artifacts: input.result.artifacts ?? [],
      requires_confirmation: Boolean(input.result.requiresConfirmation),
      requires_human_review: Boolean(input.result.requiresHumanReview),
      credits_used: input.result.creditsUsed,
    },
  });
}

export async function finishAgenticRun(input: {
  projectId: string;
  runId: string;
  status: 'completed' | 'failed' | 'canceled';
  error?: string;
}) {
  const db = await requireAdminClient();
  const now = new Date().toISOString();
  const patch = {
    status: input.status,
    error: input.error ?? null,
    completed_at: input.status === 'completed' ? now : null,
    failed_at: input.status === 'failed' ? now : null,
  };
  const { error } = await db
    .from('agentic_build_runs')
    .update(patch)
    .eq('id', input.runId)
    .eq('project_id', input.projectId);
  if (error) throw new Error(`Unable to finish agentic run: ${error.message}`);
  await db.from('agentic_build_events').insert({
    project_id: input.projectId,
    run_id: input.runId,
    event_type: `agentic.run.${input.status}`,
    summary: input.status === 'completed' ? 'Build run completed' : `Build run ${input.status}`,
    payload: input.error ? { error: input.error } : {},
  });
}

export async function createAgenticCheckpoint(input: {
  projectId: string;
  runId?: string | null;
  targetType: AgenticTargetType;
  targetId?: string | null;
  label: string;
  snapshot: Record<string, unknown>;
  createdBy?: string | null;
}) {
  const db = await requireAdminClient();
  const { data, error } = await db
    .from('agentic_build_checkpoints')
    .insert({
      project_id: input.projectId,
      run_id: input.runId ?? null,
      target_type: input.targetType,
      target_id: input.targetId ?? null,
      label: input.label,
      snapshot: input.snapshot,
      created_by: input.createdBy ?? null,
    })
    .select('id, label, created_at')
    .single();
  if (error || !data)
    throw new Error(`Unable to create checkpoint: ${error?.message || 'unknown error'}`);
  return data;
}
