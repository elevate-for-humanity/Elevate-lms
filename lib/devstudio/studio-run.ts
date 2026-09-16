import type { SupabaseClient } from '@supabase/supabase-js';
import type { Plan, PlanStep } from '@/lib/platform/planner';

export type CanonicalStudioRun = {
  id: string;
  stepIds: Map<string, string>;
};

type EnsureRunInput = {
  actorId: string;
  conversationId?: string;
  organizationId?: string;
  courseId?: string;
  command: string;
  plan: Plan;
};

function statusForPlanStep(step: PlanStep) {
  if (step.status === 'done') return 'verified';
  if (step.status === 'failed') return 'failed';
  if (step.status === 'skipped') return 'skipped';
  if (step.status === 'running') return 'running';
  if (step.status === 'awaiting_approval') return 'blocked';
  return 'pending';
}

export async function ensureCanonicalStudioRun(
  db: SupabaseClient,
  input: EnsureRunInput,
): Promise<CanonicalStudioRun> {
  const { data: existing, error: lookupError } = await db
    .from('studio_runs')
    .select('id')
    .eq('user_id', input.actorId)
    .contains('context', { plan_id: input.plan.id })
    .maybeSingle();
  if (lookupError) throw lookupError;

  let runId = existing?.id as string | undefined;
  if (!runId) {
    const { data: created, error: createError } = await db
      .from('studio_runs')
      .insert({
        conversation_id: input.conversationId ?? null,
        user_id: input.actorId,
        organization_id: input.organizationId ?? null,
        course_id: input.courseId ?? null,
        command: input.command,
        goal: input.plan.goal,
        status: 'planning',
        context: { plan_id: input.plan.id },
        idempotency_key: `plan:${input.plan.id}`,
      })
      .select('id')
      .single();
    if (createError || !created) throw createError ?? new Error('Failed to create Studio run');
    runId = String(created.id);

    const rows = input.plan.steps.map((step) => ({
      run_id: runId,
      ordinal: step.order,
      name: step.title,
      specialist: step.runner ?? null,
      status: statusForPlanStep(step),
      required: step.status !== 'skipped',
      input: {
        plan_step_id: step.id,
        command: step.command,
        expected_output: step.expected_output ?? null,
        verification_rule: step.verification_rule ?? null,
      },
      output: step.output ? { legacy_output: step.output } : {},
      evidence: step.status === 'done' ? [{ source: 'legacy_plan_checkpoint' }] : [],
      max_attempts: step.max_attempts ?? 3,
    }));
    const { data: createdSteps, error: stepError } = await db
      .from('studio_run_steps')
      .insert(rows)
      .select('id,input');
    if (stepError) throw stepError;

    const stepIds = new Map<string, string>(
      (createdSteps ?? []).map((step: any) => [String(step.input?.plan_step_id), String(step.id)]),
    );
    const dependencies = input.plan.steps.flatMap((step) =>
      (step.depends_on ?? []).map((dependencyId) => ({
        step_id: stepIds.get(step.id),
        depends_on_step_id: stepIds.get(dependencyId),
      })),
    ).filter(
      (dependency): dependency is { step_id: string; depends_on_step_id: string } =>
        Boolean(dependency.step_id && dependency.depends_on_step_id),
    );
    if (dependencies.length) {
      const { error: dependencyError } = await db
        .from('studio_run_step_dependencies')
        .insert(dependencies);
      if (dependencyError) throw dependencyError;
    }
    await appendStudioRunEvent(db, runId, 'run.created', 'Studio run created from plan', {
      plan_id: input.plan.id,
      step_count: rows.length,
    });
    return { id: runId, stepIds };
  }

  const { data: steps, error: stepsError } = await db
    .from('studio_run_steps')
    .select('id,input')
    .eq('run_id', runId);
  if (stepsError) throw stepsError;
  return {
    id: runId,
    stepIds: new Map(
      (steps ?? []).map((step: any) => [String(step.input?.plan_step_id), String(step.id)]),
    ),
  };
}

