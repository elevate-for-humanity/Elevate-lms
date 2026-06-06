import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError, safeOk } from '@/lib/api/safe-error';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * DELETE /api/workspaces/delete
 * Body: { workspaceId }
 * Soft-archives workspace; hard delete of Northflank resources is phase 2.
 */
async function _DELETE(request: NextRequest) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const workspaceId = body.workspaceId as string | undefined;
    if (!workspaceId) {
      return safeError('workspaceId is required', 400);
    }

    const db = await requireAdminClient();
    const { data: workspace } = await db
      .from('customer_workspaces')
      .select('id, tenant_id')
      .eq('id', workspaceId)
      .maybeSingle();

    if (!workspace?.id) {
      return safeError('Workspace not found', 404);
    }

    await db
      .from('customer_workspaces')
      .update({
        status: 'archived',
        updated_at: new Date().toISOString(),
      } as Record<string, unknown>)
      .eq('id', workspace.id);

    return safeOk({ archived: true, workspaceId });
  } catch (err) {
    return safeInternalError(err, 'Failed to archive workspace');
  }
}

export const DELETE = withRuntime(_DELETE);
