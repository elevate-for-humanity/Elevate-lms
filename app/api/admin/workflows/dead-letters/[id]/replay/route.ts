/**
 * POST /api/admin/workflows/dead-letters/[id]/replay
 *
 * Re-queues a dead-letter step by re-triggering its parent workflow
 * with the original payload. Marks the dead-letter row as 'replayed'
 * so it no longer appears in the active dead-letter queue.
 *
 * Auth: admin / admin only.
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
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await apiRequireAdmin(request);
  if (auth.error) return auth.error;

  const { id } = await params;
  const traceId = request.headers.get('x-trace-id') ?? 'no-trace';
  const db = await requireAdminClient();

  // Load the dead letter
  const { data: dl, error: dlErr } = await db
    .from('workflow_dead_letters')
    .select('id, workflow_id, run_id, action_type, action_config, payload, attempts, last_error')
    .eq('id', id)
    .single();

  if (dlErr || !dl) {
    return NextResponse.json({ error: 'Dead letter not found' }, { status: 404 });
  }

  if (!dl.workflow_id) {
    return NextResponse.json(
      { error: 'Dead letter has no associated workflow_id — cannot replay automatically.' },
      { status: 422 },
    );
  }

  // Concurrency guard
  const { data: activeRun } = await db
    .from('workflow_runs')
    .select('id')
    .eq('workflow_id', dl.workflow_id)
    .eq('status', 'running')
    .maybeSingle();

  if (activeRun) {
    return NextResponse.json(
      { error: 'Workflow already has an active run. Wait for it to complete before replaying.' },
      { status: 409 },
    );
  }

  logger.info('[dead-letter-replay] replaying dead letter', {
    deadLetterId: id,
    workflowId: dl.workflow_id,
    actionType: dl.action_type,
    originalAttempts: dl.attempts,
    replayedBy: auth.profile?.id,
    trace_id: traceId,
  });

  const payload = (dl.payload as Record<string, unknown>) ?? {};

  const result = await executeWorkflow(
    dl.workflow_id,
    'manual',
    { ...payload, dead_letter_replay: true, dead_letter_id: id, replayed_by: auth.profile?.id },
    undefined,
    traceId,
  );

  // Mark dead letter as replayed
  await db
    .from('workflow_dead_letters')
    .update({ replayed_at: new Date().toISOString(), replayed_by: auth.profile?.id } as any)
    .eq('id', id)
    .then(undefined, (err) =>
      logger.warn('[dead-letter-replay] Failed to mark dead letter as replayed', { id, error: String(err) }),
    );

  return NextResponse.json({
    ok: true,
    newRunId: result.runId,
    status: result.status,
    stepsRun: result.stepsRun,
    error: result.error,
  });
}
