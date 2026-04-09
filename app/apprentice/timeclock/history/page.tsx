import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertTriangle, History, Link2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Shift History | Timeclock | Elevate for Humanity',
  description: 'Full record of your clocked shifts and OJT hours.',
};

export const dynamic = 'force-dynamic';

function formatTime(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'America/Indiana/Indianapolis',
  });
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function computeNetHours(
  clockIn: string | null,
  clockOut: string | null,
  breakMinutes: number | null,
): number | null {
  if (!clockIn || !clockOut) return null;
  const diffMs = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  if (diffMs < 0) return 0; // bad data — clock-out before clock-in
  const cappedMs = Math.min(diffMs, 16 * 3600 * 1000); // cap overnight at 16h
  const netMin = Math.max(0, cappedMs / 60000 - (breakMinutes ?? 0));
  return Math.round((netMin / 60) * 10) / 10;
}

export default async function TimeclockHistoryPage() {
  const supabase = await createClient();
  const adminDb = await getAdminClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice/timeclock/history');

  let apprentice: { id: string; program_id: string | null } | null = null;
  let linkageError: 'not_found' | 'unlinked' | null = null;

  // 1. Direct user_id match
  const { data: byUserId } = await supabase
    .from('apprentices')
    .select('id, program_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (byUserId) {
    apprentice = byUserId;
  } else if (user.email) {
    // 2. Email fallback via admin client (bypasses RLS)
    const { data: byEmail } = await adminDb
      .from('apprentices')
      .select('id, program_id, user_id')
      .eq('email', user.email)
      .eq('status', 'active')
      .maybeSingle();

    if (byEmail) {
      apprentice = byEmail;
      // Self-heal: write user_id so future lookups are direct
      await adminDb
        .from('apprentices')
        .update({ user_id: user.id })
        .eq('id', byEmail.id);
    } else {
      // Check if a record exists at all (any status) — distinguish unlinked vs absent
      const { data: anyRecord } = await adminDb
        .from('apprentices')
        .select('id, user_id')
        .eq('email', user.email)
        .maybeSingle();

      linkageError = anyRecord && !anyRecord.user_id ? 'unlinked' : 'not_found';
    }
  } else {
    linkageError = 'not_found';
  }

  if (linkageError === 'unlinked') {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/apprentice/timeclock" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Timeclock
          </Link>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <Link2 className="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-amber-900 mb-1">Account not linked to apprentice record</h2>
                <p className="text-amber-800 text-sm">
                  Your apprentice record exists but is not connected to your login account.
                  Your coordinator can fix this in under a minute.
                </p>
                <p className="text-amber-700 text-xs mt-3 font-mono">Your login: {user.email}</p>
                <p className="text-amber-600 text-xs mt-2">
                  Ask your coordinator to go to <strong>Admin → Apprentices → Link Account</strong> and match your email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!apprentice) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/apprentice/timeclock" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Timeclock
          </Link>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-slate-400 mx-auto mb-3" />
            <h2 className="font-semibold text-slate-700 mb-1">No active apprenticeship</h2>
            <p className="text-slate-500 text-sm">
              No apprenticeship record was found for this account.
              If you believe this is an error, contact your program coordinator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const { data: shifts } = await supabase
    .from('progress_entries')
    .select(`
      id, work_date, clock_in_at, clock_out_at,
      lunch_start_at, lunch_end_at, break_minutes,
      hours_worked, status, auto_clocked_out, auto_clock_out_reason, notes
    `)
    .eq('apprentice_id', apprentice.id)
    .not('clock_in_at', 'is', null)
    .order('work_date', { ascending: false })
    .order('clock_in_at', { ascending: false });

  const rows = (shifts ?? []).map(s => {
    const isOpen = !!s.clock_in_at && !s.clock_out_at;
    const hasBadData = !!s.clock_in_at && !!s.clock_out_at &&
      new Date(s.clock_out_at).getTime() <= new Date(s.clock_in_at).getTime();
    const isOvernight = !!s.clock_in_at && !!s.clock_out_at &&
      new Date(s.clock_out_at).getTime() - new Date(s.clock_in_at).getTime() > 12 * 3600 * 1000;
    // Use server-computed hours_worked when available and shift is closed; otherwise compute
    const netHours = (!isOpen && s.hours_worked != null)
      ? s.hours_worked
      : (computeNetHours(s.clock_in_at, s.clock_out_at, s.break_minutes) ?? 0);
    return { ...s, isOpen, hasBadData, isOvernight, netHours };
  });

  // Summary — only count closed shifts toward totals
  const totalHours = rows.filter(s => !s.isOpen).reduce((sum, s) => sum + s.netHours, 0);
  const approvedHours = rows.filter(s => s.status === 'approved').reduce((sum, s) => sum + s.netHours, 0);
  const pendingCount = rows.filter(s => !s.isOpen && (!s.status || s.status === 'pending')).length;
  const openCount = rows.filter(s => s.isOpen).length;
  const autoCount = rows.filter(s => s.auto_clocked_out).length;

  const byMonth: Record<string, typeof rows> = {};
  for (const s of rows) {
    const key = s.work_date.slice(0, 7);
    if (!byMonth[key]) byMonth[key] = [];
    byMonth[key].push(s);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Breadcrumbs items={[
            { label: 'Apprentice', href: '/apprentice' },
            { label: 'Timeclock', href: '/apprentice/timeclock' },
            { label: 'Shift History' },
          ]} />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/apprentice/timeclock" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <History className="w-6 h-6 text-brand-blue-600" />
              Shift History
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">All recorded OJT shifts</p>
          </div>
        </div>

        {openCount > 0 && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {openCount} shift{openCount > 1 ? 's have' : ' has'} no clock-out recorded.
            <Link href="/apprentice/timeclock" className="underline font-medium ml-1">Clock out →</Link>
          </div>
        )}
        {autoCount > 0 && (
          <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0 text-amber-500" />
            {autoCount} shift{autoCount > 1 ? 's were' : ' was'} auto-clocked out — hours may be reduced.
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-brand-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-brand-blue-700">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-brand-blue-600 mt-0.5">Hours logged</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{approvedHours.toFixed(1)}</p>
            <p className="text-xs text-green-600 mt-0.5">Approved</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-xs text-amber-600 mt-0.5">Pending review</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">No shifts recorded yet</p>
            <p className="text-sm mt-1">Clock in at your work site to start tracking hours.</p>
            <Link href="/apprentice/timeclock" className="mt-4 inline-block text-brand-blue-600 text-sm hover:underline">
              Go to Timeclock →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byMonth).map(([monthKey, monthShifts]) => {
              const monthLabel = new Date(monthKey + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const monthHours = monthShifts.filter(s => !s.isOpen).reduce((sum, s) => sum + s.netHours, 0);
              return (
                <div key={monthKey}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{monthLabel}</h2>
                    <span className="text-sm font-semibold text-gray-700">{monthHours.toFixed(1)}h</span>
                  </div>
                  <div className="space-y-2">
                    {monthShifts.map((s) => (
                      <div key={s.id} className={`bg-white border rounded-xl p-4 shadow-sm ${s.hasBadData ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {s.hasBadData ? <AlertTriangle className="w-4 h-4 text-red-500" />
                                : s.auto_clocked_out ? <XCircle className="w-4 h-4 text-amber-500" />
                                : s.isOpen ? <Clock className="w-4 h-4 text-brand-blue-500 animate-pulse" />
                                : <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {formatDate(s.work_date)}
                                {s.isOvernight && <span className="ml-2 text-xs text-amber-600 font-normal">(overnight — capped 16h)</span>}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatTime(s.clock_in_at)}
                                {' → '}
                                {s.isOpen
                                  ? <span className="text-brand-blue-600 font-medium">Active</span>
                                  : formatTime(s.clock_out_at)}
                                {s.break_minutes ? ` · ${s.break_minutes}m break` : ''}
                                {s.auto_clocked_out && <span className="ml-1 text-amber-600">(auto)</span>}
                              </p>
                              {s.auto_clock_out_reason && <p className="text-xs text-amber-600 mt-0.5">{s.auto_clock_out_reason}</p>}
                              {s.hasBadData && <p className="text-xs text-red-600 mt-0.5">Clock-out before clock-in — contact coordinator</p>}
                              {s.notes && <p className="text-xs text-gray-400 mt-1 italic">{s.notes}</p>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-gray-900">{s.isOpen ? '—' : `${s.netHours.toFixed(1)}h`}</p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              s.status === 'approved' ? 'bg-green-100 text-green-700' :
                              s.status === 'rejected' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-500'
                            }`}>{s.status ?? 'pending'}</span>
                          </div>
                        </div>
                        {s.lunch_start_at && (
                          <div className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400">
                            Lunch: {formatTime(s.lunch_start_at)} → {formatTime(s.lunch_end_at)}
                            {!s.lunch_end_at && <span className="text-amber-600 ml-1">(no end recorded)</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
