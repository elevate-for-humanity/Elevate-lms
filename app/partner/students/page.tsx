import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Users, GraduationCap, Clock, TrendingUp, Search } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getMyPartnerContext } from '@/lib/partner/access';
import { getPartnerStudentsWithTraining } from '@/lib/partner/students';

export const metadata: Metadata = {
  title: 'Students | Partner Portal',
  description: 'View and manage referred students.',
};

export const dynamic = 'force-dynamic';

export default async function PartnerStudentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/partner/students');
  }

  const ctx = await getMyPartnerContext();
  if (!ctx) {
    redirect('/login');
  }

  const shopIds = ctx.shops.map((s) => s.shop_id).filter(Boolean);
  const students = await getPartnerStudentsWithTraining(shopIds);
  const rows = students.flatMap((student) => {
    if (!student.courses.length) {
      return [
        {
          id: `${student.student_id}-none`,
          status: student.placement_status || 'active',
          progress: student.overall_progress || 0,
          funding_type: null,
          created_at: student.placement_start,
          student: {
            id: student.student_id,
            full_name: student.student_name,
            email: student.student_email,
          },
          program: {
            name: 'Not enrolled yet',
          },
        },
      ];
    }

    return student.courses.map((course) => ({
      id: `${student.student_id}-${course.course_id}`,
      status: course.status || student.placement_status || 'active',
      progress: course.progress || 0,
      funding_type: null,
      created_at: course.enrolled_at || student.placement_start,
      student: {
        id: student.student_id,
        full_name: student.student_name,
        email: student.student_email,
      },
      program: {
        name: course.course_title,
      },
    }));
  });

  const enrollments = rows;
  const totalStudents = students.length;

  // Calculate stats
  const activeCount = enrollments?.filter((e) => e.status === 'active').length || 0;
  const completedCount = enrollments?.filter((e) => e.status === 'completed').length || 0;
  const avgProgress = enrollments?.length
    ? Math.round(enrollments.reduce((sum, e) => sum + (e.progress || 0), 0) / enrollments.length)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Partner', href: '/partner' }, { label: 'Students' }]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Referred Students</h1>
            <p className="text-slate-600">Students enrolled through your organization</p>
          </div>
          <Link
            href="/partner/programs"
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Refer New Student
          </Link>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 border">
            <Users className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{totalStudents || 0}</p>
            <p className="text-slate-600 text-sm">Total Students</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <Clock className="w-8 h-8 text-brand-green-500 mb-2" />
            <p className="text-2xl font-bold">{activeCount}</p>
            <p className="text-slate-600 text-sm">Active</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <GraduationCap aria-label="graduationcap" className="w-8 h-8 text-blue-500 mb-2" />
            <p className="text-2xl font-bold">{completedCount}</p>
            <p className="text-slate-600 text-sm">Completed</p>
          </div>
          <div className="bg-white rounded-xl p-6 border">
            <TrendingUp className="w-8 h-8 text-orange-500 mb-2" />
            <p className="text-2xl font-bold">{avgProgress}%</p>
            <p className="text-slate-600 text-sm">Avg Progress</p>
          </div>
        </div>

        {/* Students Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search students..."
                className="w-full md:w-80 pl-10 pr-4 py-2 border rounded-lg"
              />
            </div>
          </div>
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Student</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Program</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Funding</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Progress</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-slate-600">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enrollments && enrollments.length > 0 ? (
                enrollments.map((enrollment: any) => (
                  <tr key={enrollment.id} className="hover:bg-slate-50">
                    <td className="px-4 py-4">
                      <Link
                        href={`/partner/students/${enrollment.student?.id}`}
                        className="hover:text-orange-600"
                      >
                        <p className="font-medium">{enrollment.student?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-slate-500">{enrollment.student?.email}</p>
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
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${enrollment.progress || 0}%` }}
                          />
                        </div>
                        <span className="text-sm">{enrollment.progress || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          enrollment.status === 'active'
                            ? 'bg-brand-green-100 text-brand-green-700'
                            : enrollment.status === 'completed'
                              ? 'bg-blue-100 text-blue-700'
                              : enrollment.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {enrollment.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {enrollment.created_at
                        ? new Date(enrollment.created_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <Users className="w-12 h-12 mx-auto mb-3 text-slate-300" />
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
