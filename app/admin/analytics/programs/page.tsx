import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/analytics/programs',
  },
  title: 'Program Analytics | Elevate For Humanity',
  description: 'Track program performance, participant outcomes, and success metrics.',
};

export default async function ProgramAnalyticsPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();



  // Fetch program analytics
  const { count: totalPrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true });

  const { count: activePrograms } = await supabase
    .from('programs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const { count: totalParticipants } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true });

  const { count: completedParticipants } = await supabase
    .from('program_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  const completionRate = totalParticipants 
    ? Math.round(((completedParticipants || 0) / totalParticipants) * 100) 
    : 0;

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="text-sm mb-4">
            <ol className="flex items-center space-x-2 text-gray-500">
              <li><Link href="/admin" className="hover:text-primary">Admin</Link></li>
              <li>/</li>
              <li><Link href="/admin/analytics" className="hover:text-primary">Analytics</Link></li>
              <li>/</li>
              <li className="text-gray-900 font-medium">Programs</li>
            </ol>
          </nav>
          <h1 className="text-3xl font-bold text-gray-900">Program Analytics</h1>
          <p className="text-gray-600 mt-2">Track program performance and participant outcomes</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Total Programs</h3>
              <span className="text-brand-blue-600 bg-brand-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalPrograms || 0}</p>
            <p className="text-sm text-gray-500 mt-1">All programs</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Active Programs</h3>
              <span className="text-brand-green-600 bg-brand-green-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{activePrograms || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Currently running</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Participants</h3>
              <span className="text-brand-blue-600 bg-brand-blue-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{totalParticipants || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total enrolled</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-500">Completion Rate</h3>
              <span className="text-brand-orange-600 bg-brand-orange-100 p-2 rounded-lg">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </span>
            </div>
            <p className="text-3xl font-bold text-gray-900 mt-2">{completionRate}%</p>
            <p className="text-sm text-gray-500 mt-1">Program completion</p>
          </div>
        </div>

        {/* Programs List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold">Recent Programs</h2>
            <p className="text-sm text-gray-500">Latest program activity</p>
          </div>
          <div className="divide-y">
            {programs && programs.length > 0 ? (
              programs.map((program: any) => (
                <div key={program.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-gray-900">{program.title}</p>
                    <p className="text-sm text-gray-500">
                      Created {new Date(program.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    program.status === 'active' 
                      ? 'bg-brand-green-100 text-brand-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {program.status || 'draft'}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                No programs found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
