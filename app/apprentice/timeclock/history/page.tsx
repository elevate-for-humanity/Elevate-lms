import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertTriangle, History } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Shift History | Timeclock | Elevate for Humanity',
  description: 'Full record of your clocked shifts and OJT hours.',
};

export const dynamic = 'force-dynamic';

function formatTime(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(dateStr: string) {
  // work_date is YYYY-MM-DD — parse at noon to avoid timezone shift
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
  });
}

function duration(clockIn: string | null, clockOut: string | null, breakMin: number | null): string {
  if (!clockIn || !clockOut) return '—';
  const ms = new Date(clockOut).getTime() - new Date(clockIn).getTime();
  const totalMin = Math.max(0, ms / 60000 - (breakMin ?? 0));
  const h = Math.floor(totalMin / 60);
  const m = Math.round(totalMin % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default async function TimeclockHistoryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice/timeclock/history');

  // Resolve apprentice record
  const { data: apprentice } = await supabase
    .from('apprentices')
    .select('id, program_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .maybeSingle();

  if (!apprentice) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <Link href="/apprentice/timeclock" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Timeclock
          </Link>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
            <p className="text-amber-800 font-medium">No active apprenticeship found.</p>
            <p className="text-amber-700 text-sm mt-1">Contact your program coordinator.</p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch all shifts
  const { data: shifts } = await supabase
    .from('progress_entries')
    .select(`
      id,
      work_date,
      clock_in_at,
      clock_out_at,
      lunch_start_at,
      lunch_end_at,
      break_minutes,
      hours_worked,
      status,
      auto_clocked_out,
      auto_clock_out_reason,
      last_seen_within_geofence,
      site_id,
      notes
    `)
    .eq('apprentice_id', apprentice.id)
    .not('clock_in_at', 'is', null)
    .order('work_date', { ascending: false })
    .order('clock_in_at', { ascending: false });

  const rows = shifts ?? [];

  // Totals
  const totalHours = rows.reduce((sum, s) => sum + (s.hours_worked ?? 0), 0);
  const approvedHours = rows
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + (s.hours_worked ?? 0), 0);
  const pendingCount = rows.filter(s => !s.status || s.status === 'pending').length;

  // Group by month
  const byMonth: Record<string, typeof rows> = {};
  for (const s of rows) {
    const key = s.work_date.slice(0, 7); // YYYY-MM
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

        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-brand-blue-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-brand-blue-700">{totalHours.toFixed(1)}</p>
            <p className="text-xs text-brand-blue-600 mt-0.5">Total hours logged</p>
          </div>
          <div className="bg-green-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700">{approvedHours.toFixed(1)}</p>
            <p className="text-xs text-green-600 mt-0.5">Approved hours</p>
          </div>
          <div className="bg-amber-50 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
            <p className="text-xs text-amber-600 mt-0.5">Pending review</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Clock className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No shifts recorded yet.</p>
            <p className="text-sm mt-1">Clock in at your work site to start tracking hours.</p>
            <Link href="/apprentice/timeclock" className="mt-4 inline-block text-brand-blue-600 text-sm hover:underline">
              Go to Timeclock →
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(byMonth).map(([monthKey, monthShifts]) => {
              const monthLabel = new Date(monthKey + '-15').toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              const monthHours = monthShifts.reduce((sum, s) => sum + (s.hours_worked ?? 0), 0);
              return (
                <div key={monthKey}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{monthLabel}</h2>
                    <span className="text-sm font-semibold text-gray-700">{monthHours.toFixed(1)}h</span>
                  </div>

                  <div className="space-y-2">
                    {monthShifts.map((s) => (
                      <div key={s.id} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Status icon */}
                            <div className="mt-0.5">
                              {s.auto_clocked_out ? (
                                <AlertTriangle className="w-4 h-4 text-amber-500" />
                              ) : s.clock_out_at ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Clock className="w-4 h-4 text-brand-blue-500 animate-pulse" />
                              )}
                            </div>

                            <div>
                              <p className="font-semibold text-gray-900 text-sm">{formatDate(s.work_date)}</p>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {formatTime(s.clock_in_at)} → {s.clock_out_at ? formatTime(s.clock_out_at) : <span className="text-brand-blue-600 font-medium">Active</span>}
                                {s.break_minutes ? ` · ${s.break_minutes}m break` : ''}
                                {s.auto_clocked_out && <span className="ml-1 text-amber-600">(auto clock-out)</span>}
                              </p>
                              {s.auto_clock_out_reason && (
                                <p className="text-xs text-amber-600 mt-0.5">{s.auto_clock_out_reason}</p>
                              )}
                              {s.notes && (
                                <p className="text-xs text-gray-400 mt-1 italic">{s.notes}</p>
                              )}
                            </div>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-gray-900">
                              {s.hours_worked != null ? `${s.hours_worked.toFixed(1)}h` : duration(s.clock_in_at, s.clock_out_at, s.break_minutes)}
                            </p>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              s.status === 'approved'
                                ? 'bg-green-100 text-green-700'
                                : s.status === 'rejected'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-500'
                            }`}>
                              {s.status ?? 'pending'}
                            </span>
                          </div>
                        </div>

                        {/* Lunch detail */}
                        {s.lunch_start_at && (
                          <div className="mt-2 pt-2 border-t border-gray-50 text-xs text-gray-400 flex items-center gap-1">
                            <span>Lunch: {formatTime(s.lunch_start_at)} → {formatTime(s.lunch_end_at)}</span>
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
