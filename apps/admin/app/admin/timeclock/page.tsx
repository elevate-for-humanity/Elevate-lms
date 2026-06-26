import { Metadata } from 'next';
import Link from 'next/link';
import { requireAdminClient } from '@/lib/supabase/admin';
import { requireRole } from '@/lib/auth/require-role';
import {
  Clock, MapPin, AlertTriangle, CheckCircle2,
  Coffee, LogOut, User, Activity, Calendar,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Timeclock Operations | Admin' };

function fmtTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function elapsed(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
function elapsedHours(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 3600000;
}

const STATUS_STYLES: Record<string, string> = {
  submitted: 'bg-yellow-100 text-yellow-800',
  approved:  'bg-green-100 text-green-800',
  verified:  'bg-green-100 text-green-800',
  rejected:  'bg-red-100 text-red-800',
  pending:   'bg-slate-100 text-slate-600',
};

export default async function TimeclockPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; date?: string }>;
}) {
  await requireRole(['admin', 'staff']);
  const db = await requireAdminClient();
  const sp = await searchParams;
  const tab = sp.tab || 'live';

  const today = new Date().toISOString().slice(0, 10);
  const dateFilter = sp.date || today;

  // ── Currently clocked in (no clock_out_at, today) ────────────────────────
  const { data: activeEntries } = await db
    .from('progress_entries')
    .select('id, apprentice_id, partner_id, program_id, site_id, work_date, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at, auto_clocked_out, status, hours_worked')
    .eq('work_date', today)
    .is('clock_out_at', null)
    .order('clock_in_at', { ascending: false });

  const active = activeEntries ?? [];

  // ── All entries for selected date ────────────────────────────────────────
  const { data: dayEntries } = await db
    .from('progress_entries')
    .select('id, apprentice_id, partner_id, program_id, site_id, work_date, clock_in_at, clock_out_at, lunch_start_at, lunch_end_at, auto_clocked_out, status, hours_worked')
    .eq('work_date', dateFilter)
    .order('clock_in_at', { ascending: false });

  const dayRows = dayEntries ?? [];

  // ── Pending approval (submitted, not yet approved) ───────────────────────
  const { data: pendingEntries } = await db
    .from('progress_entries')
    .select('id, apprentice_id, partner_id, program_id, site_id, work_date, clock_in_at, clock_out_at, hours_worked, status, auto_clocked_out')
    .eq('status', 'submitted')
    .not('clock_out_at', 'is', null)
    .order('work_date', { ascending: false })
    .limit(100);

  const pending = pendingEntries ?? [];

  // ── Admin alerts (geofence violations, overtime, etc.) ───────────────────
  const { data: alerts } = await db
    .from('admin_alerts')
    .select('id, alert_type, severity, details, resolved, created_at')
    .eq('resolved', false)
    .in('alert_type', ['geofence_violation', 'overtime_warning', 'missing_clock_out', 'timeclock'])
    .order('created_at', { ascending: false })
    .limit(50);

  // ── Hydrate apprentice/profile names ────────────────────────────────────
  const allApprenticeIds = [...new Set([
    ...active.map((r: any) => r.apprentice_id),
    ...dayRows.map((r: any) => r.apprentice_id),
    ...pending.map((r: any) => r.apprentice_id),
  ].filter(Boolean))];

  const { data: apprentices } = allApprenticeIds.length
    ? await db.from('apprentices').select('id, user_id, employer_id').in('id', allApprenticeIds)
    : { data: [] };

  const apprenticeUserIds = [...new Set((apprentices ?? []).map((a: any) => a.user_id).filter(Boolean))];
  const { data: profiles } = apprenticeUserIds.length
    ? await db.from('profiles').select('id, full_name, email').in('id', apprenticeUserIds)
    : { data: [] };

  const userMap: Record<string, string> = {};
  (profiles ?? []).forEach((p: any) => { userMap[p.id] = p.full_name || p.email || p.id.slice(0, 8); });

  const apprenticeMap: Record<string, string> = {};
  (apprentices ?? []).forEach((a: any) => {
    apprenticeMap[a.id] = userMap[a.user_id] || a.id.slice(0, 8);
  });

  // ── Site names ───────────────────────────────────────────────────────────
  const allSiteIds = [...new Set([
    ...active.map((r: any) => r.site_id),
    ...dayRows.map((r: any) => r.site_id),
  ].filter(Boolean))];

  const { data: sites } = allSiteIds.length
    ? await db.from('apprentice_sites').select('id, name').in('id', allSiteIds)
    : { data: [] };

  const siteMap: Record<string, string> = {};
  (sites ?? []).forEach((s: any) => { siteMap[s.id] = s.name || s.id.slice(0, 8); });

  // ── Flags ────────────────────────────────────────────────────────────────
  // Overtime: clocked in > 10 hours
  const overtimeEntries = active.filter((r: any) => r.clock_in_at && elapsedHours(r.clock_in_at) > 10);
  // Auto-clocked out (missed clock-out)
  const autoClocked = dayRows.filter((r: any) => r.auto_clocked_out);

  const tabs = [
    { key: 'live',    label: `Live (${active.length})` },
    { key: 'day',     label: 'By Day' },
    { key: 'pending', label: `Pending Approval (${pending.length})` },
    { key: 'alerts',  label: `Alerts (${(alerts ?? []).length})` },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Timeclock Operations</h1>
          <p className="text-sm text-slate-500 mt-1">
            Live attendance · violations · pending approvals
          </p>
        </div>
        <Link
          href="/admin/student-hours"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          <Clock className="w-4 h-4" /> OJT Hours
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Clocked In Now',    value: active.length,           icon: Activity,      color: active.length > 0 ? 'text-green-600' : 'text-slate-400' },
          { label: 'Overtime Flags',    value: overtimeEntries.length,  icon: AlertTriangle, color: overtimeEntries.length > 0 ? 'text-red-600' : 'text-slate-400' },
          { label: 'Auto Clock-Outs',   value: autoClocked.length,      icon: LogOut,        color: autoClocked.length > 0 ? 'text-amber-600' : 'text-slate-400' },
          { label: 'Pending Approval',  value: pending.length,          icon: CheckCircle2,  color: pending.length > 0 ? 'text-yellow-600' : 'text-slate-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex items-center gap-2 mb-1">
              <Icon className={`w-4 h-4 ${color}`} />
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
            </div>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Overtime banner */}
      {overtimeEntries.length > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 text-sm">
              {overtimeEntries.length} apprentice{overtimeEntries.length > 1 ? 's' : ''} clocked in over 10 hours
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              {overtimeEntries.map((r: any) => apprenticeMap[r.apprentice_id] || 'Unknown').join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-1">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/admin/timeclock?tab=${t.key}${t.key === 'day' ? `&date=${dateFilter}` : ''}`}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Tab: Live ── */}
      {tab === 'live' && (
        <div>
          {active.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center text-slate-400">
              <Activity className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No one is clocked in right now</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {active.map((r: any) => {
                const name = apprenticeMap[r.apprentice_id] || 'Unknown';
                const site = siteMap[r.site_id] || 'Unknown site';
                const hrs = elapsedHours(r.clock_in_at);
                const isOvertime = hrs > 10;
                const onLunch = r.lunch_start_at && !r.lunch_end_at;

                return (
                  <div
                    key={r.id}
                    className={`rounded-xl border bg-white overflow-hidden ${isOvertime ? 'border-red-300' : 'border-slate-200'}`}
                  >
                    <div className={`px-4 py-3 flex items-center justify-between ${isOvertime ? 'bg-red-50' : 'bg-green-50'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${onLunch ? 'bg-amber-400' : 'bg-green-500'} animate-pulse`} />
                        <span className="text-xs font-semibold text-slate-600">
                          {onLunch ? 'On Lunch' : isOvertime ? 'OVERTIME' : 'Clocked In'}
                        </span>
                      </div>
                      <span className={`text-sm font-bold ${isOvertime ? 'text-red-700' : 'text-green-700'}`}>
                        {elapsed(r.clock_in_at)}
                      </span>
                    </div>
                    <div className="px-4 py-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <p className="font-semibold text-slate-900 text-sm">{name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <p className="text-xs text-slate-500">{site}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <p className="text-xs text-slate-500">
                          In: {fmtTime(r.clock_in_at)}
                          {onLunch && ` · Lunch: ${fmtTime(r.lunch_start_at)}`}
                        </p>
                      </div>
                      {isOvertime && (
                        <div className="flex items-center gap-1.5 bg-red-50 rounded-lg px-3 py-2 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                          <p className="text-xs text-red-700 font-medium">
                            Over 10 hours — review required
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: By Day ── */}
      {tab === 'day' && (
        <div className="space-y-4">
          {/* Date picker */}
          <div className="flex items-center gap-3">
            <Calendar className="w-4 h-4 text-slate-400" />
            <form method="get" action="/admin/timeclock" className="flex items-center gap-2">
              <input type="hidden" name="tab" value="day" />
              <input
                type="date"
                name="date"
                defaultValue={dateFilter}
                className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
              >
                View
              </button>
            </form>
            <span className="text-sm text-slate-500">{dayRows.length} entries</span>
          </div>

          {dayRows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
              <p className="font-medium">No entries for {dateFilter}</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 font-medium">Apprentice</th>
                      <th className="text-left px-4 py-3 font-medium">Site</th>
                      <th className="text-left px-4 py-3 font-medium">Clock In</th>
                      <th className="text-left px-4 py-3 font-medium">Lunch</th>
                      <th className="text-left px-4 py-3 font-medium">Clock Out</th>
                      <th className="text-right px-4 py-3 font-medium">Hours</th>
                      <th className="text-left px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {dayRows.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">
                          {apprenticeMap[r.apprentice_id] || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {siteMap[r.site_id] || '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                          {fmtTime(r.clock_in_at)}
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                          {r.lunch_start_at ? (
                            <>
                              <Coffee className="w-3 h-3 inline mr-1 text-amber-500" />
                              {fmtTime(r.lunch_start_at)}
                              {r.lunch_end_at && ` – ${fmtTime(r.lunch_end_at)}`}
                            </>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs whitespace-nowrap">
                          {r.clock_out_at ? (
                            <span className="text-slate-600">{fmtTime(r.clock_out_at)}</span>
                          ) : (
                            <span className="text-green-600 font-semibold">Active</span>
                          )}
                          {r.auto_clocked_out && (
                            <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">auto</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {r.hours_worked != null ? `${r.hours_worked}h` : r.clock_out_at ? '—' : elapsed(r.clock_in_at)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[r.status] ?? 'bg-slate-100 text-slate-600'}`}>
                            {r.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {r.auto_clocked_out && (
                            <span title="Auto clock-out — student missed manual clock-out">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Pending Approval ── */}
      {tab === 'pending' && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {pending.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No entries pending approval</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-slate-500 border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 font-medium">Apprentice</th>
                    <th className="text-left px-4 py-3 font-medium">Date</th>
                    <th className="text-left px-4 py-3 font-medium">Clock In</th>
                    <th className="text-left px-4 py-3 font-medium">Clock Out</th>
                    <th className="text-right px-4 py-3 font-medium">Hours</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {pending.map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {apprenticeMap[r.apprentice_id] || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">
                        {fmtDate(r.work_date)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {fmtTime(r.clock_in_at)}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">
                        {fmtTime(r.clock_out_at)}
                        {r.auto_clocked_out && (
                          <span className="ml-1 text-[10px] bg-amber-100 text-amber-700 font-semibold px-1.5 py-0.5 rounded-full">auto</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-900">
                        {r.hours_worked != null ? `${r.hours_worked}h` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/apprenticeships?entry=${r.id}`}
                          className="text-xs text-blue-600 hover:underline whitespace-nowrap"
                        >
                          Review →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Alerts ── */}
      {tab === 'alerts' && (
        <div className="space-y-3">
          {(alerts ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 py-12 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">No active alerts</p>
            </div>
          ) : (
            (alerts ?? []).map((a: any) => (
              <div
                key={a.id}
                className={`rounded-xl border p-4 ${a.severity === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-red-200 bg-red-50'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${a.severity === 'warning' ? 'text-amber-600' : 'text-red-600'}`} />
                    <div>
                      <p className="font-semibold text-slate-900 text-sm capitalize">
                        {a.alert_type.replace(/_/g, ' ')}
                      </p>
                      {a.details?.distance_m != null && (
                        <p className="text-xs text-slate-600 mt-0.5">{Math.round(a.details.distance_m)}m from geofence</p>
                      )}
                      {a.details?.hours_elapsed != null && (
                        <p className="text-xs text-slate-600 mt-0.5">{Math.round(a.details.hours_elapsed * 10) / 10}h elapsed</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {new Date(a.created_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.severity === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                    {a.severity}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
