import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';

type TaskState = {
  id: string;
  status: string;
  studio_run_id?: string | null;
  studio_run_step_id?: string | null;
  tool_name?: string | null;
  result_json?: unknown;
  tool_output?: unknown;
  error_message?: string | null;
};

type StudioStepState = { status: string; required?: boolean | null; error?: unknown };

export function deriveStudioRunState(steps: StudioStepState[]): {
  status: 'executing' | 'blocked' | 'completed' | 'failed';
  failure: unknown | null;
} {
  const required = steps.filter((step) => step.required !== false);
  const failed = required.find((step) => step.status === 'failed');
  if (failed) {
    return {
      status: 'failed',
      failure: failed.error ?? { message: 'A required Studio step failed' },
    };
  }
  if (required.some((step) => step.status === 'blocked')) {
    return { status: 'blocked', failure: null };
  }
  if (
    required.length > 0 &&
    required.every((step) => ['verified', 'skipped'].includes(step.status))
  ) {
    return { status: 'completed', failure: null };
  }
  return { status: 'executing', failure: null };
}

function evidenceForTask(task: TaskState) {
  return [
    {
      source: 'ai_tasks',
      task_id: task.id,
      tool: task.tool_name ?? null,
      result: task.result_json ?? null,
      output: task.tool_output ?? null,
      reconciled_at: new Date().toISOString(),
    },
  ];
}

/**
 * Keep the canonical Studio run graph synchronized with the task executor.
 *
 * ai_tasks owns execution. studio_runs owns the durable, user-visible workflow.
 * Every terminal task transition must be projected here so the UI cannot show a
 * completed task while its parent run remains blocked/running forever.
 */
export async function reconcileStudioRunFromTask(db: SupabaseClient, task: TaskState) {
  if (!task.studio_run_id || !task.studio_run_step_id) return;

  const now = new Date().toISOString();
  if (task.status === 'completed') {
    const { error } = await db
      .from('studio_run_steps')
      .update({
        status: 'verified',
        output: task.result_json ?? {},
        evidence: evidenceForTask(task),
        error: null,
        completed_at: now,
        updated_at: now,
      })
      .eq('id', task.studio_run_step_id)
      .eq('run_id', task.studio_run_id);
    if (error) throw new Error(`Unable to verify Studio step: ${error.message}`);
  } else if (['failed', 'canceled', 'cancelled', 'rolled_back'].includes(task.status)) {
    const { error } = await db
      .from('studio_run_steps')
      .update({
        status: 'failed',
        error: { message: task.error_message || `Task ${task.status}` },
        output: task.result_json ?? {},
        completed_at: now,
        updated_at: now,
      })
      .eq('id', task.studio_run_step_id)
      .eq('run_id', task.studio_run_id);
    if (error) throw new Error(`Unable to fail Studio step: ${error.message}`);
  } else if (task.status === 'awaiting_approval' || task.status === 'blocked') {
    const { error } = await db
      .from('studio_run_steps')
      .update({
        status: 'blocked',
        output: {
          reason:
            task.error_message ||
            (task.status === 'awaiting_approval'
              ? 'Human approval required'
              : 'Required execution capability is unavailable'),
          task_id: task.id,
        },
        updated_at: now,
      })
      .eq('id', task.studio_run_step_id)
      .eq('run_id', task.studio_run_id);
    if (error) throw new Error(`Unable to block Studio step: ${error.message}`);
  } else if (task.status === 'running') {
    const { error } = await db
      .from('studio_run_steps')
      .update({ status: 'running', started_at: now, updated_at: now })
      .eq('id', task.studio_run_step_id)
      .eq('run_id', task.studio_run_id)
      .in('status', ['pending', 'ready', 'blocked']);
    if (error) throw new Error(`Unable to start Studio step: ${error.message}`);
  }

  const { data: steps, error: stepsError } = await db
    .from('studio_run_steps')
    .select('status,required,error')
    .eq('run_id', task.studio_run_id);
  if (stepsError) throw new Error(`Unable to reconcile Studio run: ${stepsError.message}`);

  const { status, failure } = deriveStudioRunState(steps ?? []);

  const { error: runError } = await db
    .from('studio_runs')
    .update({
      status,
      failure,
      completed_at: ['completed', 'failed'].includes(status) ? now : null,
      updated_at: now,
    })
    .eq('id', task.studio_run_id);
  if (runError) throw new Error(`Unable to update Studio run: ${runError.message}`);
}
