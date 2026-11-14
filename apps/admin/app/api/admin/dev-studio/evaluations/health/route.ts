import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    let tablePassed = false;
    let tableMessage = 'Evaluation table unavailable.';
    try {
      const db = await requireAdminClient();
      const { error } = await db.from('platform_evaluation_runs').select('id').limit(1);
      tablePassed = !error;
      tableMessage = error ? 'Evaluation table query failed.' : 'Evaluation table query succeeded.';
    } catch {
      tableMessage = 'Evaluation table query failed.';
    }
    return buildCapabilityHealth('evaluations', [
      { name: 'evaluation-runs-table', passed: tablePassed, required: true, message: tableMessage },
    ]);
  });
}
