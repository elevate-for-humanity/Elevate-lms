import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    let workflowsTablePassed = false;
    let workflowsMessage = 'Workflows table unavailable.';
    try {
      const db = await requireAdminClient();
      const { error } = await db.from('studio_workflows').select('id').limit(1);
      workflowsTablePassed = !error;
      workflowsMessage = error ? error.message : 'Workflows table query succeeded.';
    } catch (err) {
      workflowsMessage = err instanceof Error ? err.message : 'Workflows table query failed.';
    }
    return buildCapabilityHealth('workflows', [
      { name: 'studio-workflows-table', passed: workflowsTablePassed, required: true, message: workflowsMessage },
    ]);
  });
}
