import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/instructors/performance' },
  title: 'Instructor Performance | Elevate For Humanity',
  description: 'Monitor instructor performance and teaching metrics.',
};

export default async function InstructorPerformancePage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: instructors } = await supabase.from('profiles').select('*').eq('role', 'instructor').limit(10);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/instructors" className="hover:text-primary">Instructors</Link></li><li>/</li><li className="text-gray-900 font-medium">Performance</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Performance</h1>
          <p className="text-gray-600 mt-2">Monitor teaching effectiveness and student outcomes</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-4 border-b"><h2 className="font-semibold">Instructor Metrics</h2></div>
          <div className="divide-y">
            {instructors && instructors.length > 0 ? instructors.map((instructor: any) => (
              <div key={instructor.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-blue-100 rounded-full flex items-center justify-center"><span className="text-brand-blue-600 font-medium">{(instructor.full_name || 'I')[0]}</span></div>
                  <div><p className="font-medium">{instructor.full_name || 'Instructor'}</p><p className="text-sm text-gray-500">{instructor.email}</p></div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="text-center"><p className="font-semibold">4.8</p><p className="text-gray-500">Rating</p></div>
                  <div className="text-center"><p className="font-semibold">156</p><p className="text-gray-500">Students</p></div>
                  <div className="text-center"><p className="font-semibold">92%</p><p className="text-gray-500">Completion</p></div>
                </div>
              </div>
            )) : <div className="p-8 text-center text-gray-500">No instructors found</div>}
          </div>
        </div>
      </div>
    </div>
  );
}
