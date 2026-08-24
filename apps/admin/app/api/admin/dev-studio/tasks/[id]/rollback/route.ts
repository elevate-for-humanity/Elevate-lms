import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeInternalError } from '@/lib/api/safe-error';
import { rollbackTask } from '@/lib/devstudio/os/task-runner';
import { jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const db = await requireAdminClient();
    await rollbackTask(db, id, auth.id);
    const { data: task } = await db.from('ai_tasks').select('*').eq('id', id).single();
    return jsonOk({ task, rolledBack: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('not found')) return tableNotReadyResponse();
    return safeInternalError(err, 'Failed to rollback task');
  }
}
