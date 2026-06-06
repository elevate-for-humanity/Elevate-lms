import { NextRequest } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { safeError, safeInternalError, safeOk } from '@/lib/api/safe-error';
import { withRuntime } from '@/lib/api/withRuntime';
import { requireAdminClient } from '@/lib/supabase/admin';
import { enqueueJob } from '@/lib/jobs/queue';

/**
 * POST /api/workspaces/deploy
 * Phase 2: enqueue Northflank build/deploy for a customer workspace.
 * Body: { workspaceId }
 */
async function _POST(request: NextRequest) {
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
      .select('id, tenant_id, slug, status')
      .eq('id', workspaceId)
      .maybeSingle();

    if (!workspace?.id) {
      return safeError('Workspace not found', 404);
    }

    const { data: deployment } = await db
      .from('workspace_deployments')
      .insert({
        workspace_id: workspace.id,
        status: 'queued',
        metadata: { requested_by: auth.id ?? null },
      } as Record<string, unknown>)
      .select('id')
      .maybeSingle();

    await enqueueJob({
      jobType: 'workspace_provision',
      correlationId: `workspace-deploy:${workspace.id}:${deployment?.id ?? 'new'}`,
      tenantId: workspace.tenant_id as string,
      payload: {
        workspace_id: workspace.id,
        action: 'deploy',
        deployment_id: deployment?.id ?? null,
      },
    });

    await db
      .from('customer_workspaces')
      .update({ status: 'provisioning', updated_at: new Date().toISOString() } as Record<string, unknown>)
      .eq('id', workspace.id);

    return safeOk({
      deploymentId: deployment?.id ?? null,
      status: 'queued',
      message: 'Deploy job queued (Northflank integration phase 2)',
    });
  } catch (err) {
    return safeInternalError(err, 'Failed to queue workspace deploy');
  }
}

export const POST = withRuntime(_POST);
