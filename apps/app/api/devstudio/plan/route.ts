/**
 * POST /api/devstudio/plan
 *
 * AI Internal Planner — SSE endpoint.
 *
 * Accepts a high-level goal, decomposes it into ordered steps,
 * executes each step via devstudio/execute, streams progress,
 * and verifies outcomes.
 *
 * Body: { goal: string, params?: Record<string, string> }
 *
 * SSE format: same as /api/devstudio/execute
 *   data: { text: "..." }
 *   data: [DONE]
 */

import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { decomposePlan, canExecuteStep, type PlanStep } from '@/lib/platform/planner';
import { emitEvent } from '@/lib/platform/events';
import { getAdminUrl } from '@/lib/utils/siteUrl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 min for multi-step plans

function enc(text: string) {
  return new TextEncoder().encode(`data: ${JSON.stringify({ text })}\n\n`);
}
function done() {
  return new TextEncoder().encode('data: [DONE]\n\n');
}

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const RUN  = '\x1b[33m⚙\x1b[0m';
const DIM  = '\x1b[90m';
const RST  = '\x1b[0m';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(req);
  if (auth.error) return auth.error;

  await hydrateProcessEnv();

  const { goal, params = {} } = await req.json();
  if (!goal?.trim()) {
    return new Response('data: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
  }

  const baseUrl = getAdminUrl();
  const cookieHeader = req.headers.get('cookie') ?? '';

  const stream = new ReadableStream({
    async start(controller) {
      const write = (line: string) => {
        try { controller.enqueue(enc(line)); } catch { /* closed */ }
      };

      try {
        const plan = decomposePlan(goal, params);

        write(`\x1b[1m🧠  AI Planner — Goal Decomposition\x1b[0m`);
        write(`${DIM}   Goal: ${goal}${RST}`);
        write(`${DIM}   Plan ID: ${plan.id}${RST}`);
        write(`${DIM}   Steps: ${plan.steps.length}${RST}`);
        write('');

        // Print plan overview
        write('\x1b[1mExecution Plan:\x1b[0m');
        plan.steps.forEach(s => {
          const dep = s.depends_on?.length ? ` (after ${s.depends_on.join(', ')})` : '';
          write(`   ${s.order}. ${s.title}${DIM}${dep}${RST}`);
        });
        write('');

        await emitEvent('planner.started', 'ai', {
          actor_id: auth.id,
          actor_type: 'ai',
          payload: { goal, plan_id: plan.id, step_count: plan.steps.length },
          message: `AI planner started: ${goal}`,
        });

        // Execute steps in dependency order
        let failedSteps = 0;
        const maxPasses = plan.steps.length + 2; // prevent infinite loops
        let pass = 0;

        while (plan.steps.some(s => s.status === 'pending') && pass < maxPasses) {
          pass++;
          for (const step of plan.steps) {
            if (step.status !== 'pending') continue;
            if (!canExecuteStep(step, plan.steps)) continue;

            step.status = 'running';
            write(`${RUN}  Step ${step.order}/${plan.steps.length}: ${step.title}`);
            write(`${DIM}   $ ${step.command}${RST}`);

            try {
              // Stream the step execution
              const res = await fetch(`${baseUrl}/api/devstudio/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
                body: JSON.stringify({ command: step.command }),
                signal: AbortSignal.timeout(60000),
              });

              if (!res.body) throw new Error('No stream');

              const reader = res.body.getReader();
              const decoder = new TextDecoder();
              let buf = '';
              const outputLines: string[] = [];

              while (true) {
                const { done: streamDone, value } = await reader.read();
                if (streamDone) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split('\n');
                buf = lines.pop() ?? '';
                for (const line of lines) {
                  if (!line.startsWith('data: ')) continue;
                  const payload = line.slice(6);
                  if (payload === '[DONE]') break;
                  try {
                    const { text } = JSON.parse(payload);
                    if (text) {
                      outputLines.push(text);
                      write(`   ${text}`);
                    }
                  } catch { /* skip */ }
                }
              }

              step.output = outputLines.join('\n');
              step.status = 'done';
              write(`${PASS}  Step ${step.order} complete: ${step.title}`);
              write('');

            } catch (err) {
              step.status = 'failed';
              step.error = err instanceof Error ? err.message : 'unknown';
              failedSteps++;
              write(`${FAIL}  Step ${step.order} failed: ${step.title} — ${step.error}`);
              write('');

              // Mark dependent steps as skipped
              plan.steps.forEach(s => {
                if (s.depends_on?.includes(step.id) && s.status === 'pending') {
                  s.status = 'skipped';
                  write(`${DIM}   Skipping step ${s.order} (${s.title}) — dependency failed${RST}`);
                }
              });
            }
          }
        }

        // Summary
        const doneCount    = plan.steps.filter(s => s.status === 'done').length;
        const skippedCount = plan.steps.filter(s => s.status === 'skipped').length;
        plan.status = failedSteps > 0 ? 'failed' : 'done';

        write('\x1b[1m── Plan Summary ─────────────────────────\x1b[0m');
        write(`${PASS}  Completed: ${doneCount}/${plan.steps.length} steps`);
        if (failedSteps > 0) write(`${FAIL}  Failed: ${failedSteps} steps`);
        if (skippedCount > 0) write(`${DIM}   Skipped: ${skippedCount} steps${RST}`);
        write(`${DIM}   Status: ${plan.status}${RST}`);

        await emitEvent('planner.completed', 'ai', {
          severity: failedSteps > 0 ? 'warning' : 'info',
          actor_id: auth.id,
          actor_type: 'ai',
          payload: { goal, plan_id: plan.id, done: doneCount, failed: failedSteps },
          message: `AI planner completed: ${goal} (${doneCount}/${plan.steps.length} steps)`,
        });

      } catch (err) {
        write(`\x1b[31m✗  Planner error: ${err instanceof Error ? err.message : 'unknown'}\x1b[0m`);
      } finally {
        try { controller.enqueue(done()); } catch { /* closed */ }
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
