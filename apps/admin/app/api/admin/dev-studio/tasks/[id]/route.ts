import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { isMissingTable, jsonOk, tableNotReadyResponse } from '@/lib/devstudio/os/api-helpers';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const db = await requireAdminClient();
    const { data: task, error } = await db.from('ai_tasks').select('*').eq('id', id).maybeSingle();
    if (error) {
      if (isMissingTable(error)) return tableNotReadyResponse();
      throw error;
    }
    if (!task) return safeError('Task not found', 404);

    const [steps, logs, approvals] = await Promise.all([
      db
        .from('ai_task_steps')
        .select('*')
        .eq('task_id', id)
        .order('step_order', { ascending: true }),
      db
        .from('ai_task_logs')
        .select('*')
        .eq('task_id', id)
        .order('created_at', { ascending: true })
        .limit(200),
      db.from('ai_approvals').select('*').eq('task_id', id),
    ]);

    return jsonOk({
      task,
      steps: steps.data ?? [],
      logs: logs.data ?? [],
      approvals: approvals.data ?? [],
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to load task');
  }
}
