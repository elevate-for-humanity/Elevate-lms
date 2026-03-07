import Image from 'next/image';
import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Users, Plus, AlertTriangle, QrCode } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import {
  getAttendanceSummary,
  getStudentsWithLowAttendance,
  type AttendanceSession,
} from '@/lib/blended-learning/attendance';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Attendance | Partner Portal',
  description: 'Track and manage student attendance for your training sessions.',
  robots: { index: false, follow: false },
};

export default async function PartnerAttendancePage() {
  const supabase = await createClient();
  if (!supabase) redirect('/login');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/partner/login');

  const db = createAdminClient() || supabase;

  let sessions: any[] = [];
  let summary: any = null;
  let lowAttendance: any[] = [];

  try {
    // Get partner org
    const { data: partnerUser } = await db
      .from('partner_users')
      .select('partner_id')
      .eq('user_id', user.id)
      .single();

    const orgId = partnerUser?.partner_id;

    // Fetch attendance sessions
    const { data: sessionData } = await db
      .from('attendance_sessions')
      .select('*')
      .order('date', { ascending: false })
      .limit(20);
    sessions = sessionData || [];

    // Get summary using the lib
    if (orgId) {
      summary = await getAttendanceSummary(orgId);
      lowAttendance = await getStudentsWithLowAttendance(orgId, 75);
    }

    // Also pull from partner_attendance for weekly records
    const { data: weeklyRecords } = await db
      .from('partner_attendance')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Merge weekly records into sessions view if no attendance_sessions data
    if (sessions.length === 0 && weeklyRecords && weeklyRecords.length > 0) {
      sessions = weeklyRecords.map((r: any) => ({
        id: r.id,
        title: r.program_slug?.replace(/-/g, ' ') || 'Training Session',
        date: r.created_at,
        status: 'completed',
        total_hours: [r.mon_hours, r.tue_hours, r.wed_hours, r.thu_hours, r.fri_hours, r.sat_hours, r.sun_hours]
          .reduce((a: number, b: string) => a + (parseFloat(b) || 0), 0),
        notes: r.notes,
      }));
    }
  } catch {
    // Tables may not exist yet
  }

  const totalSessions = sessions.length;
  const avgRate = summary?.averageAttendanceRate ?? 0;
  const totalStudents = summary?.totalStudents ?? 0;

  return (
    <div>

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px] overflow-hidden">
        <Image src="/images/pages/partner-page-2.jpg" alt="Partner attendance" fill sizes="100vw" className="object-cover" priority />
      </section>
      <div className="bg-slate-50 border-b -mx-4 -mt-6 px-4 py-3 mb-6">
        <Breadcrumbs items={[{ label: 'Partner', href: '/partner-portal' }, { label: 'Attendance' }]} />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Tracking</h1>
          <p className="text-gray-600 mt-1">Manage attendance for training sessions</p>
        </div>
        <div className="flex gap-3">
          <Link href="/partner/attendance/record"
            className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700 text-sm font-medium">
            <Plus className="w-4 h-4" /> Record Attendance
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-brand-blue-600" />
            <span className="text-sm text-gray-600">Total Sessions</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalSessions}</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <QrCode className="w-5 h-5 text-brand-green-600" />
            <span className="text-sm text-gray-600">Avg Attendance Rate</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{Math.round(avgRate)}%</p>
        </div>
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span className="text-sm text-gray-600">Total Students</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalStudents}</p>
        </div>
      </div>

      {/* Low Attendance Alert */}
      {lowAttendance.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">Low Attendance Alert</h3>
              <p className="text-amber-700 text-sm mt-1">
                {lowAttendance.length} student{lowAttendance.length > 1 ? 's' : ''} below 75% attendance threshold:
              </p>
              <ul className="mt-2 space-y-1">
                {lowAttendance.slice(0, 5).map((s: any, i: number) => (
                  <li key={i} className="text-sm text-amber-700">
                    {s.student_name || s.student_id} — {Math.round(s.rate || 0)}% attendance
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
        </div>
        {sessions.length > 0 ? (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Session</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Hours</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((s: any) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900 capitalize">{s.title || 'Session'}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">
                    {s.date ? new Date(s.date).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    {s.total_hours ?? s.duration_minutes ? `${Math.round((s.duration_minutes || 0) / 60)}h` : '—'}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      s.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700' :
                      s.status === 'active' ? 'bg-brand-blue-100 text-brand-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {s.status || 'recorded'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm truncate max-w-[200px]">{s.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-4">No attendance sessions recorded yet.</p>
            <Link href="/partner/attendance/record"
              className="text-brand-blue-600 font-medium hover:underline">
              Record your first session
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
