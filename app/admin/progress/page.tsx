import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.elevateforhumanity.org/admin/progress' },
  title: 'Progress Tracking | Elevate For Humanity',
  description: 'Track learner progress across courses and programs.',
};

export default async function ProgressPage() {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { count: totalEnrollments } = await supabase.from('enrollments').select('*', { count: 'exact', head: true });
  const { count: inProgress } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
  const { count: completed } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('status', 'completed');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li className="text-gray-900 font-medium">Progress</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
          <p className="text-gray-600 mt-2">Monitor learner progress across all courses</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Total Enrollments</h3><p className="text-3xl font-bold text-gray-900 mt-2">{totalEnrollments || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">In Progress</h3><p className="text-3xl font-bold text-blue-600 mt-2">{inProgress || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Completed</h3><p className="text-3xl font-bold text-green-600 mt-2">{completed || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Completion Rate</h3><p className="text-3xl font-bold text-blue-600 mt-2">{totalEnrollments ? Math.round((completed || 0) / totalEnrollments * 100) : 0}%</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Progress Overview</h2><p className="text-gray-500">Detailed progress tracking and analytics</p></div>
      </div>
    </div>
  );
}
