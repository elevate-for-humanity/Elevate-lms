import type { SupabaseClient } from '@supabase/supabase-js';
import type { CommandCenterSnapshot } from './types';

function isMissingTable(error: { code?: string } | null): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

async function countByStatus(db: SupabaseClient, table: string, status: string): Promise<number> {
  const { count, error } = await db
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('status', status);
  if (isMissingTable(error)) return 0;
  return count ?? 0;
}

export async function buildCommandCenterSnapshot(
  db: SupabaseClient,
  options?: { health?: Record<string, unknown> | null },
): Promise<CommandCenterSnapshot> {
  const health = options?.health ?? null;

  const [
    activeTasks,
    failedTasks,
    awaitingApproval,
    activeAgents,
    deploymentsRes,
    auditRes,
    buildRes,
  ] = await Promise.all([
    countByStatus(db, 'ai_tasks', 'running'),
    countByStatus(db, 'ai_tasks', 'failed'),
    countByStatus(db, 'ai_tasks', 'awaiting_approval'),
    countByStatus(db, 'ai_agents', 'busy'),
    db
      .from('ai_deployments')
      .select('id, service_name, status, created_at, health_status')
      .order('created_at', { ascending: false })
      .limit(5),
    db
      .from('dev_audit_logs')
      .select('id, action, resource_type, created_at')
      .order('created_at', { ascending: false })
      .limit(8),
    db
      .from('ai_tasks')
      .select('id, status, title, created_at, result_json')
      .in('status', ['completed', 'failed', 'running'])
      .order('created_at', { ascending: false })
      .limit(1),
  ]);

  const latestDeployments = isMissingTable(deploymentsRes.error)
    ? []
    : (deploymentsRes.data ?? []).map((row) => ({
        id: row.id,
        service_name: row.service_name,
        status: row.status,
        created_at: row.created_at,
        health_status: row.health_status,
      }));

  const recentAuditErrors = isMissingTable(auditRes.error)
    ? []
    : (auditRes.data ?? [])
        .filter((row) => row.action.includes('fail') || row.action.includes('error'))
        .slice(0, 5)
        .map((row) => ({
          id: row.id,
          action: row.action,
          resource_type: row.resource_type,
          created_at: row.created_at,
        }));

  const lastBuildRow = isMissingTable(buildRes.error) ? null : buildRes.data?.[0];
  const lastBuildKind =
    lastBuildRow?.result_json &&
    typeof lastBuildRow.result_json === 'object' &&
    'kind' in (lastBuildRow.result_json as object)
      ? String((lastBuildRow.result_json as { kind?: string }).kind ?? 'build')
      : 'build';

  const integrationPending: string[] = [];
  if (!health?.hasGitHub) integrationPending.push('GitHub token');
  if (!health?.hasGroq && !health?.hasGemini && !health?.hasOpenAI) {
    integrationPending.push('AI provider key');
  }
  if (!health?.supabaseServiceKeyPresent) integrationPending.push('Supabase service key');
  if (!process.env.NORTHFLANK_API_TOKEN) integrationPending.push('Northflank API token');

  return {
    activeTasks,
    failedTasks,
    awaitingApproval,
    latestDeployments,
    buildStatus: {
      lastBuild: lastBuildRow
        ? {
            id: lastBuildRow.id,
            status: lastBuildRow.status,
            kind: lastBuildKind,
          }
        : null,
      northflankConfigured: Boolean(process.env.NORTHFLANK_API_TOKEN),
    },
    health: {
      website: Boolean(health?.hasGitHub ?? health?.supabaseUrlPresent),
      lms: Boolean(health?.supabaseUrlPresent),
      database: Boolean(health?.supabaseServiceKeyPresent),
    },
    activeAgents,
    recentAuditErrors,
    integrationPending,
  };
}
