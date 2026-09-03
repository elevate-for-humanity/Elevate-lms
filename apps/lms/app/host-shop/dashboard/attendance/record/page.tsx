import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Users } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import AttendanceRecordForm from './AttendanceRecordForm';

export const metadata = {
  title: 'Record Attendance | Host Shop Portal',
  description: 'Record attendance for apprentices actively assigned to this host shop.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function RecordAttendancePage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);

  const students = board.apprentices.map((apprentice) => ({
    placementId: apprentice.id,
    studentId: apprentice.student_id,
    name: apprentice.name,
    email: apprentice.email,
    programSlug: apprentice.program_slug || board.programType,
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link
        href="/host-shop/dashboard/attendance"
        className="inline-flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" /> Back to attendance
      </Link>

      <section className="mt-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">
          {board.partner?.name || 'Host Shop'}
        </p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Record Apprentice Attendance</h1>
        <p className="mt-2 text-slate-600">
          Only apprentices with an active placement at this Host Shop can be recorded here.
        </p>

        {students.length > 0 ? (
          <div className="mt-7">
            <AttendanceRecordForm students={students} />
          </div>
        ) : (
          <div className="mt-7 rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-slate-300" />
            <h2 className="mt-3 text-xl font-black text-slate-950">No active apprentices assigned</h2>
            <p className="mt-2 text-sm text-slate-600">
              Attendance cannot be recorded until an approved apprentice placement is active for this shop.
            </p>
            <Link
              href="/host-shop/dashboard/match-requests"
              className="mt-5 inline-flex rounded-xl bg-brand-blue-700 px-4 py-2 text-sm font-black text-white hover:bg-brand-blue-800"
            >
              Review match requests
            </Link>
          </div>
        )}

        <div className="mt-7 rounded-2xl border border-brand-green-200 bg-brand-green-50 p-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 text-brand-green-700" />
            <p className="text-sm font-semibold text-brand-green-950">
              The server validates the signed-in Host Shop, active shop location, placement ID, student ID, and tenant before saving attendance.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
