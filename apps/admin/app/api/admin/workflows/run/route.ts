import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { executeWorkflow } from '@/lib/workflows/engine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  let auth: Awaited<ReturnType<typeof apiRequireAdmin>>;
  try {
    auth = await apiRequireAdmin(request);
  } catch (error) {
    return error instanceof Response
      ? error
      : NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => null);
  const workflowId = body?.workflow_id;
  if (!workflowId || typeof workflowId !== 'string') {
    return NextResponse.json({ error: 'workflow_id is required' }, { status: 400 });
  }

  try {
    const result = await executeWorkflow(
      workflowId,
      'manual',
      body?.trigger_payload && typeof body.trigger_payload === 'object'
        ? body.trigger_payload
        : {},
    );

    return NextResponse.json({
      runId: result.runId,
      status: result.status,
      stepsRun: result.stepsRun,
      error: result.error,
    }, { status: result.status === 'failed' ? 422 : 200 });
  } catch (error) {
    console.error('[admin/workflows/run] execution failed', error);
    return NextResponse.json({ error: 'Workflow execution failed' }, { status: 500 });
  }
}
