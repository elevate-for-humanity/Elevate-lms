import { Metadata } from 'next';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import Link from 'next/link';
import { AlertTriangle, Clock, ChevronRight, ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const revalidate = 60;
export const metadata: Metadata = {
  title: 'At-Risk Students | Admin',
};

const RISK_STYLES: Record<string, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-100 text-slate-600',
};

export default async function AtRiskPage() {
  await requireRole(['admin', 'super_admin', 'staff']);
  const adminDb = await requireAdminClient();
  if (!adminDb) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-slate-500 text-sm">Service unavailable — admin client could not be initialized.</p>
      </div>
    );
  }
  const db = adminDb;
  const inactive14 = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [flaggedRes, inactiveEnrollRes] = await Promise.all([
    db
      .from('at_risk_students')
      .select('id, user_id, risk_level, reason, created_at, resolved, notes', { count: 'exact' })
      .eq('resolved', false)
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('program_enrollments')
      .select('id, user_id, enrolled_at, enrollment_state', { count: 'exact' })
      .eq('enrollment_state', 'active')
      .lte('enrolled_at', inactive14)
      .order('enrolled_at', { ascending: true })
      .limit(50),
  ]);

  const flagged = flaggedRes.data ?? [];
  const flaggedCount = flaggedRes.count ?? 0;
  const inactiveEnrollments = inactiveEnrollRes.data ?? [];
  const inactiveCount = inactiveEnrollRes.count ?? 0;

  const flaggedUserIds = [...new Set(flagged.map((r: any) => r.user_id).filter(Boolean))];
  const { data: flaggedProfiles } = flaggedUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', flaggedUserIds)
    : { data: [] };
  const flaggedProfileMap = Object.fromEntries((flaggedProfiles ?? []).map((p: any) => [p.id, p]));

  const inactiveUserIds = [
    ...new Set(inactiveEnrollments.map((e: any) => e.user_id).filter(Boolean)),
  ];
  const { data: inactiveProfiles } = inactiveUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', inactiveUserIds)
    : { data: [] };
  const inactiveProfileMap = Object.fromEntries(
    (inactiveProfiles ?? []).map((p: any) => [p.id, p]),
  );

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <Link href="/admin/dashboard" className="hover:text-slate-700">
            Admin
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900 font-medium">At-Risk</span>
        </nav>
        <h1 className="text-2xl font-bold text-slate-900">At-Risk Students</h1>
        <p className="text-sm text-slate-500 mt-1">
          Students flagged for intervention or enrolled 14+ days with no recent activity
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              label: 'Flagged for Intervention',
              value: flaggedCount,
              icon: AlertTriangle,
              urgent: flaggedCount > 0,
              color: 'text-rose-600',
              bg: 'bg-rose-50',
            },
            {
              label: 'Enrolled 14+ Days',
              value: inactiveCount,
              icon: Clock,
              urgent: inactiveCount > 0,
              color: 'text-amber-600',
              bg: 'bg-amber-50',
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`bg-white rounded-2xl border shadow-sm p-5 ${s.urgent ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'}`}
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

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">Flagged for Intervention</h2>
            <span className="text-xs text-slate-400">{flaggedCount} students</span>
          </div>
          {flagged.length === 0 ? (
            <div className="py-12 text-center">
              <AlertTriangle className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No flagged students</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Student', 'Risk Level', 'Reason', 'Flagged', ''].map((h) => (
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
                {flagged.map((r: any) => {
                  const p = flaggedProfileMap[r.user_id];
                  return (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{p?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{p?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-5">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${RISK_STYLES[r.risk_level] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {r.risk_level ?? 'unknown'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 max-w-xs truncate">
                        {r.reason ?? r.notes ?? '—'}
                      </td>
                      <td className="py-3.5 px-5 text-slate-500 text-xs">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {p?.id && (
                          <Link
                            href={`/admin/students/${p.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900 text-sm">
              Enrolled 14+ Days — No Recent Activity
            </h2>
            <span className="text-xs text-slate-400">{inactiveCount} students</span>
          </div>
          {inactiveEnrollments.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="w-7 h-7 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">All active students have recent activity</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50">
                  {['Student', 'Enrolled', 'Days Since Enrolled', ''].map((h) => (
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
                {inactiveEnrollments.map((e: any) => {
                  const p = inactiveProfileMap[e.user_id];
                  const days = e.enrolled_at
                    ? Math.floor((Date.now() - new Date(e.enrolled_at).getTime()) / 86400000)
                    : null;
                  return (
                    <tr key={e.id} className="hover:bg-slate-50">
                      <td className="py-3.5 px-5">
                        <p className="font-semibold text-slate-900">{p?.full_name ?? '—'}</p>
                        <p className="text-xs text-slate-400">{p?.email ?? ''}</p>
                      </td>
                      <td className="py-3.5 px-5 text-slate-500">
                        {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-5">
                        {days !== null && (
                          <span
                            className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${days > 30 ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}
                          >
                            {days}d
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {p?.id && (
                          <Link
                            href={`/admin/students/${p.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue-600 hover:text-brand-blue-700"
                          >
                            View <ArrowRight className="w-3 h-3" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
