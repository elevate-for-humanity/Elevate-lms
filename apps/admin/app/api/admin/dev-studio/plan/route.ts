/**
 * POST /api/admin/dev-studio/plan
 *
 * Canonical high-level agent planner.
 *
 * Goal → planner → persisted ai_tasks → registered tool runtime → evaluator
 * → checkpoint in canonical ai_memory → approval/resume when required.
 */

import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { canExecuteStep, type Plan } from '@/lib/platform/planner';
import { prepareMasterStudioPlan } from '@/lib/studio/master-runtime';
import { emitEvent } from '@/lib/platform/events';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createAiTask, runTaskExecution } from '@/lib/devstudio/os/task-runner';
import { evaluateExecution } from '@/lib/platform/orchestration/evaluator';
import { loadSharedContext } from '@/lib/platform/orchestration/context-service';
import { getAITool } from '@/lib/ai/tools/registry';
import { getAdminUrl } from '@/lib/utils/siteUrl';
import { logger } from '@/lib/logger';
import {
  bindCanonicalTask,
  ensureCanonicalStudioRun,
  startCanonicalStudioStep,
  syncCanonicalStudioRunCheckpoint,
  verifyCanonicalStudioStep,
} from '@/lib/devstudio/studio-run';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function enc(text: string, extra: Record<string, unknown> = {}) {
  return new TextEncoder().encode(`data: ${JSON.stringify({ text, ...extra })}\n\n`);
}
function done() {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const RUN = '\x1b[33m⚙\x1b[0m';
const WAIT = '\x1b[36m⏸\x1b[0m';
const DIM = '\x1b[90m';
const RST = '\x1b[0m';

function parsePlan(value: unknown): Plan | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Plan;
  if (!candidate.id || !candidate.goal || !Array.isArray(candidate.steps)) return null;
  return candidate;
}

async function persistPlan(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  plan: Plan,
  actorId: string,
  tenantId?: string,
) {
  const content = JSON.stringify(plan);
  const key = `plan:${plan.id}`;
  const payload = {
    scope: 'plan',
    key,
    content,
    value: content,
    metadata: {
      plan_id: plan.id,
      goal: plan.goal,
      status: plan.status,
      updated_by: actorId,
    },
    tenant_id: tenantId ?? null,
    user_id: actorId,
    updated_at: new Date().toISOString(),
  };

  // The live uniqueness rule uses COALESCE(agent_id, nil_uuid), which cannot be
  // targeted by PostgREST's column-list onConflict option. Resolve then write
  // explicitly so approval checkpoints are never silently lost.
  const { data: existing, error: lookupError } = await db
    .from('ai_memory')
    .select('id')
    .eq('scope', 'plan')
    .eq('key', key)
    .is('agent_id', null)
    .maybeSingle();
  if (lookupError) throw lookupError;

  const writeResult = existing?.id
    ? await db.from('ai_memory').update(payload).eq('id', existing.id)
    : await db.from('ai_memory').insert(payload);
  if (writeResult.error) throw writeResult.error;
}

async function loadPlan(
  db: Awaited<ReturnType<typeof requireAdminClient>>,
  planId: string,
  actorId: string,
): Promise<Plan | null> {
  const { data } = await db
    .from('ai_memory')
    .select('content')
    .eq('scope', 'plan')
    .eq('key', `plan:${planId}`)
    .eq('user_id', actorId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data?.content) return null;
  try {
    return parsePlan(JSON.parse(String(data.content)));
  } catch {
    return null;
  }
}

async function currentTask(db: Awaited<ReturnType<typeof requireAdminClient>>, taskId: string) {
  const { data } = await db
    .from('ai_tasks')
    .select(
      'id,status,attempts,result,result_json,tool_output,error_message,approval_reason,approval_status,tool_name,requires_approval',
    )
    .eq('id', taskId)
    .single();
  return data as Record<string, any> | null;
}

function taskEvidence(task: Record<string, any> | null): unknown {
  if (!task) return null;
  if (task.tool_output !== undefined && task.tool_output !== null) return task.tool_output;
  if (task.result_json?.payload !== undefined) return task.result_json.payload;
  return task.result_json ?? task.result ?? null;
}

