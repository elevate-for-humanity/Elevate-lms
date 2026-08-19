import Link from 'next/link';
import { Calendar, CheckCircle2, Plus, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Attendance | Host Shop Portal',
  description: 'View attendance records scoped to apprentices assigned to this host shop.',
  robots: { index: false, follow: false },
};

export default async function HostShopAttendancePage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const db = await requireAdminClient();
  const placementIds = board.apprentices.map((apprentice) => apprentice.id).filter(Boolean);

  const [{ data: sessions, error: sessionsError }, attendanceResult] = await Promise.all([
    db.from('attendance_sessions').select('id, title, scheduled_at, status, created_at').eq('host_id', user.id).order('scheduled_at', { ascending: false }).limit(25),
    placementIds.length
      ? db.from('host_shop_attendance_records').select('id, placement_id, student_id, attendance_date, status, notes, recorded_by, created_at, updated_at').eq('partner_id', board.partner.id).in('placement_id', placementIds).order('attendance_date', { ascending: false }).order('created_at', { ascending: false }).limit(100)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const attendance = attendanceResult.data ?? [];
  const attendanceError = attendanceResult.error;
  const apprenticeByPlacement = new Map(board.apprentices.map((apprentice) => [apprentice.id, apprentice]));
  const presentCount = attendance.filter((record) => record.status === 'present').length;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{board.partner?.name || 'Host Shop'}</p><h1 className="mt-2 text-3xl font-black text-slate-950">Attendance Tracking</h1><p className="mt-2 text-slate-600">Attendance is limited to active placements assigned to this Host Shop.</p></div>
        <div className="flex flex-wrap gap-2">
          <Link href="/host-shop/dashboard/attendance/record" className="inline-flex items-center gap-2 rounded-xl bg-brand-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-800"><Plus className="h-4 w-4" /> Record attendance</Link>
          <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Back to dashboard</Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Users className="h-5 w-5 text-brand-blue-700" /><p className="mt-3 text-3xl font-black text-slate-950">{board.apprentices.length}</p><p className="text-sm text-slate-600">Active apprentices</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><Calendar className="h-5 w-5 text-purple-700" /><p className="mt-3 text-3xl font-black text-slate-950">{attendance.length}</p><p className="text-sm text-slate-600">Attendance records</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5"><CheckCircle2 className="h-5 w-5 text-brand-green-700" /><p className="mt-3 text-3xl font-black text-slate-950">{presentCount}</p><p className="text-sm text-slate-600">Present records</p></div>
      </div>

      {sessionsError || attendanceError ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-900">Some attendance data could not be loaded. No records from another shop are substituted.</div> : null}

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="font-black text-slate-950">Recorded attendance</h2></div>
        {attendance.length === 0 ? (
          <div className="px-6 py-12 text-center"><Calendar className="mx-auto h-10 w-10 text-slate-300" /><h3 className="mt-3 font-bold text-slate-900">No attendance recorded yet</h3><p className="mt-1 text-sm text-slate-500">New records saved through the Host Shop attendance form will appear here.</p></div>
        ) : (
          <div className="divide-y divide-slate-200">
            {attendance.map((record) => {
              const apprentice = apprenticeByPlacement.get(record.placement_id);
              return <article key={record.id} className="px-5 py-4 sm:px-6"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-black text-slate-950">{apprentice?.name || 'Assigned apprentice'}</p><p className="mt-1 text-sm text-slate-500">{apprentice?.email || ''}</p>{record.notes ? <p className="mt-2 text-sm text-slate-700">{record.notes}</p> : null}</div><div className="text-left sm:text-right"><span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize text-slate-800">{record.status}</span><p className="mt-2 text-sm font-semibold text-slate-700">{new Date(`${record.attendance_date}T00:00:00`).toLocaleDateString()}</p></div></div></article>;
            })}
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 px-5 py-4 sm:px-6"><h2 className="font-black text-slate-950">Hosted sessions</h2></div>
        {!sessions?.length ? <p className="px-6 py-8 text-sm text-slate-500">No attendance sessions are recorded for this host account.</p> : (
          <div className="divide-y divide-slate-200">
            {sessions.map((session) => <div key={session.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="font-semibold text-slate-900">{session.title || 'Training session'}</p><p className="text-sm text-slate-500">{session.scheduled_at ? new Date(session.scheduled_at).toLocaleString() : 'Time not set'} · {session.status || 'recorded'}</p></div>)}
          </div>
        )}
      </section>
    </main>
  );
}
