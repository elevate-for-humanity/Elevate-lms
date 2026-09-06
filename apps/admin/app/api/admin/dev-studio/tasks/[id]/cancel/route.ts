import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { jsonOk } from '@/lib/devstudio/os/api-helpers';
import { writeDevAuditLog } from '@/lib/devstudio/os/audit';

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
    const { data: task } = await db.from('ai_tasks').select('*').eq('id', id).maybeSingle();
    if (!task) return safeError('Task not found', 404);
    const ownsTask = task.requested_by === auth.id || task.user_id === auth.id;
    if (!ownsTask && !auth.effectiveRoles.includes('super_admin'))
      return safeError('Forbidden', 403);
    if (['completed', 'failed', 'cancelled', 'rolled_back'].includes(task.status)) {
      return safeError(`Task is already ${task.status}`, 409);
    }

    const now = new Date().toISOString();
    await db
      .from('ai_tasks')
      .update({ status: 'cancelled', completed_at: now, updated_at: now })
      .eq('id', id);
    await db
      .from('ai_task_steps')
      .update({ status: 'skipped', completed_at: now })
      .eq('task_id', id)
      .in('status', ['pending', 'running', 'awaiting_approval']);
    await db
      .from('ai_approvals')
      .update({ status: 'rejected', decided_at: now, reviewed_by: auth.id, reviewed_at: now })
      .eq('task_id', id)
      .eq('status', 'pending');
    await db
      .from('ai_task_logs')
      .insert({
        task_id: id,
        level: 'warn',
        message: 'Task cancelled by administrator.',
        tenant_id: task.tenant_id ?? null,
        user_id: auth.id,
      });
    await writeDevAuditLog(db, {
      actorId: auth.id,
      action: 'task.cancel',
      resourceType: 'ai_tasks',
      resourceId: id,
      traceId: task.trace_id,
    });
    return jsonOk({ task: { ...task, status: 'cancelled', completed_at: now }, cancelled: true });
  } catch (error) {
    return safeInternalError(error, 'Failed to cancel task');
  }
}
