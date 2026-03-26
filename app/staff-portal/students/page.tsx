import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/staff-portal/students' },
  title: 'Student Management | Elevate For Humanity',
  description: 'View and manage student records and progress.',
};

export default async function StudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: students, count } = await supabase.from('profiles').select('*', { count: 'exact' }).eq('role', 'student').order('created_at', { ascending: false }).limit(20);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/staff-portal" className="hover:text-primary">Staff Portal</Link></li><li>/</li><li className="text-gray-900 font-medium">Students</li></ol></nav>
          <div className="flex justify-between items-center">
            <div><h1 className="text-3xl font-bold text-gray-900">Student Management</h1><p className="text-gray-600 mt-2">{count || 0} students enrolled</p></div>
            <button className="bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">Add Student</button>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><input type="text" placeholder="Search students..." className="w-full border rounded-lg px-3 py-2" /></div>
          <div className="divide-y">
            {students && students.length > 0 ? students.map((student: any) => (
              <div key={student.id} className="p-4 flex items-center justify-between hover:bg-white">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center"><span className="text-brand-blue-600 font-medium">{(student.full_name || 'S')[0]}</span></div>
                  <div><p className="font-medium">{student.full_name || 'Student'}</p><p className="text-sm text-gray-500">{student.email}</p></div>
                </div>
                <Link href={`/staff-portal/students/${student.id}`} className="text-brand-blue-600 hover:text-brand-blue-800 text-sm">View Profile</Link>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No students found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
