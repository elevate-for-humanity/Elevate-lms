import Link from 'next/link';
import { Calendar, Clock, Plus, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Attendance | Host Shop Portal',
  description: 'View attendance records scoped to apprentices assigned to this host shop.',
  robots: { index: false, follow: false },
};

function weeklyHours(record: any) {
  return [
    record.mon_hours,
    record.tue_hours,
    record.wed_hours,
    record.thu_hours,
    record.fri_hours,
    record.sat_hours,
    record.sun_hours,
  ].reduce((sum, value) => sum + (Number.parseFloat(String(value ?? '0')) || 0), 0);
}

export default async function HostShopAttendancePage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const supabase = await createClient();
  const studentIds = board.apprentices.map((apprentice) => apprentice.student_id).filter(Boolean);

  const [{ data: sessions, error: sessionsError }, weeklyResult] = await Promise.all([
    supabase
      .from('attendance_sessions')
      .select('id, title, scheduled_at, status, created_at')
      .eq('host_id', user.id)
      .order('scheduled_at', { ascending: false })
      .limit(25),
    studentIds.length
      ? supabase
          .from('partner_attendance')
          .select('id, student_id, program_slug, mon_hours, tue_hours, wed_hours, thu_hours, fri_hours, sat_hours, sun_hours, notes, created_at')
          .in('student_id', studentIds)
          .order('created_at', { ascending: false })
          .limit(25)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const weeklyRecords = weeklyResult.data ?? [];
  const weeklyError = weeklyResult.error;
  const nameByStudent = new Map(
    board.apprentices.map((apprentice) => [apprentice.student_id, apprentice.name]),
  );
  const totalWeeklyHours = weeklyRecords.reduce((sum, record) => sum + weeklyHours(record), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">
            {board.partner?.name || 'Host Shop'}
          </p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Attendance Tracking</h1>
          <p className="mt-2 text-slate-600">Attendance is limited to the signed-in host and apprentices actively placed at this shop.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/host-shop/dashboard/attendance/record" className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-800">
            <Plus className="h-4 w-4" /> Record attendance
          </Link>
          <Link href="/host-shop/dashboard/board" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">
            Back to board
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Users className="h-5 w-5 text-brand-blue-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{board.apprentices.length}</p>
          <p className="text-sm text-slate-600">Active apprentices</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Calendar className="h-5 w-5 text-purple-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{sessions?.length ?? 0}</p>
          <p className="text-sm text-slate-600">Hosted sessions</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <Clock className="h-5 w-5 text-amber-700" />
          <p className="mt-3 text-3xl font-black text-slate-950">{totalWeeklyHours.toFixed(1)}h</p>
          <p className="text-sm text-slate-600">Weekly attendance hours shown</p>
        </div>
      </div>

      {sessionsError || weeklyError ? (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">
          Some attendance data could not be loaded. No records from other shops are substituted.
        </div>
      ) : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="font-black text-slate-950">Weekly apprentice records</h2>
        </div>
        {weeklyRecords.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Calendar className="mx-auto h-10 w-10 text-slate-300" />
            <h3 className="mt-3 font-bold text-slate-900">No weekly attendance recorded</h3>
            <p className="mt-1 text-sm text-slate-500">Attendance for actively assigned apprentices will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {weeklyRecords.map((record) => (
              <article key={record.id} className="px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-black text-slate-950">{nameByStudent.get(record.student_id) || 'Assigned apprentice'}</p>
                    <p className="mt-1 text-sm capitalize text-slate-600">{(record.program_slug || board.programType || 'apprenticeship').replace(/[-_]/g, ' ')}</p>
                    {record.notes ? <p className="mt-2 text-sm text-slate-500">{record.notes}</p> : null}
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-black text-slate-950">{weeklyHours(record).toFixed(1)} hours</p>
                    <p className="mt-1 text-xs text-slate-500">{record.created_at ? new Date(record.created_at).toLocaleString() : 'Date unavailable'}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6">
          <h2 className="font-black text-slate-950">Hosted sessions</h2>
        </div>
        {!sessions?.length ? (
          <p className="px-6 py-8 text-sm text-slate-500">No attendance sessions are recorded for this host account.</p>
        ) : (
          <div className="divide-y divide-slate-200">
            {sessions.map((session) => (
              <div key={session.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                <p className="font-semibold text-slate-900">{session.title || 'Training session'}</p>
                <p className="text-sm text-slate-500">{session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Time not set'} · {session.status || 'recorded'}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
