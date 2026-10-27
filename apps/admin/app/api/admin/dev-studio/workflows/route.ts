import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { buildCommandCenterSnapshot } from '@/lib/devstudio/os/command-center';
import { indexRepository, searchRepoIndex } from '@/lib/devstudio/os/repo-indexer';
import { jsonOk } from '@/lib/devstudio/os/api-helpers';
import { resolveTenantIdForUser } from '@/lib/platform/resolve-tenant-for-user';
import { approveWorkflowRepair, WorkflowRepairError } from '@/lib/control-plane/workflow-repairs';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const view = request.nextUrl.searchParams.get('view');

  try {
    const db = await requireAdminClient();

    if (view === 'workflow-repairs') {
      const tenantId = await resolveTenantIdForUser(auth.id);
      if (!auth.effectiveRoles.includes('super_admin') && !tenantId) {
        return jsonOk({workflowRepairs: []});
      }
      let query = db.from('platform_control_actions')
        .select('id,tenant_id,target_service,status,approval_status,parameters,result,error_message,triggered_at,completed_at')
        .eq('action_type', 'workflow_repair').order('triggered_at', {ascending: false}).limit(50);
      if (!auth.effectiveRoles.includes('super_admin')) query = query.eq('tenant_id', tenantId);
      const repairs = await query;
      if (repairs.error) throw repairs.error;
      const incidentIds = (repairs.data ?? []).map(row => row.parameters?.incident_id)
        .filter((id): id is string => typeof id === 'string');
      let incidentQuery = db.from('platform_incidents').select('id,tenant_id,title,description,status')
        .in('id', incidentIds);
      if (!auth.effectiveRoles.includes('super_admin')) incidentQuery = incidentQuery.eq('tenant_id', tenantId);
      const incidents = incidentIds.length ? await incidentQuery : {data: [], error: null};
      if (incidents.error) throw incidents.error;
      const workflowRepairs = (repairs.data ?? []).map(action => ({
        ...action,
        incident: (incidents.data ?? []).find(incident =>
          incident.id === action.parameters?.incident_id && incident.tenant_id === action.tenant_id) ?? null,
      }));
      return jsonOk({workflowRepairs}, {headers: {'cache-control': 'no-store'}});
    }

    // Return workflows from ai_tasks table
    const { data: workflows, error: workflowsError } = await db
      .from('ai_tasks')
      // Listing full tool outputs recursively embeds earlier inspections in the
      // next task and planner checkpoint. Keep evidence on its original task.
      .select('id,title,status,priority,agent_type,tool_name,attempts,max_attempts,requires_approval,approval_status,studio_run_id,created_at,updated_at,started_at,completed_at')
      .order('created_at', { ascending: false })
      .limit(50);

    if (workflowsError) {
      console.error('Error fetching workflows:', workflowsError);
      // Return empty workflows if table doesn't exist yet
      return jsonOk({ workflows: [], message: 'ai_tasks table not found' });
    }

    if (view === 'repo-search') {
      const q = request.nextUrl.searchParams.get('q') ?? '';
      const results = await searchRepoIndex(db, q);
      return jsonOk({ results });
    }

    let health: Record<string, unknown> | null = null;
    try {
      const healthRes = await fetch(new URL('/api/admin/dev-studio/health', request.url), {
        headers: { cookie: request.headers.get('cookie') ?? '' },
      });
      if (healthRes.ok) health = await healthRes.json();
    } catch {
      health = null;
    }

    const snapshot = await buildCommandCenterSnapshot(db, { health });
    return jsonOk({ workflows: workflows || [], snapshot });
  } catch (err) {
    return safeInternalError(err, 'Failed to load command center');
  }
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json().catch(() => ({}));
    if (body.action === 'approve-workflow-repair') {
      if (typeof body.actionId !== 'string' ||
          !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(body.actionId)) {
        return safeError('A valid workflow repair action ID is required.', 400);
      }
      const db = await requireAdminClient();
      const tenantId = await resolveTenantIdForUser(auth.id);
      const result = await approveWorkflowRepair(db, body.actionId, {
        actorId: auth.id, actorRoles: auth.effectiveRoles, tenantId,
      });
      return jsonOk({approved: true, ...result}, {
        status: ['verified', 'blocked'].includes(result.status) ? 200 : 202,
        headers: {'cache-control': 'no-store'},
      });
    }
    if (body.action === 'index-repo') {
      const db = await requireAdminClient();
      const result = await indexRepository(db, {
        maxFiles: typeof body.maxFiles === 'number' ? body.maxFiles : 400,
      });
      return jsonOk({ result });
    }

    return safeError('Unknown action', 400);
  } catch (err) {
    if (err instanceof WorkflowRepairError) return safeError(err.message, err.status);
    return safeInternalError(err, 'Workflow action failed');
  }
}
