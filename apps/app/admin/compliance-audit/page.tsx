import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { ChevronRight, Shield, Activity, AlertTriangle, FileText } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = { title: 'Compliance Audit | Admin | Elevate For Humanity' };

export default async function ComplianceAuditPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const cutoff30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [
    { count: totalAudits },
    { count: recent },
    { data: audits },
    { data: events },
  ] = await Promise.all([
    db.from('compliance_audits').select('*', { count: 'exact', head: true }),
    db.from('compliance_audits').select('*', { count: 'exact', head: true }).gte('created_at', cutoff30d),
    db.from('compliance_audits')
      .select('id, action, details, ip_address, created_at, profiles:user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(50),
    // compliance_events if it exists
    db.from('compliance_events')
      .select('id, action, created_at, profiles:user_id(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(20)
      .catch(() => ({ data: [] })),
  ]);

  const stats = [
    { label: 'Total Audit Records', value: totalAudits ?? 0, icon: Shield, color: 'text-brand-blue-600', bg: 'bg-brand-blue-50' },
    { label: 'Last 30 Days', value: recent ?? 0, icon: Activity, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'Compliance Events', value: (events as any[])?.length ?? 0, icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div>
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/compliance" className="hover:text-slate-700">Compliance</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Audit Log</span>
        </nav>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Compliance Audit</h1>
            <p className="text-sm text-slate-500 mt-1">Compliance event log, audit trail, and regulatory reporting</p>
          </div>
          <Link href="/admin/audit-logs"
            className="text-sm text-slate-600 border border-slate-200 rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors">
            Full Audit Logs →
          </Link>
        </div>
      </div>

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

      {/* Quick links to related compliance sections */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'FERPA Audit Log', href: '/admin/ferpa/audit-log', desc: 'Student record access log' },
          { label: 'WIOA Compliance', href: '/admin/wioa', desc: 'WIOA Title I reporting' },
          { label: 'Governance', href: '/admin/governance', desc: 'Legal and security governance' },
        ].map(l => (
          <Link key={l.href} href={l.href}
            className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all group">
            <p className="font-semibold text-slate-800 text-sm group-hover:text-brand-blue-700">{l.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{l.desc}</p>
          </Link>
        ))}
      </div>

      {/* Audit records */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-800">Recent Compliance Audit Records</h2>
        </div>
        {!audits?.length ? (
          <div className="text-center py-12">
            <Shield className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No compliance audit records</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                {['User', 'Action', 'IP Address', 'Date'].map(h => (
                  <th key={h} className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {audits.map((a: any) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <p className="text-xs font-medium text-slate-800">{a.profiles?.full_name ?? '—'}</p>
                    <p className="text-xs text-slate-400">{a.profiles?.email ?? '—'}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-700 font-mono max-w-xs truncate">{a.action ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 font-mono">{a.ip_address ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {new Date(a.created_at).toLocaleString()}
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
