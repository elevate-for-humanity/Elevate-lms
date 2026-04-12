import { Metadata } from 'next';
import { getAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { AlertTriangle, Clock, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'At-Risk Students | Admin' };

const RISK_STYLES: Record<string, string> = {
  high:   'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low:    'bg-slate-100 text-slate-600',
};

export default async function AtRiskPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const db = await getAdminClient();

  const inactive14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [flaggedRes, inactiveRes] = await Promise.all([
    db.from('at_risk_students')
      .select('id, risk_level, reason, flagged_at, student:profiles(id, full_name, email)', { count: 'exact' })
      .order('flagged_at', { ascending: false })
      .limit(50),
    db.from('program_enrollments')
      .select('id, user_id, enrolled_at, last_activity_at', { count: 'exact' })
      .eq('enrollment_state', 'active')
      .lte('last_activity_at', inactive14)
      .order('last_activity_at', { ascending: true })
      .limit(50),
  ]);

  if (flaggedRes.error)  throw new Error(`at_risk_students query failed: ${flaggedRes.error.message}`);
  if (inactiveRes.error) throw new Error(`program_enrollments inactive query failed: ${inactiveRes.error.message}`);

  const flagged      = flaggedRes.data;
  const flaggedCount = flaggedRes.count;
  const inactiveCount = inactiveRes.count;

  // Hydrate profiles separately (user_id → auth.users, no FK to profiles)
  const inactiveUserIds = [...new Set((inactiveRes.data ?? []).map((e: any) => e.user_id).filter(Boolean))];
  const { data: inactiveProfiles } = inactiveUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', inactiveUserIds)
    : { data: [] };
  const inactiveProfileMap = Object.fromEntries((inactiveProfiles ?? []).map((p: any) => [p.id, p]));
  const inactive = (inactiveRes.data ?? []).map((e: any) => ({ ...e, student: inactiveProfileMap[e.user_id] ?? null }));

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">Admin</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">At-Risk</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">At-Risk Students</h1>
        <p className="text-sm text-slate-500 mt-1">Students flagged for intervention or inactive for 14+ days</p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Flagged for Intervention', value: flaggedCount ?? 0, icon: AlertTriangle, color: 'text-rose-600',  bg: 'bg-rose-50',  urgent: (flaggedCount ?? 0) > 0 },
            { label: 'Inactive 14+ Days',         value: inactiveCount ?? 0,icon: Clock,         color: 'text-amber-600',bg: 'bg-amber-50', urgent: (inactiveCount ?? 0) > 0 },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className={`bg-white rounded-2xl border shadow-sm p-5 ${s.urgent ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'}`}>
                <div className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                  <Icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">{s.value}</p>
                <p className="text-xs text-slate-500 mt-1 font-medium">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Flagged table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Flagged for Intervention</h2>
            <span className="text-xs text-slate-400">{flaggedCount ?? 0} students</span>
          </div>
          {!flagged?.length ? (
            <div className="py-12 text-center">
              <AlertTriangle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No flagged students</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Risk Level</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Reason</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Flagged</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {flagged.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{r.student?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{r.student?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${RISK_STYLES[r.risk_level] ?? 'bg-slate-100 text-slate-600'}`}>
                          {r.risk_level ?? 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate">{r.reason ?? '—'}</td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">{r.flagged_at ? new Date(r.flagged_at).toLocaleDateString() : '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/students/${r.student?.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Inactive table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Inactive 14+ Days</h2>
            <span className="text-xs text-slate-400">{inactiveCount ?? 0} students</span>
          </div>
          {!inactive?.length ? (
            <div className="py-12 text-center">
              <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All active students have recent activity</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left py-3 px-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Student</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Last Active</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">Enrolled</th>
                    <th className="py-3 px-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {inactive.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{r.student?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{r.student?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">{r.last_activity_at ? new Date(r.last_activity_at).toLocaleDateString() : 'Never'}</td>
                      <td className="py-3.5 px-4 text-slate-500">{r.enrolled_at ? new Date(r.enrolled_at).toLocaleDateString() : '—'}</td>
                      <td className="py-3.5 px-4 text-right">
                        <Link href={`/admin/students/${r.student?.id}`} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700">
                          View <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
