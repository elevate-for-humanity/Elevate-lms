import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { executeWorkflow } from '@/lib/workflows/engine';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logAdminAudit, AdminAction } from '@/lib/admin/audit-log';

export const dynamic = 'force-dynamic';

// POST /api/admin/workflows/run — manually trigger a workflow
export async function POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'strict');
  if (limited) return limited;

  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const body = await request.json();
  const { workflow_id, payload } = body;
  if (!workflow_id) return NextResponse.json({ error: 'workflow_id required' }, { status: 400 });

  const result = await executeWorkflow(workflow_id, 'manual', payload ?? {});

  logAdminAudit({ action: AdminAction.WORKFLOW_RUN, actorId: auth.id, entityType: 'workflows', entityId: workflow_id, metadata: { run_id: result.runId, status: result.status, steps_run: result.stepsRun }, req: request }).catch(() => {});

  return NextResponse.json(result, { status: result.status === 'failed' ? 500 : 200 });
}
