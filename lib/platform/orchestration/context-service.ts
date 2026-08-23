import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { getRAGContext } from '@/lib/platform/rag';

export type SharedContext = {
  goal: string;
  tenantId?: string;
  userId?: string;
  workflowMemory: Array<Record<string, unknown>>;
  recentToolResults: Array<Record<string, unknown>>;
  retrievalContext: string;
  provenance: Array<{ source: string; id?: string; timestamp?: string | null }>;
};

export async function loadSharedContext(input: {
  goal: string;
  tenantId?: string;
  userId?: string;
  workflowLimit?: number;
}): Promise<SharedContext> {
  const db = await requireAdminClient();
  const workflowLimit = Math.max(1, Math.min(input.workflowLimit ?? 8, 20));

  let runsQuery = db
    .from('workflow_runs')
    .select('id,workflow_id,status,triggered_by,steps_total,steps_done,retry_count,error_message,started_at,completed_at,trigger_payload')
    .order('started_at', { ascending: false })
    .limit(workflowLimit);

  if (input.tenantId) runsQuery = runsQuery.eq('tenant_id', input.tenantId);

  const { data: runs } = await runsQuery;
  const runIds = (runs ?? []).map((run) => String(run.id)).filter(Boolean);

  let recentToolResults: Array<Record<string, unknown>> = [];
  if (runIds.length) {
    const { data: logs } = await db
      .from('workflow_step_logs')
      .select('run_id,step_id,step_order,action_type,status,output,error_message,duration_ms,attempts,created_at')
      .in('run_id', runIds)
      .order('created_at', { ascending: false })
      .limit(30);
    recentToolResults = (logs ?? []) as Array<Record<string, unknown>>;
  }

  const retrievalContext = await getRAGContext(input.goal);
  const provenance = [
    ...(runs ?? []).map((run) => ({
      source: 'workflow_runs',
      id: String(run.id),
      timestamp: run.started_at ?? null,
    })),
    ...recentToolResults.slice(0, 10).map((log) => ({
      source: 'workflow_step_logs',
      id: String(log.step_id ?? ''),
      timestamp: typeof log.created_at === 'string' ? log.created_at : null,
    })),
  ];

  return {
    goal: input.goal,
    tenantId: input.tenantId,
    userId: input.userId,
    workflowMemory: (runs ?? []) as Array<Record<string, unknown>>,
    recentToolResults,
    retrievalContext,
    provenance,
  };
}
