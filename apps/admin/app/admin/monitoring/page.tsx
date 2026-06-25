import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, AlertTriangle, CheckCircle, Activity, Shield, ExternalLink } from 'lucide-react';
import MonitoringClient from './MonitoringClient';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Monitoring | Admin | Elevate For Humanity' };

export default async function MonitoringPage() {
  await requireRole(['admin']);
  const db = await requireAdminClient();

  const [
    { count: totalAlerts },
    { count: openAlerts },
    { count: actionRequired },
    { data: recentAlerts },
  ] = await Promise.all([
    db.from('monitoring_alerts').select('*', { count: 'exact', head: true }),
    db.from('monitoring_alerts').select('*', { count: 'exact', head: true }).eq('status', 'open'),
    db.from('monitoring_alerts').select('*', { count: 'exact', head: true }).eq('action_required', true).neq('status', 'resolved'),
    db.from('monitoring_alerts')
      .select('id, source, alert_title, alert_description, severity, status, action_required, created_at')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const stats = [
    { label: 'Open Alerts', value: openAlerts ?? 0, icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Action Required', value: actionRequired ?? 0, icon: Shield, color: 'text-red-600', bg: 'bg-red-50' },
    { label: 'Total Alerts', value: totalAlerts ?? 0, icon: Activity, color: 'text-slate-600', bg: 'bg-slate-100' },
  ];

  const SEVERITY_STYLES: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high:     'bg-orange-100 text-orange-700',
    medium:   'bg-amber-100 text-amber-700',
    low:      'bg-slate-100 text-slate-600',
    info:     'bg-blue-100 text-blue-700',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Monitoring</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Monitoring</h1>
            <p className="text-sm text-slate-500 mt-1">Platform alerts, error tracking, and schema health</p>
          </div>
          <div className="flex gap-2">
            <Link href="/admin/system-health"
              className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> System Health
            </Link>
            <Link href="/admin/audit-logs"
              className="flex items-center gap-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
              <ExternalLink className="w-3.5 h-3.5" /> Audit Logs
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                <Icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Schema health check */}
      <MonitoringClient />

      {/* Alert table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-semibold text-slate-800">Recent Alerts</h2>
          {(openAlerts ?? 0) > 0 && (
            <span className="text-xs font-medium bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
              {openAlerts} open
            </span>
          )}
        </div>
        {!recentAlerts?.length ? (
          <div className="text-center py-12">
            <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No alerts recorded</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['Source', 'Alert', 'Severity', 'Status', 'Action', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentAlerts.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{a.source ?? '—'}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800 text-xs">{a.alert_title}</p>
                    {a.alert_description && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{a.alert_description}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${SEVERITY_STYLES[a.severity] ?? 'bg-slate-100 text-slate-600'}`}>
                      {a.severity ?? 'unknown'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${
                      a.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      a.status === 'open' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>{a.status ?? 'unknown'}</span>
                  </td>
                  <td className="px-4 py-3">
                    {a.action_required
                      ? <span className="text-xs font-semibold text-red-600">Required</span>
                      : <span className="text-xs text-slate-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {a.created_at ? new Date(a.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
