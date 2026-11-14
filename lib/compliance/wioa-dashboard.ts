import 'server-only';
import type { createClient } from '@/lib/supabase/server';
import type { WIOADashboardProps } from '@/components/admin/WIOAComplianceDashboard';

export async function loadWioaDashboard(db: Awaited<ReturnType<typeof createClient>>): Promise<WIOADashboardProps> {
  const participantCount = (column?: string) => {
    const query = db.from('wioa_participants').select('id', { count: 'exact', head: true });
    return column ? query.eq(column, true) : query;
  };
  const [total, veterans, dislocated, lowIncome, youth, reports, alerts] = await Promise.all([
    participantCount(), participantCount('is_veteran'), participantCount('is_dislocated_worker'),
    participantCount('is_low_income'), participantCount('is_youth'),
    db.from('wioa_compliance_reports').select('report_type,due_date,status').order('due_date', { ascending: true }).limit(20),
    db.from('compliance_alerts').select('id,alert_type,severity,message,description').eq('resolved', false).order('created_at', { ascending: false }).limit(20),
  ]);
  if ([total, veterans, dislocated, lowIncome, youth, reports, alerts].some((result) => result.error)) {
    throw new Error('WIOA_DASHBOARD_UNAVAILABLE');
  }
  if ([total, veterans, dislocated, lowIncome, youth].some((result) => result.count == null)) {
    throw new Error('WIOA_PARTICIPANT_COUNTS_UNAVAILABLE');
  }
  return {
    participants: {
      total: total.count!, veterans: veterans.count!, dislocatedWorkers: dislocated.count!,
      lowIncome: lowIncome.count!, youth: youth.count!,
      // There is no participant -> placement/enrollment FK. Do not invent an
      // outcome relation or treat enrollment completion as an earned credential.
      placements: null, completions: null,
    },
    reports: (reports.data ?? []).map((report) => ({
      reportType: report.report_type, dueDate: report.due_date, status: report.status ?? 'unknown',
    })),
    alerts: (alerts.data ?? []).map((alert) => ({
      id: alert.id, type: alert.alert_type, severity: alert.severity,
      message: alert.message || alert.description || 'Compliance alert',
    })),
  };
}
