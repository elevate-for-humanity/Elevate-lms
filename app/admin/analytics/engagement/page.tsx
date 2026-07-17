import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
import { Users, Activity, TrendingUp, Clock, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'Engagement Analytics | Admin',
};

export default async function EngagementPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const week = new Date(Date.now() - 7 * 86400000).toISOString();
  const month = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    totalUsersRes,
    activeWeekRes,
    activeMonthRes,
    newThisMonthRes,
    recentUsersRes,
    auditCountRes,
  ] = await Promise.all([
    db.from('profiles').select('id', { count: 'exact', head: true }),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('last_sign_in_at', week),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('last_sign_in_at', month),
    db.from('profiles').select('id', { count: 'exact', head: true }).gte('created_at', month),
    db
      .from('profiles')
      .select('id, full_name, email, role, last_sign_in_at, created_at')
      .order('last_sign_in_at', { ascending: false, nullsFirst: false })
      .limit(25),
    db.from('audit_logs').select('id', { count: 'exact', head: true }).gte('created_at', week),
  ]);

  const totalUsers = totalUsersRes.count ?? 0;
  const activeWeek = activeWeekRes.count ?? 0;
  const activeMonth = activeMonthRes.count ?? 0;
  const newThisMonth = newThisMonthRes.count ?? 0;
  const recentUsers = recentUsersRes.data ?? [];
  const auditCount = auditCountRes.count ?? 0;

  const weekRate = totalUsers > 0 ? Math.round((activeWeek / totalUsers) * 100) : 0;
  const monthRate = totalUsers > 0 ? Math.round((activeMonth / totalUsers) * 100) : 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/admin/analytics" className="hover:text-slate-700">
            Analytics
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">Engagement</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">Engagement Analytics</h1>
        <p className="text-sm text-slate-500 mt-1">
          User activity, sign-ins, and platform engagement
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Users',
              value: totalUsers,
              icon: Users,
              color: 'text-brand-blue-600',
              bg: 'bg-brand-blue-50',
            },
            {
              label: 'Active (7d)',
              value: activeWeek,
              icon: Activity,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
            {
              label: 'Active (30d)',
              value: activeMonth,
              icon: TrendingUp,
              color: 'text-purple-600',
              bg: 'bg-purple-50',
            },
            {
              label: 'New This Month',
              value: newThisMonth,
              icon: Clock,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5"
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

        {/* Activity rates */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: '7-Day Active Rate', rate: weekRate, active: activeWeek, total: totalUsers },
            {
              label: '30-Day Active Rate',
              rate: monthRate,
              active: activeMonth,
              total: totalUsers,
            },
          ].map((r) => (
            <div
              key={r.label}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-semibold text-slate-900 text-sm">{r.label}</h2>
                <span className="text-lg font-bold text-slate-900">{r.rate}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-brand-blue-500 h-2.5 rounded-full"
                  style={{ width: `${r.rate}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 mt-2">
                {r.active} of {r.total} users active
              </p>
            </div>
          ))}
        </div>

        {/* Platform events this week */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h2 className="font-semibold text-slate-900 text-sm mb-1">Platform Events (7d)</h2>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">
            {auditCount.toLocaleString()}
          </p>
          <p className="text-xs text-slate-400 mt-1">Audit log entries in the last 7 days</p>
          <Link
            href="/admin/audit-logs"
            className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:underline"
          >
            View audit log <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {/* Recently active users */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Recently Active Users</h2>
            <Link
              href="/admin/students"
              className="text-xs font-semibold text-brand-blue-600 hover:underline flex items-center gap-1"
            >
              All users <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['User', 'Role', 'Last Sign In', 'Joined'].map((h) => (
                  <th
                    key={h}
                    className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {recentUsers.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="py-3.5 px-5">
                    <p className="font-semibold text-slate-900">{u.full_name ?? '—'}</p>
                    <p className="text-xs text-slate-400">{u.email ?? ''}</p>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
                      {u.role ?? 'user'}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-slate-500 text-xs">
                    {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="py-3.5 px-5 text-slate-500 text-xs">
                    {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
