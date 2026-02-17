import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, Search, Mail, GraduationCap, Clock } from 'lucide-react';
import { safeFormatDate } from '@/lib/format-utils';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  title: 'My Students | Instructor Portal',
  description: 'View and manage your enrolled students.',
};

export const dynamic = 'force-dynamic';

export default async function InstructorStudentsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['instructor', 'admin', 'super_admin'].includes(profile.role)) {
    redirect('/');
  }

  // Get students enrolled in instructor's courses
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select(`
      id,
      status,
      progress,
      enrolled_at,
      completed_at,
      profiles:user_id (
        id,
        full_name,
        email
      ),
      programs (
        name
      )
    `)
    .order('enrolled_at', { ascending: false })
    .limit(100);

  const activeStudents = enrollments?.filter(e => e.status === 'active') || [];
  const completedStudents = enrollments?.filter(e => e.status === 'completed') || [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Instructor', href: '/instructor' }, { label: 'Students' }]} />
        </div>
      </div>

      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Students</h1>
              <p className="text-gray-600">View and manage enrolled students</p>
            </div>
            <Link href="/instructor/dashboard" className="px-4 py-2 text-gray-600 hover:text-gray-900">
              ← Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="text-2xl font-bold">{enrollments?.length || 0}</div>
                <div className="text-sm text-gray-600">Total Students</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold">{activeStudents.length}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 flex-shrink-0">•</span>
              <div>
                <div className="text-2xl font-bold">{completedStudents.length}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-blue-500"
            />
          </div>
        </div>

        {/* Students List */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Program</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrolled</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enrollments && enrollments.length > 0 ? (
                enrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-brand-blue-100 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-brand-blue-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {enrollment.profiles?.full_name || 'Student'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {enrollment.profiles?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {enrollment.programs?.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-brand-blue-600 rounded-full"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{enrollment.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        enrollment.status === 'completed' 
                          ? 'bg-brand-green-100 text-brand-green-800'
                          : enrollment.status === 'active'
                          ? 'bg-brand-blue-100 text-brand-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {safeFormatDate(enrollment.enrolled_at)}
                    </td>
                    <td className="px-6 py-4">
                      {enrollment.profiles?.email && (
                        <a
                          href={`mailto:${enrollment.profiles.email}`}
                          className="text-brand-blue-600 hover:text-brand-blue-800"
                        >
                          <Mail className="w-5 h-5" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>No students enrolled yet.</p>
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
