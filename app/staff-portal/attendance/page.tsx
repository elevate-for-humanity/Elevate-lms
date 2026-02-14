export const dynamic = 'force-dynamic';

import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Attendance | Staff Portal',
  description: 'Manage and track student attendance records.',
  robots: { index: false, follow: false },
};

export default async function StaffPortalAttendancePage() {
  const supabase = await createClient();

  // Fetch attendance records from database
  const { data: attendanceRecords } = await supabase
    .from('attendance_hours')
    .select(`
      id,
      date,
      hours_worked,
      status,
      apprentices (
        id,
        profiles (
          full_name
        )
      )
    `)
    .order('date', { ascending: false })
    .limit(20);

  // Fetch today's sessions/cohorts
  const { data: cohorts } = await supabase
    .from('cohorts')
    .select('id, name, start_date, end_date')
    .eq('status', 'active')
    .limit(5);

  const records = attendanceRecords || [];
  const activeCohorts = cohorts || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Staff Portal', href: '/staff-portal' }, { label: 'Attendance' }]} />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Attendance Management</h1>
      
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Link href="/staff-portal/attendance/take" className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">
            Take Attendance
          </Link>
          <Link href="/staff-portal/attendance/export" className="border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50">
            Export Report
          </Link>
        </div>

        {/* Active Cohorts */}
        <section className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Active Cohorts</h2>
          {activeCohorts.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-4">
              {activeCohorts.map((cohort) => (
                <div key={cohort.id} className="border rounded-lg p-4">
                  <h3 className="font-medium">{cohort.name}</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(cohort.start_date).toLocaleDateString()} - {new Date(cohort.end_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No active cohorts found.</p>
          )}
        </section>

        {/* Attendance Records */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Attendance Records</h2>
          {records.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Student</th>
                    <th className="text-left py-2">Date</th>
                    <th className="text-center py-2">Hours</th>
                    <th className="text-center py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record: any) => (
                    <tr key={record.id} className="border-b">
                      <td className="py-3">{record.apprentices?.profiles?.full_name || 'Unknown'}</td>
                      <td className="py-3 text-gray-600">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="py-3 text-center">{record.hours_worked || 0}</td>
                      <td className="py-3 text-center">
                        <span className={`px-2 py-1 rounded text-sm ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status || 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500">No attendance records found. Records will appear here once attendance is taken.</p>
          )}
          <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
            <span><span className="text-green-600">●</span> Present</span>
            <span><span className="text-red-600">✗</span> Absent</span>
            <span><span className="text-yellow-600">L</span> Late</span>
            <span><span className="text-brand-blue-600">E</span> Excused</span>
          </div>
        </section>
      </div>
    </div>
  );
}
