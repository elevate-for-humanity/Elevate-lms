import { NextRequest } from 'next/server';

import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    let contentTablePassed = false;
    let contentMessage = 'Content table unavailable.';
    try {
      const db = await requireAdminClient();
      const { error } = await db.from('content').select('id').limit(1);
      contentTablePassed = !error;
      contentMessage = error ? error.message : 'Content table query succeeded.';
    } catch (err) {
      contentMessage = err instanceof Error ? err.message : 'Content table query failed.';
    }
    return buildCapabilityHealth('content', [
      { name: 'content-table', passed: contentTablePassed, required: true, message: contentMessage },
    ]);
  });
}
