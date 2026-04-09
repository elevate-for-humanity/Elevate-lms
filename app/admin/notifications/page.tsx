import { Metadata } from 'next';
import { requireAdmin } from '@/lib/auth';
import { getAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Bell, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import NotificationBroadcastForm from './NotificationBroadcastForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Notifications | Admin',
};

const STATUS_STYLES: Record<string, string> = {
  sent:    'bg-emerald-100 text-emerald-800',
  failed:  'bg-red-100 text-red-800',
  pending: 'bg-amber-100 text-amber-800',
};
const STATUS_ICON: Record<string, React.ElementType> = {
  sent:    CheckCircle,
  failed:  XCircle,
  pending: Clock,
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const db = await getAdminClient();

  const [logsRes, statsRes] = await Promise.all([
    db.from('notification_logs')
      .select('id, title, body, type, status, sent_at, error_message, user_id')
      .order('sent_at', { ascending: false })
      .limit(50),
    db.from('notification_logs')
      .select('status'),
  ]);

  const logs = logsRes.data ?? [];
  const stats = statsRes.data ?? [];
  const totalSent   = stats.filter(r => r.status === 'sent').length;
  const totalFailed = stats.filter(r => r.status === 'failed').length;
  const total       = stats.length;

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-8 px-4 sm:px-6 lg:px-8">

      {/* Breadcrumb + title */}
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Notifications</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
        <p className="text-sm text-slate-500 mt-1">Broadcast push notifications and view delivery history</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Sent',   value: totalSent,   color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Failed',       value: totalFailed, color: 'text-red-600',     bg: 'bg-red-50' },
          { label: 'All Time',     value: total,       color: 'text-slate-700',   bg: 'bg-slate-100' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className={`w-8 h-8 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
              <Bell className={`w-4 h-4 ${k.color}`} />
            </div>
            <p className="text-2xl font-bold text-slate-900 tabular-nums">{k.value.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-1 font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">

        {/* Broadcast form — client component */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-slate-400" /> Send Broadcast
            </h2>
          </div>
          <div className="p-6">
            <NotificationBroadcastForm />
          </div>
        </div>

        {/* Delivery history */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" /> Recent Deliveries
            </h2>
          </div>
          {logs.length === 0 ? (
            <div className="py-12 text-center">
              <Bell className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No notifications sent yet</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50 max-h-[520px] overflow-y-auto">
              {logs.map(log => {
                const Icon = STATUS_ICON[log.status] ?? Clock;
                return (
                  <div key={log.id} className="px-5 py-3.5 flex items-start gap-3">
                    <span className={`mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold flex-shrink-0 ${STATUS_STYLES[log.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      <Icon className="w-3 h-3" />
                      {log.status}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">{log.title ?? '—'}</p>
                      {log.body && <p className="text-xs text-slate-500 truncate mt-0.5">{log.body}</p>}
                      {log.error_message && <p className="text-xs text-red-500 truncate mt-0.5">{log.error_message}</p>}
                    </div>
                    <p className="text-xs text-slate-400 flex-shrink-0 whitespace-nowrap">
                      {log.sent_at ? fmtDate(log.sent_at) : '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
