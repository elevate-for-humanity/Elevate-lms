import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/lms/attendance' },
  title: 'Attendance | Elevate For Humanity',
  description: 'View your course attendance records.',
};

export default async function AttendancePage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: attendance } = await supabase.from('attendance').select('*, courses!inner(title)').eq('user_id', user.id).order('date', { ascending: false }).limit(30);
  const presentCount = attendance?.filter((a: any) => a.status === 'present').length || 0;
  const totalCount = attendance?.length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/lms" className="hover:text-primary">LMS</Link></li><li>/</li><li className="text-gray-900 font-medium">Attendance</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="text-gray-600 mt-2">Track your course attendance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Attendance Rate</h3><p className="text-3xl font-bold text-green-600 mt-2">{totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0}%</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Classes Attended</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">{presentCount}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Total Classes</h3><p className="text-3xl font-bold text-gray-900 mt-2">{totalCount}</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><h2 className="font-semibold">Attendance History</h2></div>
          <div className="divide-y">
            {attendance && attendance.length > 0 ? attendance.map((record: any) => (
              <div key={record.id} className="p-4 flex items-center justify-between">
                <div><p className="font-medium">{record.courses?.title || 'Course'}</p><p className="text-sm text-gray-500">{new Date(record.date).toLocaleDateString()}</p></div>
                <span className={`px-2 py-1 rounded-full text-xs ${record.status === 'present' ? 'bg-green-100 text-green-800' : record.status === 'absent' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{record.status}</span>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No attendance records</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
