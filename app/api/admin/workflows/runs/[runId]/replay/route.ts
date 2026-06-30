/**
 * POST /api/admin/workflows/runs/[runId]/replay
 *
 * Re-executes a failed or cancelled workflow run using the original trigger payload.
 * Guards against double-fire: returns 409 if the workflow already has a 'running' run.
 *
 * Auth: admin / super_admin only.
 */
import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { requireAdminClient } from '@/lib/supabase/admin';
import { executeWorkflow } from '@/lib/workflows/engine';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ runId: string }> },
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { runId } = await params;
  const traceId = request.headers.get('x-trace-id') ?? 'no-trace';
  const db = await requireAdminClient();

  // Load the original run
  const { data: run, error: runErr } = await db
    .from('workflow_runs')
    .select('id, workflow_id, status, trigger_payload, triggered_by')
    .eq('id', runId)
    .single();

  if (runErr || !run) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 });
  }

  if (!['failed', 'cancelled'].includes(run.status)) {
    return NextResponse.json(
      { error: `Cannot replay a run with status '${run.status}'. Only failed or cancelled runs can be replayed.` },
      { status: 409 },
    );
  }

  // Concurrency guard: block if workflow already has an active run
  const { data: activeRun } = await db
    .from('workflow_runs')
    .select('id')
    .eq('workflow_id', run.workflow_id)
    .eq('status', 'running')
    .maybeSingle();

  if (activeRun) {
    return NextResponse.json(
      { error: 'Workflow already has an active run. Wait for it to complete before replaying.' },
      { status: 409 },
    );
  }

  logger.info('[workflow-replay] replaying failed run', {
    runId,
    workflowId: run.workflow_id,
    originalStatus: run.status,
    replayedBy: auth.profile?.id,
    trace_id: traceId,
  });

  const payload = (run.trigger_payload as Record<string, unknown>) ?? {};

  const result = await executeWorkflow(
    run.workflow_id,
    'manual',
    { ...payload, replayed_from: runId, replayed_by: auth.profile?.id },
    undefined,
    traceId,
  );

  return NextResponse.json({
    ok: true,
    newRunId: result.runId,
    status: result.status,
    stepsRun: result.stepsRun,
    error: result.error,
  });
}
