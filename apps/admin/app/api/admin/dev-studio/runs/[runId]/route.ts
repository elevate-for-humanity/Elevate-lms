import { NextRequest, NextResponse } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeInternalError } from '@/lib/api/safe-error';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ runId: string }> },
) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;

  const { runId } = await context.params;
  if (!UUID.test(runId)) {
    return NextResponse.json({ error: 'Valid runId required' }, { status: 400 });
  }

  try {
    const db = await requireAdminClient();
    const { data: run, error: runError } = await db
      .from('studio_runs')
      .select('*')
      .eq('id', runId)
      .maybeSingle();
    if (runError) throw runError;
    if (!run) return NextResponse.json({ error: 'Studio run not found' }, { status: 404 });

    const isAdmin = auth.effectiveRoles.some((role: string) =>
      ['admin', 'super_admin'].includes(role),
    );
    if (!isAdmin && run.user_id !== auth.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const stepsResult = await db
      .from('studio_run_steps')
      .select('*')
      .eq('run_id', runId)
      .order('ordinal', { ascending: true });
    if (stepsResult.error) throw stepsResult.error;
    const stepIds = (stepsResult.data ?? []).map((step) => step.id);

    const [dependenciesResult, eventsResult, artifactsResult, tasksResult] = await Promise.all([
      stepIds.length
        ? db
            .from('studio_run_step_dependencies')
            .select('step_id,depends_on_step_id')
            .in('step_id', stepIds)
        : Promise.resolve({ data: [], error: null }),
      db
        .from('studio_run_events')
        .select('*')
        .eq('run_id', runId)
        .order('id', { ascending: true })
        .limit(500),
      db
        .from('studio_run_artifacts')
        .select('*')
        .eq('run_id', runId)
        .order('created_at', { ascending: true }),
      db
        .from('ai_tasks')
        .select(
          'id,studio_run_step_id,title,status,tool_name,requires_approval,approval_status,error_message,attempts,max_attempts,created_at,started_at,completed_at',
        )
        .eq('studio_run_id', runId)
        .order('created_at', { ascending: true }),
    ]);

    const error =
      dependenciesResult.error ||
      eventsResult.error ||
      artifactsResult.error ||
      tasksResult.error;
    if (error) throw error;

    return NextResponse.json({
      run,
      steps: stepsResult.data ?? [],
      dependencies: dependenciesResult.data ?? [],
      events: eventsResult.data ?? [],
      artifacts: artifactsResult.data ?? [],
      tasks: tasksResult.data ?? [],
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load Studio run');
  }
}
