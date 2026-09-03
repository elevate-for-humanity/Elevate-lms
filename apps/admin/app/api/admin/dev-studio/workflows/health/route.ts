import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    const checks: Array<{ name: string; passed: boolean; required: boolean; message: string }> = [];

    try {
      const db = await requireAdminClient();
      for (const table of ['workflows', 'workflow_steps', 'workflow_runs'] as const) {
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

    return buildCapabilityHealth('workflows', checks);
  });
}
