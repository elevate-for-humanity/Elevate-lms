import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  ChevronRight,
  Users,
  AlertCircle,
} from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Attendance | Program Holder Portal',
  robots: { index: false, follow: false },
};

export default async function AttendancePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/program-holder/portal/attendance');

  const db = await requireAdminClient();

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  if (!['program_holder', 'admin', 'super_admin', 'instructor'].includes(profile?.role ?? ''))
    redirect('/portals');

  const [
    { data: recentAttendance },
    { count: presentCount },
    { count: absentCount },
    { count: lateCount },
    { data: sessions },
  ] = await Promise.all([
    db
      .from('cohort_attendance')
      .select('id, status, minutes_attended, notes, created_at, user_id')
      .order('created_at', { ascending: false })
      .limit(20),
    db
      .from('cohort_attendance')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'present'),
    db.from('cohort_attendance').select('*', { count: 'exact', head: true }).eq('status', 'absent'),
    db.from('cohort_attendance').select('*', { count: 'exact', head: true }).eq('status', 'late'),
    db
      .from('cohort_sessions')
      .select('id, session_date, instructor_name, modality')
      .order('session_date', { ascending: false })
      .limit(8),
  ]);

  const total = (presentCount ?? 0) + (absentCount ?? 0) + (lateCount ?? 0);
  const attendanceRate = total > 0 ? Math.round(((presentCount ?? 0) / total) * 100) : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-red-600 mb-0.5">
            Program Holder Portal
          </p>
          <h1 className="text-xl font-bold text-slate-900">Attendance</h1>
        </div>
        <Link
          href="/program-holder/portal"
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Portal
        </Link>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {[
            {
              label: 'Attendance Rate',
              value: `${attendanceRate}%`,
              icon: CheckCircle,
              color: 'text-brand-green-500',
            },
            {
              label: 'Present',
              value: presentCount ?? 0,
              icon: CheckCircle,
              color: 'text-brand-green-500',
            },
            { label: 'Absent', value: absentCount ?? 0, icon: XCircle, color: 'text-red-500' },
            { label: 'Late', value: lateCount ?? 0, icon: Clock, color: 'text-amber-500' },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-slate-200 bg-white p-5">
                <Icon className={`w-5 h-5 ${s.color} mb-3`} />
                <p className="text-2xl font-extrabold text-slate-900">{s.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-red-500" /> Recent Sessions
              </h2>
            </div>
            {!sessions?.length ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">
                No sessions found.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {sessions.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {s.instructor_name ?? 'Session'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {s.session_date ? new Date(s.session_date).toLocaleDateString() : '—'}
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                      {s.modality ?? 'hybrid'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-brand-red-500" /> Recent Records
              </h2>
            </div>
            {!recentAttendance?.length ? (
              <div className="px-6 py-10 text-center text-slate-400 text-sm">
                No attendance records yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentAttendance.map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between px-6 py-3">
                    <div>
                      <p className="text-xs text-slate-400">
                        {new Date(a.created_at).toLocaleDateString()}
                      </p>
                      {a.minutes_attended && (
                        <p className="text-xs text-slate-500">{a.minutes_attended} min</p>
                      )}
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        a.status === 'present'
                          ? 'bg-brand-green-50 text-brand-green-700'
                          : a.status === 'absent'
                            ? 'bg-red-50 text-red-700'
                            : a.status === 'late'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {a.status}
                    </span>
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