export async function appendStudioRunEvent(
  db: SupabaseClient,
  runId: string,
  eventType: string,
  message: string,
  payload: Record<string, unknown> = {},
  stepId?: string,
  level: 'debug' | 'info' | 'warning' | 'error' = 'info',
) {
  const { error } = await db.from('studio_run_events').insert({
    run_id: runId,
    step_id: stepId ?? null,
    event_type: eventType,
    level,
    message,
    payload,
  });
  if (error) throw error;
}

export async function startCanonicalStudioStep(
  db: SupabaseClient,
  run: CanonicalStudioRun,
  planStep: PlanStep,
) {
  const stepId = run.stepIds.get(planStep.id);
  if (!stepId) throw new Error(`Canonical Studio step missing for ${planStep.id}`);
  const now = new Date().toISOString();
  const { error: runError } = await db
    .from('studio_runs')
    .update({ status: 'executing', active_step_id: stepId, started_at: now })
    .eq('id', run.id);
  if (runError) throw runError;
  const { error: stepError } = await db
    .from('studio_run_steps')
    .update({ status: 'running', started_at: now })
    .eq('id', stepId);
  if (stepError) throw stepError;
  await appendStudioRunEvent(
    db,
    run.id,
    'step.started',
    planStep.title,
    { plan_step_id: planStep.id },
    stepId,
  );
  return stepId;
}

export async function bindCanonicalTask(
  db: SupabaseClient,
  run: CanonicalStudioRun,
  planStep: PlanStep,
  taskId: string,
  toolName?: string | null,
) {
  const stepId = run.stepIds.get(planStep.id);
  if (!stepId) throw new Error(`Canonical Studio step missing for ${planStep.id}`);
  const { error } = await db
    .from('studio_run_steps')
    .update({
      tool_name: toolName ?? null,
      output: { task_id: taskId, status: 'dispatched' },
    })
    .eq('id', stepId);
  if (error) throw error;
}

export async function verifyCanonicalStudioStep(
  db: SupabaseClient,
  run: CanonicalStudioRun,
  planStep: PlanStep,
  evidence: Record<string, unknown>,
) {
  const stepId = run.stepIds.get(planStep.id);
  if (!stepId) throw new Error(`Canonical Studio step missing for ${planStep.id}`);
  const { error } = await db
    .from('studio_run_steps')
    .update({
      status: 'verified',
      evidence: [evidence],
      output: { verified: true, task_id: planStep.task_id ?? null },
      completed_at: new Date().toISOString(),
    })
    .eq('id', stepId);
  if (error) throw error;
  await appendStudioRunEvent(db, run.id, 'step.verified', planStep.title, evidence, stepId);
}

export async function failCanonicalStudioStep(
  db: SupabaseClient,
  run: CanonicalStudioRun,
  planStep: PlanStep,
  message: string,
) {
  const stepId = run.stepIds.get(planStep.id);
  if (!stepId) throw new Error(`Canonical Studio step missing for ${planStep.id}`);
  const { error } = await db
    .from('studio_run_steps')
    .update({
      status: 'failed',
      error: { message },
      completed_at: new Date().toISOString(),
    })
    .eq('id', stepId);
  if (error) throw error;
  await db.from('studio_runs').update({ status: 'failed', failure: { message } }).eq('id', run.id);
  await appendStudioRunEvent(db, run.id, 'step.failed', message, {}, stepId, 'error');
}

export async function completeCanonicalStudioRun(
  db: SupabaseClient,
  run: CanonicalStudioRun,
  result: Record<string, unknown>,
) {
  const { error } = await db
    .from('studio_runs')
    .update({
      status: 'completed',
      active_step_id: null,
      result,
      completed_at: new Date().toISOString(),
    })
    .eq('id', run.id);
  if (error) throw error;
  await appendStudioRunEvent(db, run.id, 'run.completed', 'Studio run verified', result);
}
