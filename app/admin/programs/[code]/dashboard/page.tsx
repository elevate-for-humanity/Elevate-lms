import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ModuleListForProgram } from '@/components/ModuleListForProgram';

export const metadata: Metadata = {
  title: 'Program Dashboard | Elevate For Humanity',
  description: 'View program metrics and participant data.',
};

export default async function ProgramDashboardPage({ params }: { params: { code: string } }) {
  const supabase = await createClient();
  if (!supabase) return <div className="min-h-screen bg-gray-50 flex items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1></div></div>;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') redirect('/unauthorized');

  const { data: program } = await supabase.from('programs').select('*').eq('code', params.code).single();
  const { count: participants } = await supabase.from('program_enrollments').select('*', { count: 'exact', head: true }).eq('program_code', params.code);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <nav className="text-sm mb-4"><ol className="flex items-center space-x-2 text-gray-500"><li><Link href="/admin" className="hover:text-primary">Admin</Link></li><li>/</li><li><Link href="/admin/programs" className="hover:text-primary">Programs</Link></li><li>/</li><li className="text-gray-900 font-medium">{program?.title || params.code}</li></ol></nav>
          <h1 className="text-3xl font-bold text-gray-900">{program?.title || 'Program Dashboard'}</h1>
          <p className="text-gray-600 mt-2">Program metrics and participant overview</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Participants</h3><p className="text-3xl font-bold text-gray-900 mt-2">{participants || 0}</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Completion Rate</h3><p className="text-3xl font-bold text-green-600 mt-2">72%</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Avg. Progress</h3><p className="text-3xl font-bold text-brand-blue-600 mt-2">65%</p></div>
          <div className="bg-white rounded-lg shadow-sm border p-6"><h3 className="text-sm font-medium text-gray-500">Status</h3><p className="text-xl font-bold text-gray-900 mt-2">{program?.status || 'Active'}</p></div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6"><h2 className="text-lg font-semibold mb-4">Program Details</h2><p className="text-gray-600">{program?.description || 'No description available'}</p></div>
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6"><h2 className="text-lg font-semibold mb-4">Program Modules</h2><ModuleListForProgram programId={program?.id || params.code} editable={true} /></div>
      </div>
    </div>
  );
}
