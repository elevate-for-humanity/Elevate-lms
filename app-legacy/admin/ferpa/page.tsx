import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import {
  Shield,
  FileText,
  Users,
  AlertTriangle,
  Clock,
  ChevronRight,
  ArrowRight,
  Download,
  Eye,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'FERPA Compliance | Admin',
};

export default async function AdminFerpaPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await requireAdminClient();
  const ytdStart = new Date(new Date().getFullYear(), 0, 1).toISOString();

  const [consentRes, pendingDocsRes, totalStudentsRes, ferpaViolRes, auditRes] = await Promise.all([
    db
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('document_type', 'consent'),
    db.from('documents').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
    db.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'student'),
    db
      .from('compliance_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('alert_type', 'ferpa_violation')
      .gte('created_at', ytdStart),
    db
      .from('audit_logs')
      .select('id, action, target_type, resource_type, created_at, actor_role, actor_id')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);

  const consentCount = consentRes.count ?? 0;
  const pendingDocs = pendingDocsRes.count ?? 0;
  const totalStudents = totalStudentsRes.count ?? 0;
  const ferpaViolations = ferpaViolRes.count ?? 0;
  const auditLogs = auditRes.data ?? [];

  const stats = [
    {
      label: 'Active Consent Forms',
      value: consentCount,
      icon: FileText,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      label: 'Pending Reviews',
      value: pendingDocs,
      icon: Clock,
      color: 'text-yellow-600',
      bg: 'bg-yellow-50',
      urgent: pendingDocs > 0,
    },
    {
      label: 'Student Records',
      value: totalStudents,
      icon: Eye,
      color: 'text-brand-blue-600',
      bg: 'bg-brand-blue-50',
    },
    {
      label: 'Violations YTD',
      value: ferpaViolations,
      icon: AlertTriangle,
      color: 'text-red-600',
      bg: 'bg-red-50',
      urgent: ferpaViolations > 0,
    },
  ];

  const quickActions = [
    { label: 'Manage Consent Forms', href: '/admin/documents?type=consent', icon: FileText },
    { label: 'Review Access Requests', href: '/admin/documents?status=pending', icon: Eye },
    { label: 'Directory Information', href: '/admin/students', icon: Users },
    { label: 'Generate FERPA Report', href: '/admin/ferpa/audit-log', icon: Download },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/compliance" className="hover:text-slate-700">
            Compliance
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">FERPA</span>
        </nav>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <Shield className="w-6 h-6 text-brand-blue-600" />
              FERPA Compliance
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Student privacy, consent forms, and records access
            </p>
          </div>
          <Link
            href="/admin/compliance"
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ← Compliance
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`bg-white rounded-2xl border shadow-sm p-5 ${(s as any).urgent ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'}`}
              >
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-2">
                {quickActions.map((a) => {
                  const Icon = a.icon;
                  return (
                    <Link
                      key={a.href}
                      href={a.href}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <Icon className="w-4 h-4 text-brand-blue-600 flex-shrink-0" />
                      <span className="text-sm text-slate-700 group-hover:text-slate-900">
                        {a.label}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 ml-auto" />
                    </Link>
                  );
                })}
              </div>
            </div>

            {ferpaViolations > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <p className="text-sm font-semibold text-red-800">FERPA Violations YTD</p>
                </div>
                <p className="text-3xl font-bold text-red-700">{ferpaViolations}</p>
                <p className="text-xs text-red-600 mt-1">Requires immediate review</p>
                <Link
                  href="/admin/compliance"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-red-700 hover:underline"
                >
                  View alerts <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Recent audit activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">Recent Audit Activity</h2>
              <Link
                href="/admin/audit-logs"
                className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {auditLogs.length === 0 ? (
              <div className="py-12 text-center text-sm text-slate-400">
                No audit activity recorded
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {auditLogs.map((log: any) => (
                  <div
                    key={log.id}
                    className="px-6 py-3 flex items-center justify-between hover:bg-slate-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {log.action ?? 'Action'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {log.resource_type ?? log.target_type ?? 'Record'} ·{' '}
                        {log.actor_role ?? 'user'}
                      </p>
                    </div>
                    <p className="text-xs text-slate-400 flex-shrink-0 ml-4">
                      {log.created_at ? new Date(log.created_at).toLocaleString() : '—'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