function safeEvidenceSummary(value: unknown): string | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const safeKeys = ['connected', 'status', 'message', 'company_name', 'last_sync', 'ok'];
  const summary = Object.fromEntries(
    safeKeys.filter((key) => record[key] !== undefined).map((key) => [key, record[key]]),
  );
  return Object.keys(summary).length ? JSON.stringify(summary) : null;
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();

  const body = await req.json().catch(() => ({}));
  const goal = typeof body.goal === 'string' ? body.goal.trim() : '';
  const params =
    body.params && typeof body.params === 'object' ? (body.params as Record<string, string>) : {};
  const tenantId = typeof body.tenantId === 'string' ? body.tenantId : undefined;
  const courseId = typeof body.courseId === 'string' ? body.courseId : undefined;
  const resumePlanId = typeof body.planId === 'string' ? body.planId.trim() : '';
  const documentIds = Array.isArray(body.documentIds)
    ? body.documentIds
        .filter((value: unknown): value is string => typeof value === 'string')
        .slice(0, 10)
    : [];
  const conversationId =
    typeof body.conversationId === 'string' && body.conversationId.trim()
      ? body.conversationId.trim()
      : undefined;

  if (!goal && !resumePlanId) {
    return new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
  }

  const db = await requireAdminClient();
  let durableDocumentContext = '';
  if (documentIds.length) {
    const { data: documents, error: documentError } = await db
      .from('devstudio_documents')
      .select('id,name,original_name,content_type,size_bytes,extracted_text,extraction_status')
      .in('id', documentIds)
      .eq('user_id', auth.id);
    if (documentError) throw documentError;
    const found = new Set((documents ?? []).map((document) => String(document.id)));
    const missing = documentIds.filter((id: string) => !found.has(id));
    if (missing.length) throw new Error('One or more attached Studio documents are unavailable.');
    durableDocumentContext = (documents ?? [])
      .map((document) =>
        [
          `Studio document ID: ${document.id}`,
          `Name: ${document.name || document.original_name}`,
          `Content type: ${document.content_type || 'unknown'}`,
          `Extraction status: ${document.extraction_status || 'unknown'}`,
          document.extracted_text
            ? `Extracted content:\n${document.extracted_text}`
            : 'Extracted content unavailable.',
        ].join('\n'),
      )
      .join('\n\n');
  }
  const effectiveGoal = [goal, durableDocumentContext]
    .filter(Boolean)
    .join('\n\nATTACHED STUDIO DOCUMENTS\n');
  const adminOrigin = getAdminUrl();
  const appOrigin = req.nextUrl.origin;

  const stream = new ReadableStream({
    async start(controller) {
      const write = (line: string, extra: Record<string, unknown> = {}) => {
        try {
          controller.enqueue(enc(line, extra));
        } catch {
          /* stream closed */
        }
      };

      try {
        let plan = resumePlanId ? await loadPlan(db, resumePlanId, auth.id) : null;
        if (!plan) {
          plan = prepareMasterStudioPlan(effectiveGoal, params);
          const shared = await loadSharedContext({
            goal: effectiveGoal,
            tenantId,
            userId: auth.id,
          }).catch(() => null);
          await persistPlan(db, plan, auth.id, tenantId);
          write(`\x1b[1mAI Planner — governed execution\x1b[0m`);
          write(`${DIM}Goal: ${plan.goal}${RST}`);
          write(`${DIM}Plan ID: ${plan.id}${RST}`);
          if (shared) {
            write(
              `${DIM}Context: ${shared.shortTermMemory.length} memories · ${shared.workflowMemory.length} workflow runs · ${shared.provenance.length} provenance references${RST}`,
            );
          }
        } else {
          write(`\x1b[1mAI Planner — resuming checkpoint\x1b[0m`);
          write(`${DIM}Plan ID: ${plan.id}${RST}`);

          // Approval executes the canonical task. Reconcile that result into the
          // persisted plan before scheduling dependent steps.
          for (const step of plan.steps) {
            if (step.status !== 'awaiting_approval' || !step.task_id) continue;
            const approvedTask = await currentTask(db, step.task_id);
            if (!approvedTask || approvedTask.status === 'awaiting_approval') continue;
            const approvalEvaluation = evaluateExecution({
              tool: String(approvedTask.tool_name ?? 'advisory'),
              result: taskEvidence(approvedTask),
              error: approvedTask.error_message ?? null,
              attempts: Number(approvedTask.attempts ?? 1),
              maxAttempts: step.max_attempts ?? 2,
              expectedOutput: step.expected_output,
              verificationRule: step.verification_rule,
            });
            step.evaluation = approvalEvaluation.status;
            step.output = JSON.stringify({
              task_id: step.task_id,
              tool: approvedTask.tool_name ?? null,
              result: taskEvidence(approvedTask),
              evaluation: approvalEvaluation,
            });
            step.status = approvalEvaluation.status === 'PASS' ? 'done' : 'failed';
            if (step.status === 'done') write(`${PASS} Approved step verified: ${step.title}`);
            else write(`${FAIL} Approved step failed verification: ${step.title}`);
          }

          // External engineering work is asynchronous. Reconcile the durable
          // task state into the plan without dispatching the mutation-capable
          // tool again. The OpenHands reconciler owns provider polling and
          // changes the canonical task only after repository evidence exists.
          for (const step of plan.steps) {
            if (step.status !== 'running' || !step.task_id) continue;
            const runningTask = await currentTask(db, step.task_id);
            if (!runningTask || runningTask.status === 'running') continue;

            if (runningTask.status === 'awaiting_approval') {
              step.status = 'awaiting_approval';
              step.evaluation = 'REQUIRES_HUMAN_REVIEW';
              step.output = String(runningTask.approval_reason ?? 'Human approval required');
              continue;
            }

            const runningEvaluation = evaluateExecution({
              tool: String(runningTask.tool_name ?? 'advisory'),
              result: taskEvidence(runningTask),
              error: runningTask.error_message ?? null,
              attempts: Number(runningTask.attempts ?? 1),
              maxAttempts: step.max_attempts ?? 2,
              expectedOutput: step.expected_output,
              verificationRule: step.verification_rule,
            });
            step.evaluation = runningEvaluation.status;
            step.output = JSON.stringify({
              task_id: step.task_id,
              tool: runningTask.tool_name ?? null,
              result: taskEvidence(runningTask),
              evaluation: runningEvaluation,
            });
            step.status = runningEvaluation.status === 'PASS' ? 'done' : 'failed';
            if (step.status === 'done') write(`${PASS} Running step verified: ${step.title}`);
            else write(`${FAIL} Running step failed verification: ${step.title}`);
          }
          await persistPlan(db, plan, auth.id, tenantId);
        }

        const canonicalRun = await ensureCanonicalStudioRun(db, {
          actorId: auth.id,
          conversationId,
          organizationId: tenantId,
          courseId,
          command: goal || plan.goal,
          plan,
        });
        write(`${DIM}Run ID: ${canonicalRun.id}${RST}`, { runId: canonicalRun.id });

        plan.status = 'running';
        await persistPlan(db, plan, auth.id, tenantId);

        await emitEvent('planner.started', 'ai', {
          actor_id: auth.id,
          actor_type: 'ai',
          payload: {
            goal: plan.goal,
            plan_id: plan.id,
            step_count: plan.steps.length,
            resumed: Boolean(resumePlanId),
          },
          message: `AI planner ${resumePlanId ? 'resumed' : 'started'}: ${plan.goal}`,
        });

        let failedSteps = 0;
        let awaitingApproval = false;
        const maxPasses = plan.steps.length + 2;
        let pass = 0;

        while (
          plan.steps.some((step) => step.status === 'pending') &&
          pass < maxPasses &&
          !awaitingApproval
        ) {
          pass += 1;
          let progressed = false;

          for (const step of plan.steps) {
            if (step.status !== 'pending') continue;
            if (!canExecuteStep(step, plan.steps)) continue;
            progressed = true;
            step.status = 'running';
            await startCanonicalStudioStep(db, canonicalRun, step);
            await persistPlan(db, plan, auth.id, tenantId);

            write(`${RUN} Step ${step.order}/${plan.steps.length}: ${step.title}`);
            if (step.runner) write(`${DIM}Runner: ${step.runner}${RST}`);
            write(`${DIM}${step.command}${RST}`);

            try {
              const created = await createAiTask(
                db,
                {
                  title: `[${plan.id}] ${step.title}`,
                  description: `Synthetic-intelligence plan step ${step.id} for goal: ${plan.goal}`,
                  command: step.command,
                  requestedBy: auth.id,
                  traceId: `${plan.id}:${step.id}`,
                  conversationId,
                  studioRunId: canonicalRun.id,
                  studioRunStepId: canonicalRun.stepIds.get(step.id),
                },
                {
                  actorRoles: auth.effectiveRoles,
                  tenantId: tenantId ?? null,
                  requestHeaders: req.headers,
                  adminOrigin,
                  appOrigin,
                },
              );

              step.task_id = String(created.id);
              await bindCanonicalTask(
                db,
                canonicalRun,
                step,
                step.task_id,
                created.tool_name ? String(created.tool_name) : null,
              );
              let task = await currentTask(db, step.task_id);
              if (!task) throw new Error('Planner task record could not be reloaded');

              if (task.status === 'awaiting_approval') {
                step.status = 'awaiting_approval';
                step.evaluation = 'REQUIRES_HUMAN_REVIEW';
                step.output = String(task.approval_reason ?? 'Human approval required');
                plan.status = 'awaiting_approval';
                awaitingApproval = true;
                write(`${WAIT} Step ${step.order} paused for authorized human approval.`, {
                  checkpoint: {
                    planId: plan.id,
                    taskId: step.task_id,
                    status: 'awaiting_approval',
                    title: step.title,
                    reason: step.output,
                  },
                });
                write(`${DIM}Task ID: ${step.task_id}${RST}`);
                await persistPlan(db, plan, auth.id, tenantId);
                break;
              }

              if (task.status === 'running') {
                step.status = 'running';
                step.output = JSON.stringify({
                  task_id: step.task_id,
                  tool: task.tool_name ?? null,
                  status: 'running',
                });
                plan.status = 'running';
                write(`${RUN} External engineering task accepted and still running.`, {
                  checkpoint: {
                    planId: plan.id,
                    taskId: step.task_id,
                    status: 'running',
                    title: step.title,
                  },
                });
                write(`${DIM}Task ID: ${step.task_id}${RST}`);
                await persistPlan(db, plan, auth.id, tenantId);
                continue;
              }

              let evaluation = evaluateExecution({
                tool: String(task.tool_name ?? 'advisory'),
                result: taskEvidence(task),
                error: task.error_message ?? null,
                attempts: Number(task.attempts ?? 1),
                maxAttempts: step.max_attempts ?? 2,
                expectedOutput: step.expected_output,
                verificationRule: step.verification_rule,
              });

              if (evaluation.status === 'FAIL_RETRYABLE') {
                const tool = task.tool_name ? getAITool(String(task.tool_name)) : null;
                const safelyRetryable = !tool || tool.idempotent;
                if (safelyRetryable && Number(task.attempts ?? 1) < (step.max_attempts ?? 2)) {
                  write(
                    `${DIM}Retrying safely after evaluator classified the result as retryable.${RST}`,
                  );
                  await runTaskExecution(db, step.task_id, auth.id, {
                    actorRoles: auth.effectiveRoles,
                    tenantId: tenantId ?? null,
                    requestHeaders: req.headers,
                    adminOrigin,
                    appOrigin,
                  });
                  task = await currentTask(db, step.task_id);
                  evaluation = evaluateExecution({
                    tool: String(task?.tool_name ?? 'advisory'),
                    result: taskEvidence(task),
                    error: task?.error_message ?? null,
                    attempts: Number(task?.attempts ?? 2),
                    maxAttempts: step.max_attempts ?? 2,
                    expectedOutput: step.expected_output,
                    verificationRule: step.verification_rule,
                  });
                }
              }

              step.evaluation = evaluation.status;
              step.output = JSON.stringify({
                task_id: step.task_id,
                tool: task?.tool_name ?? null,
                result: taskEvidence(task),
                evaluation,
              });

              if (evaluation.status === 'PASS') {
                step.status = 'done';
                await verifyCanonicalStudioStep(db, canonicalRun, step, {
                  source: 'ai_task_evaluator',
                  task_id: step.task_id,
                  evaluation: evaluation.status,
                  tool: task?.tool_name ?? null,
                });
                write(`${PASS} Step ${step.order} verified: ${step.title}`);
                const evidence = safeEvidenceSummary(taskEvidence(task));
                write(
                  evidence
                    ? `${DIM}Evidence: ${evidence}${RST}`
                    : `${DIM}Evidence captured in task ${step.task_id}.${RST}`,
                );
              } else if (evaluation.status === 'REQUIRES_HUMAN_REVIEW') {
                step.status = 'awaiting_approval';
                plan.status = 'awaiting_approval';
                awaitingApproval = true;
                write(`${WAIT} Step ${step.order} requires human review.`);
                await persistPlan(db, plan, auth.id, tenantId);
                break;
              } else {
                step.status = 'failed';
                step.error = evaluation.reasons.join(' | ');
                failedSteps += 1;
                write(`${FAIL} Step ${step.order} failed verification: ${step.title}`);
                for (const dependent of plan.steps) {
                  if (dependent.depends_on?.includes(step.id) && dependent.status === 'pending') {
                    dependent.status = 'skipped';
                  }
                }
              }

              await persistPlan(db, plan, auth.id, tenantId);
            } catch (error) {
              logger.error('[dev-studio/plan] step execution failed', error, {
                planId: plan.id,
                stepId: step.id,
              });
              step.status = 'failed';
              step.evaluation = 'FAIL_BLOCKING';
              step.error = 'Plan step execution failed';
              failedSteps += 1;
              write(`${FAIL} Step ${step.order} failed: ${step.title}`);
              for (const dependent of plan.steps) {
                if (dependent.depends_on?.includes(step.id) && dependent.status === 'pending') {
                  dependent.status = 'skipped';
                }
              }
              await persistPlan(db, plan, auth.id, tenantId);
            }
          }

          if (!progressed) break;
        }

        const doneCount = plan.steps.filter((step) => step.status === 'done').length;
        const skippedCount = plan.steps.filter((step) => step.status === 'skipped').length;
        const waitingCount = plan.steps.filter(
          (step) => step.status === 'awaiting_approval',
        ).length;

        if (waitingCount > 0) plan.status = 'awaiting_approval';
        else if (failedSteps > 0 || plan.steps.some((step) => step.status === 'failed'))
          plan.status = 'failed';
        else if (plan.steps.every((step) => step.status === 'done' || step.status === 'skipped'))
          plan.status = 'done';

        await persistPlan(db, plan, auth.id, tenantId);
        await syncCanonicalStudioRunCheckpoint(db, canonicalRun, plan);

        write('\x1b[1m── Plan Summary ─────────────────────────\x1b[0m');
        write(`${PASS} Completed and verified: ${doneCount}/${plan.steps.length}`);
        if (failedSteps > 0) write(`${FAIL} Failed verification: ${failedSteps}`);
        if (waitingCount > 0) write(`${WAIT} Awaiting human approval: ${waitingCount}`);
        if (skippedCount > 0) write(`${DIM}Skipped: ${skippedCount}${RST}`);
        write(`${DIM}Status: ${plan.status} · Plan ID: ${plan.id}${RST}`);
        const waitingStep = plan.steps.find((step) => step.status === 'awaiting_approval');
        write('', {
          checkpoint: {
            planId: plan.id,
            runId: canonicalRun.id,
            taskId: waitingStep?.task_id ?? '',
            status:
              plan.status === 'done'
                ? 'done'
                : plan.status === 'failed'
                  ? 'failed'
                  : plan.status === 'awaiting_approval'
                    ? 'awaiting_approval'
                    : 'running',
            title: waitingStep?.title,
            reason: waitingStep?.output,
          },
        });

        await emitEvent('planner.completed', 'ai', {
          severity: plan.status === 'failed' ? 'warning' : 'info',
          actor_id: auth.id,
          actor_type: 'ai',
          payload: {
            goal: plan.goal,
            plan_id: plan.id,
            done: doneCount,
            failed: failedSteps,
            awaiting_approval: waitingCount,
            skipped: skippedCount,
          },
          message: `AI planner checkpoint: ${plan.goal} (${plan.status})`,
        });
      } catch (error) {
        logger.error('[dev-studio/plan] planner execution failed', error);
        write(`${FAIL} Planner execution failed`);
      } finally {
        try {
          controller.enqueue(done());
        } catch {
          /* stream closed */
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
    },
  });
}
