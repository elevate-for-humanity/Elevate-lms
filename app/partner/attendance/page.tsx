import { Metadata } from 'next';
import Link from 'next/link';
import { Calendar, Users, CheckCircle, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Attendance | Partner Portal',
  description: 'Track and manage student attendance for your training sessions.',
};

type SessionItem = { id: string; title: string; date: string; time: string; present: number; absent: number; total: number };

export default async function PartnerAttendancePage() {
  const supabase = await createClient();
  let sessions: SessionItem[] = [];

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: partner } = await supabase
        .from('partners')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (partner) {
        const { data: sessionData } = await supabase
          .from('partner_sessions')
          .select('id, title, scheduled_date, start_time, end_time, present_count, absent_count, enrolled_count')
          .eq('partner_id', partner.id)
          .order('scheduled_date', { ascending: false })
          .limit(10);

        if (sessionData && sessionData.length > 0) {
          sessions = sessionData.map((s: any) => ({
            id: s.id,
            title: s.title,
            date: s.scheduled_date,
            time: `${s.start_time} - ${s.end_time}`,
            present: s.present_count || 0,
            absent: s.absent_count || 0,
            total: s.enrolled_count || 0,
          }));
        }
      }
    }
  } catch (error) {
    console.error('[Attendance] Error:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Attendance' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Attendance Tracking</h1>
            <p className="text-gray-600 mt-1">Manage attendance for your training sessions</p>
          </div>
          <Link href="/partner/attendance/record" className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">
            <Plus className="w-5 h-5" /> Record Attendance
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-brand-blue-600" />
              <span className="text-sm text-gray-600">Total Sessions</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">{sessions.length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-sm text-gray-600">Avg Attendance Rate</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {sessions.length > 0 
                ? Math.round(sessions.reduce((acc, s) => acc + (s.present / s.total * 100), 0) / sessions.length)
                : 0}%
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-6 h-6 text-brand-blue-600" />
              <span className="text-sm text-gray-600">Total Students</span>
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {sessions.reduce((acc, s) => acc + s.total, 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Recent Sessions</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Session</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Date</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Time</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Present</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Absent</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Rate</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{session.title}</td>
                  <td className="px-6 py-4 text-gray-600">{new Date(session.date).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-gray-600">{session.time}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-medium">{session.present}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600 font-medium">{session.absent}</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      (session.present / session.total * 100) >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {Math.round(session.present / session.total * 100)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Link href={`/partner/attendance/${session.id}`} className="text-brand-blue-600 hover:underline text-sm">
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
