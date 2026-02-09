import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, GraduationCap, Clock, TrendingUp, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'Students | Partner Portal | Elevate For Humanity',
  description: 'View and manage referred students.',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function PartnerStudentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partner/students');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', user.id)
    .single();

  if (!profile || !['delegate', 'program_holder', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Get partner's program holder record if applicable
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('id, name')
    .eq('owner_id', user.id)
    .single();

  // Fetch students referred by this partner
  const { data: enrollments, count: totalStudents } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      progress,
      funding_type,
      enrolled_at,
      completed_at,
      student:profiles!enrollments_student_id_fkey(id, full_name, email, created_at),
      program:programs(id, name, slug)
    `, { count: 'exact' })
    .eq(programHolder ? 'program_holder_id' : 'delegate_id', programHolder?.id || user.id)
    .order('enrolled_at', { ascending: false });

  // Calculate stats
  const activeCount = enrollments?.filter(e => e.status === 'active').length || 0;
  const completedCount = enrollments?.filter(e => e.status === 'completed').length || 0;
  const avgProgress = enrollments?.length 
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Students' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Referred Students</h1>
            <p className="text-gray-600">Students enrolled through your organization</p>
          </div>
          <Link href="/partner/refer" className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600">
            Refer New Student
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalStudents || 0}</p>
            <p className="text-gray-600 text-sm">Total Students</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Clock className="w-8 h-8 text-green-500 mb-2" />
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-gray-600 text-sm">Active</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <GraduationCap className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-gray-600 text-sm">Completed</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <TrendingUp className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{avgProgress}%</p>
            <p className="text-gray-600 text-sm">Avg Progress</p>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search students..." 
                className="w-full md:w-80 pl-10 pr-4 py-2 border rounded-lg" />
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Student</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Program</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Funding</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Progress</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enrollments && enrollments.length > 0 ? (
                enrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <Link href={`/partner/students/${enrollment.student?.id}`} className="hover:text-orange-600">
                        <p className="font-medium">{enrollment.student?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{enrollment.student?.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-4 text-sm">{enrollment.program?.name || 'N/A'}</td>
                    <td className="px-4 py-4">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs uppercase">
                        {enrollment.funding_type || 'self_pay'}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${enrollment.progress || 0}%` }} />
                        </div>
                        <span className="text-sm">{enrollment.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${
                        enrollment.status === 'active' ? 'bg-green-100 text-green-700' :
                        enrollment.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        enrollment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {enrollment.enrolled_at ? new Date(enrollment.enrolled_at).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium">No students yet</p>
                    <p className="text-sm">Students you refer will appear here</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
