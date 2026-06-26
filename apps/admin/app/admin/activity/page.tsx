import type React from 'react';
import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Activity, Shield, Users, BookOpen, FileText,
  DollarSign, Award, AlertCircle, CheckCircle, Clock,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Activity Feed | Admin',
  description: 'Real-time activity feed across all system events.',
};

export const revalidate = 0;

const EVENT_ICON: Record<string, React.ElementType> = {
  enrollment:   BookOpen,
  application:  FileText,
  payment:      DollarSign,
  certificate:  Award,
  user:         Users,
  compliance:   Shield,
  error:        AlertCircle,
  completion:   CheckCircle,
};

const EVENT_COLOR: Record<string, string> = {
  enrollment:  'bg-blue-100 text-blue-700',
  application: 'bg-amber-100 text-amber-700',
  payment:     'bg-green-100 text-green-700',
  certificate: 'bg-purple-100 text-purple-700',
  user:        'bg-slate-100 text-slate-700',
  compliance:  'bg-red-100 text-red-700',
  error:       'bg-red-100 text-red-700',
  completion:  'bg-emerald-100 text-emerald-700',
};

function formatRelative(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function eventCategory(action: string, resourceType: string): string {
  const a = (action ?? '').toLowerCase();
  const r = (resourceType ?? '').toLowerCase();
  if (r.includes('enrollment') || a.includes('enroll')) return 'enrollment';
  if (r.includes('application') || a.includes('apply')) return 'application';
  if (r.includes('payment') || r.includes('invoice') || a.includes('pay')) return 'payment';
  if (r.includes('certificate') || a.includes('certif')) return 'certificate';
  if (r.includes('completion') || a.includes('complet')) return 'completion';
  if (r.includes('compliance') || a.includes('compli')) return 'compliance';
  if (a.includes('error') || a.includes('fail')) return 'error';
  return 'user';
}

export default async function ActivityPage() {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();

  const [logsRes, countRes, enrollRes, appRes] = await Promise.all([
    db
      .from('audit_logs')
      .select('id, action, actor_id, actor_email, actor_role, resource_type, resource_id, event_type, ip_address, created_at, metadata, details')
      .order('created_at', { ascending: false })
      .limit(200),
    db.from('audit_logs').select('id', { count: 'exact', head: true }),
    db.from('enrollments').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
    db.from('applications').select('id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 86400000).toISOString()),
  ]);

  const logs = logsRes.data ?? [];
  const totalEvents = countRes.count ?? 0;
  const todayEnrollments = enrollRes.count ?? 0;
  const todayApplications = appRes.count ?? 0;

  // Hydrate actor names
  const actorIds = [...new Set(logs.filter((l: any) => l.actor_id && !l.actor_email).map((l: any) => l.actor_id))];
  const { data: actors } = actorIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', actorIds)
    : { data: [] };
  const actorMap = Object.fromEntries((actors ?? []).map((a: any) => [a.id, a]));

  // Category counts for summary
  const categoryCounts: Record<string, number> = {};
  for (const log of logs) {
    const cat = eventCategory(log.action, log.resource_type);
    categoryCounts[cat] = (categoryCounts[cat] ?? 0) + 1;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Activity Feed' }]} />
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Activity Feed</h1>
              <p className="text-sm text-slate-500">{totalEvents.toLocaleString()} total events logged</p>
            </div>
          </div>
          <Link
            href="/admin/audit-logs"
            className="text-sm text-blue-600 hover:underline font-medium"
          >
            Full Audit Log →
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* Summary strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Events', value: totalEvents.toLocaleString(), icon: Activity, color: 'text-blue-600' },
            { label: 'Enrollments Today', value: todayEnrollments.toString(), icon: BookOpen, color: 'text-emerald-600' },
            { label: 'Applications Today', value: todayApplications.toString(), icon: FileText, color: 'text-amber-600' },
            { label: 'Showing', value: `${logs.length} recent`, icon: Clock, color: 'text-slate-600' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white rounded-xl border border-slate-200 px-4 py-4 flex items-center gap-3">
              <Icon className={`w-5 h-5 ${color} shrink-0`} />
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-lg font-bold text-slate-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          {Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
            <span
              key={cat}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${EVENT_COLOR[cat] ?? 'bg-slate-100 text-slate-700'}`}
            >
              {cat} <span className="opacity-70">({count})</span>
            </span>
          ))}
        </div>

        {/* Event feed */}
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
          {logs.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Activity className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No activity recorded yet.</p>
            </div>
          ) : (
            logs.map((log: any) => {
              const cat = eventCategory(log.action, log.resource_type);
              const Icon = (EVENT_ICON[cat] ?? Activity) as React.ElementType<{ className?: string }>;
              const actor = log.actor_email ?? actorMap[log.actor_id]?.email ?? log.actor_id ?? 'System';
              const actorName = actorMap[log.actor_id]?.full_name ?? actor;
              return (
                <div key={log.id} className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${EVENT_COLOR[cat] ?? 'bg-slate-100 text-slate-600'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-slate-900 truncate">{actorName}</span>
                      {log.actor_role && (
                        <span className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{log.actor_role}</span>
                      )}
                      <span className="text-sm text-slate-600">{log.action?.replace(/_/g, ' ')}</span>
                      {log.resource_type && (
                        <span className="text-xs text-slate-400">on {log.resource_type}</span>
                      )}
                    </div>
                    {log.resource_id && (
                      <p className="text-xs text-slate-400 mt-0.5 truncate">ID: {log.resource_id}</p>
                    )}
                    {log.ip_address && (
                      <p className="text-xs text-slate-400">IP: {log.ip_address}</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 shrink-0 whitespace-nowrap">
                    {formatRelative(log.created_at)}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="text-xs text-slate-400 text-center">
          Showing most recent 200 events.{' '}
          <Link href="/admin/audit-logs" className="text-blue-600 hover:underline">
            View full audit log
          </Link>
        </p>
      </div>
    </div>
  );
}
