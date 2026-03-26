import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/attendance' },
  title: 'Attendance | Elevate For Humanity',
  description: 'View your course attendance records.',
};

export default async function AttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get user's enrollments to find their attendance
  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('id, course_id, courses(title)')
    .eq('user_id', user.id);

  const enrollmentIds = enrollments?.map(e => e.id) || [];

  const { data: attendance } = enrollmentIds.length > 0
    ? await supabase
        .from('attendance_hours')
        .select('*')
        .in('enrollment_id', enrollmentIds)
        .order('date', { ascending: false })
        .limit(50)
    : { data: [] };

  // Build enrollment lookup for course titles
  const enrollmentMap = new Map(enrollments?.map(e => [e.id, e]) || []);

  const totalHoursLogged = attendance?.reduce((sum: number, a: any) => sum + (a.hours_logged || 0), 0) || 0;
  const verifiedCount = attendance?.filter((a: any) => a.verified).length || 0;
  const totalCount = attendance?.length || 0;

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/lms/dashboard" className="hover:text-primary">LMS</Link></li><li>/</li><li className="text-gray-900 font-medium">Attendance</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600 mt-2">Track your course attendance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Hours Logged</h3>
            <p className="text-3xl font-bold text-brand-green-600 mt-2">{totalHoursLogged.toFixed(1)}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Verified Sessions</h3>
            <p className="text-3xl font-bold text-brand-blue-600 mt-2">{verifiedCount}</p>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-sm font-medium text-gray-500">Total Sessions</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalCount}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><h2 className="font-semibold">Attendance History</h2></div>
          <div className="divide-y">
            {attendance && attendance.length > 0 ? attendance.map((record: any) => {
              const enrollment = enrollmentMap.get(record.enrollment_id);
              const courseTitle = (enrollment as any)?.courses?.title || 'Course';
              return (
              <div key={record.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">{courseTitle}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(record.date).toLocaleDateString()} &middot; {record.hours_logged}h &middot; {record.type}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {record.verified ? (
                    <span className="px-2 py-1 rounded-full text-xs bg-brand-green-100 text-brand-green-800">Verified</span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">Pending</span>
                  )}
                </div>
              </div>
              );
            }) : <div className="p-8 text-center text-gray-500">No attendance records yet. Your instructor will log your hours.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
