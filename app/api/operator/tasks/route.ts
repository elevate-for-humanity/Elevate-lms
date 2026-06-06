import { NextRequest } from 'next/server';
import { apiAuthGuard } from '@/lib/admin/guards';
import { safeInternalError, safeOk } from '@/lib/api/safe-error';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';

/**
 * GET /api/operator/tasks?workspaceId=
 */
async function _GET(request: NextRequest) {
  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  try {
    const workspaceId = new URL(request.url).searchParams.get('workspaceId');
    const db = await requireAdminClient();

    let query = db
      .from('operator_tasks')
      .select('id, task_type, status, prompt, result_summary, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(25);

    if (workspaceId) {
      query = query.eq('workspace_id', workspaceId);
    } else {
      query = query.eq('created_by', auth.id);
    }

    const { data: tasks } = await query;
    return safeOk({ tasks: tasks ?? [] });
  } catch (err) {
    return safeInternalError(err, 'Failed to list operator tasks');
  }
}

export const GET = withRuntime(_GET);
