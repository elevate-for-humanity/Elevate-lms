import { NextRequest } from 'next/server';
import { buildCapabilityHealth } from '@/lib/devstudio/capability-health';
import { capabilityHealthResponse } from '@/lib/devstudio/health-response';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return capabilityHealthResponse(request, async () => {
    let passed = false;
    let message = 'AI task table unavailable.';
    try {
      const db = await requireAdminClient();
      const { error } = await db.from('ai_tasks').select('id').limit(1);
      passed = !error;
      message = error ? error.message : 'AI task table query succeeded.';
    } catch (error) {
      message = error instanceof Error ? error.message : 'AI task table query failed.';
    }
    return buildCapabilityHealth('tasks', [
      { name: 'ai-tasks-table', passed, required: true, message },
    ]);
  });
}
