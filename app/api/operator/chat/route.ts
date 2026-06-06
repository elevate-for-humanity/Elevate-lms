import { NextRequest } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeError, safeInternalError, safeOk } from '@/lib/api/safe-error';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/operator/chat
 * Foundation: records operator task; AI execution is phase 2.
 * Body: { workspaceId?, prompt }
 */
async function _POST(request: NextRequest) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
    if (!prompt) {
      return safeError('prompt is required', 400);
    }

    const db = await requireAdminClient();
    const { data: task } = await db
      .from('operator_tasks')
      .insert({
        workspace_id: body.workspaceId ?? null,
        created_by: auth.id,
        task_type: 'chat',
        status: 'queued',
        prompt,
        metadata: { phase: 1 },
      } as Record<string, unknown>)
      .select('id')
      .maybeSingle();

    return safeOk({
      taskId: task?.id ?? null,
      status: 'queued',
      message: 'Operator task recorded. Autonomous execution ships in phase 2.',
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to queue operator task');
  }
}

export const POST = withRuntime(_POST);
