import 'server-only';

import { requireAdminClient } from '@/lib/supabase/admin';
import { getRAGContext } from '@/lib/platform/rag';

export type SharedContext = {
  goal: string;
  tenantId?: string;
  userId?: string;
  shortTermMemory: Array<Record<string, unknown>>;
  operationalMemory: Array<Record<string, unknown>>;
  workflowMemory: Array<Record<string, unknown>>;
  recentToolResults: Array<Record<string, unknown>>;
  retrievalContext: string;
  provenance: Array<{ source: string; id?: string; timestamp?: string | null }>;
};

/**
 * Read-only composition facade over the canonical memory authorities already
 * present in Elevate: ai_memory, ai_operational_memory, workflow history, and
 * pgvector RAG. This module does not own a competing memory store.
 */
export async function loadSharedContext(input: {
  goal: string;
  tenantId?: string;
  userId?: string;
  workflowLimit?: number;
  memoryLimit?: number;
}): Promise<SharedContext> {
  const db = await requireAdminClient();
  const workflowLimit = Math.max(1, Math.min(input.workflowLimit ?? 8, 20));
  const memoryLimit = Math.max(1, Math.min(input.memoryLimit ?? 12, 40));

  let runsQuery = db
    .from('workflow_runs')
    .select('id,workflow_id,status,triggered_by,steps_total,steps_done,retry_count,error_message,started_at,completed_at,trigger_payload')
    .order('started_at', { ascending: false })
    .limit(workflowLimit);
  if (input.tenantId) runsQuery = runsQuery.eq('tenant_id', input.tenantId);

  let memoryQuery = db
    .from('ai_memory')
    .select('id,scope,key,content,agent_id,task_id,metadata,tenant_id,user_id,updated_at')
    .order('updated_at', { ascending: false })
    .limit(memoryLimit);
  if (input.tenantId) memoryQuery = memoryQuery.eq('tenant_id', input.tenantId);
  if (input.userId) memoryQuery = memoryQuery.or(`user_id.eq.${input.userId},user_id.is.null`);

  let operationalQuery = db
    .from('ai_operational_memory')
    .select('id,task_type,context_key,prompt,result,provider,tokens_used,tenant_id,created_by,created_at,expires_at')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(memoryLimit);
  if (input.tenantId) operationalQuery = operationalQuery.eq('tenant_id', input.tenantId);

  const [{ data: runs }, { data: memories }, { data: operational }] = await Promise.all([
    runsQuery,
    memoryQuery,
    operationalQuery,
  ]);

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
    ...(memories ?? []).map((memory) => ({
      source: 'ai_memory',
      id: String(memory.id),
      timestamp: memory.updated_at ?? null,
    })),
    ...(operational ?? []).map((memory) => ({
      source: 'ai_operational_memory',
      id: String(memory.id),
      timestamp: memory.created_at ?? null,
    })),
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
    ...(retrievalContext ? [{ source: 'platform_knowledge_chunks' }] : []),
  ];

  return {
    goal: input.goal,
    tenantId: input.tenantId,
    userId: input.userId,
    shortTermMemory: (memories ?? []) as Array<Record<string, unknown>>,
    operationalMemory: (operational ?? []) as Array<Record<string, unknown>>,
    workflowMemory: (runs ?? []) as Array<Record<string, unknown>>,
    recentToolResults,
    retrievalContext,
    provenance,
  };
}
