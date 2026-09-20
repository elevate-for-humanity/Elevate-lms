import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getAITool, listAIToolsForAgent } from '@/lib/ai/tools/registry';
import { planAIToolFromCommand } from '@/lib/ai/tools/planner';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const checks: Array<{ name: string; passed: boolean; required: boolean; message: string }> = [];

    try {
      const db = await requireAdminClient();
      for (const table of [
        'workflows',
        'workflow_steps',
        'workflow_runs',
        'ai_tasks',
        'ai_task_steps',
        'ai_task_logs',
      ] as const) {
        const { error } = await db.from(table).select('id').limit(1);
        checks.push({
          name: table,
          passed: !error,
          required: true,
          message: error ? `${table} query failed.` : `${table} query succeeded.`,
        });
      }
    } catch {
      checks.push({
        name: 'workflow-database',
        passed: false,
        required: true,
        message: 'Workflow database check failed.',
      });
    }

    const tools = listAIToolsForAgent('LIZZY');
    const healthPlan = planAIToolFromCommand('check system health');
    const plannedTool = healthPlan ? getAITool(healthPlan.name) : null;
    checks.push({
      name: 'workflow-tool-registry',
      passed: tools.length > 0,
      required: true,
      message: tools.length > 0
        ? `${tools.length} governed workflow tools are registered.`
        : 'No governed workflow tools are registered.',
    });
    checks.push({
      name: 'workflow-command-planner',
      passed: plannedTool?.name === 'system.health',
      required: true,
      message: plannedTool?.name === 'system.health'
        ? 'Command planner resolves into the canonical execution registry.'
        : 'Command planner is disconnected from the canonical execution registry.',
    });

    return buildCapabilityHealth('workflows', checks);
  });
}
