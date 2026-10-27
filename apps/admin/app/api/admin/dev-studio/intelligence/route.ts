import { NextRequest } from 'next/server';
import { apiRequireDevStudio } from '@/lib/devstudio/api-auth';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { jsonOk } from '@/lib/devstudio/os/api-helpers';
import { safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireDevStudio(request);
  if (auth.error) return auth.error;
  try {
    const db = await requireAdminClient();
    const [risk, tasks, alerts] = await Promise.all([
      db
        .from('student_risk_status')
        .select('id,user_id,status,risk_score,days_since_activity,overdue_count', {
          count: 'exact',
        })
        .in('status', ['watch', 'at_risk', 'critical'])
        .order('risk_score', { ascending: false })
        .limit(12),
      db
        .from('ai_tasks')
        .select('id,title,status,error_message,tool_name,updated_at', { count: 'exact' })
        .eq('status', 'failed')
        .order('updated_at', { ascending: false })
        .limit(12),
      db
        .from('admin_alerts')
        .select('id,alert_type,severity,message,created_at', { count: 'exact' })
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(12),
    ]);
    const riskRows = risk.data ?? [];
    const taskRows = tasks.data ?? [];
    const alertRows = alerts.data ?? [];
    const findings = [
      ...taskRows.map((row) => ({
        id: row.id,
        kind: 'workflow' as const,
        title: row.title || 'Failed AI workflow',
        detail:
          row.error_message ||
          `${row.tool_name || 'Workflow'} requires diagnosis and verified repair.`,
        severity: 'high',
      })),
      ...riskRows.map((row) => ({
        id: row.id,
        kind: 'learner' as const,
        title: `Learner risk score ${row.risk_score ?? 'unknown'}`,
        detail: `${row.days_since_activity ?? 0} inactive days · ${row.overdue_count ?? 0} overdue items · status ${row.status}.`,
        severity: row.status === 'critical' ? 'critical' : 'medium',
      })),
      ...alertRows.map((row) => ({
        id: row.id,
        kind: 'alert' as const,
        title: String(row.alert_type || 'Operational alert').replaceAll('_', ' '),
        detail: row.message || 'Review the alert evidence and resolve the underlying condition.',
        severity: row.severity || 'medium',
      })),
    ].slice(0, 24);
    return jsonOk({
      counts: {
        atRisk: risk.count ?? riskRows.length,
        failedTasks: tasks.count ?? taskRows.length,
        alerts: alerts.count ?? alertRows.length,
      },
      findings,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    return safeInternalError(error, 'Failed to load unified intelligence');
  }
}
