import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    let passed = false;
    let message = 'AI memory table unavailable.';
    try {
      const db = await requireAdminClient();
      const { error } = await db.from('ai_memory').select('id').limit(1);
      passed = !error;
      message = error ? error.message : 'AI memory table query succeeded.';
    } catch (error) {
      message = error instanceof Error ? error.message : 'AI memory table query failed.';
    }
    return buildCapabilityHealth('memory', [
      { name: 'ai-memory-table', passed, required: true, message },
    ]);
  });
}
