import Image from 'next/image';
import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, TrendingDown, FileWarning } from 'lucide-react';

export const metadata: Metadata = {
  title: 'At-Risk Students | Admin Dashboard',
  description: 'Monitor and support at-risk students',
};

export default async function AtRiskStudentsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">

      {/* Hero Image */}
      <section className="relative h-[160px] sm:h-[220px] md:h-[280px]">
        <Image src="/images/heroes-hq/about-hero.jpg" alt="Administration" fill sizes="100vw" className="object-cover" priority />
      </section>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "At Risk" }]} />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Service Unavailable</h1>
          <p className="text-gray-600">Please try again later.</p>
        </div>
      </div>
    );
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/admin/at-risk');
  }

  const { data: profile } = await db
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch at-risk students
  const { data: atRiskStudents } = await db
    .from('student_risk_status')
    .select(
      `
      *,
      enrollments (
        id,
        start_date,
        profiles!enrollments_student_id_fkey (
          id,
          first_name,
          last_name,
          email,
          phone
        ),
        programs (
          id,
          name
        ),
        student_funding_assignments (
          funding_sources (
            name,
            code
          )
        )
      )
    `
    )
    .eq('status', 'at_risk')
    .order('overdue_count', { ascending: false });

  // Fetch needs action students
  const { data: needsActionStudents } = await db
    .from('student_risk_status')
    .select(
      `
      *,
      enrollments (
        id,
        start_date,
        profiles!enrollments_student_id_fkey (
          id,
          first_name,
          last_name,
          email
        ),
        programs (
          id,
          name
        )
      )
    `
    )
    .eq('status', 'needs_action')
    .order('overdue_count', { ascending: false });

  // Fetch programs with low completion
  const { data: programStats } = await db.from('program_enrollments').select(`
      program_id,
      status,
      programs (
        id,
        name
      )
    `);

  // Calculate program completion rates
  const programCompletion = programStats?.reduce(
    (acc: any, enrollment: any) => {
      const programId = enrollment.program_id;
      if (!acc[programId]) {
        acc[programId] = {
          name: enrollment.programs?.name,
          total: 0,
          completed: 0,
          dropped: 0,
        };
      }
      acc[programId].total++;
      if (enrollment.status === 'completed') acc[programId].completed++;
      if (enrollment.status === 'dropped') acc[programId].dropped++;
      return acc;
    },
    {}
  );

  const lowCompletionPrograms = Object.entries(programCompletion || {})
    .map(([id, stats]: [string, any]) => ({
      id,
      name: stats.name,
      completionRate:
        stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      dropoutRate:
        stats.total > 0 ? Math.round((stats.dropped / stats.total) * 100) : 0,
      total: stats.total,
    }))
    .filter((p) => p.completionRate < 70 && p.total >= 5)
    .sort((a, b) => a.completionRate - b.completionRate);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "At Risk" }]} />
        </div>
      <div className="mx-auto max-w-7xl px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">
            At-Risk Students
          </h1>
          <p className="text-black">
            Monitor and support students who need immediate attention
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-8 h-8 text-brand-red-600" />
              <div>
                <div className="text-sm text-black">At-Risk Students</div>
                <div className="text-3xl font-bold text-brand-red-600">
                  {atRiskStudents?.length || 0}
                </div>
              </div>
            </div>
            <p className="text-sm text-black mt-2">
              3+ overdue requirements or critical issues
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <FileWarning className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-sm text-black">Needs Action</div>
                <div className="text-3xl font-bold text-yellow-600">
                  {needsActionStudents?.length || 0}
                </div>
              </div>
            </div>
            <p className="text-sm text-black mt-2">
              1-2 overdue requirements
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center gap-3 mb-2">
              <TrendingDown className="w-8 h-8 text-brand-blue-600" />
              <div>
                <div className="text-sm text-black">
                  Low Completion Programs
                </div>
                <div className="text-3xl font-bold text-brand-blue-600">
                  {lowCompletionPrograms?.length || 0}
                </div>
              </div>
            </div>
            <p className="text-sm text-black mt-2">
              Programs with &lt;70% completion rate
            </p>
          </div>
        </div>

        {/* At-Risk Students List */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-brand-red-600" />
            Critical: At-Risk Students
          </h2>

          {atRiskStudents && atRiskStudents.length > 0 ? (
            <div className="space-y-4">
              {atRiskStudents.map((risk: any) => {
                const enrollment = risk.enrollments;
                const student = enrollment?.profiles;
                const program = enrollment?.programs;
                const funding =
                  enrollment?.student_funding_assignments?.[0]?.funding_sources;

                return (
                  <div
                    key={risk.id}
                    className="p-4 bg-brand-red-50 border-l-4 border-brand-red-500 rounded"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-black text-lg">
                            {student?.first_name} {student?.last_name}
                          </h3>
                          <span className="px-2 py-2 bg-brand-red-100 text-brand-red-700 text-xs font-semibold rounded">
                            {risk.overdue_count} OVERDUE
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-black">Program:</span>
                            <span className="ml-2 font-medium text-black">
                              {program?.name}
                            </span>
                          </div>
                          <div>
                            <span className="text-black">Progress:</span>
                            <span className="ml-2 font-medium text-black">
                              {risk.progress_percentage}%
                            </span>
                          </div>
                          <div>
                            <span className="text-black">Email:</span>
                            <span className="ml-2 text-black">
                              {student?.email}
                            </span>
                          </div>
                          <div>
                            <span className="text-black">Funding:</span>
                            <span className="ml-2 font-medium text-black">
                              {funding?.code || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-black">
                              Last Activity:
                            </span>
                            <span className="ml-2 text-black">
                              {risk.last_activity_date
                                ? new Date(
                                    risk.last_activity_date
                                  ).toLocaleDateString()
                                : 'No activity'}
                            </span>
                          </div>
                          <div>
                            <span className="text-black">
                              Days Inactive:
                            </span>
                            <span className="ml-2 font-medium text-brand-red-600">
                              {risk.days_since_activity}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Link
                          href={`/admin/students/${student?.id}`}
                          className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700 text-center"
                        >
                          View Details
                        </Link>
                        {student?.phone && (
                          <a
                            href={`tel:${student.phone}`}
                            className="px-4 py-2 bg-brand-green-600 text-white rounded-lg font-semibold hover:bg-brand-green-700 text-center"
                          >
                            Call Student
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-black">
              <p>No at-risk students. Great job!</p>
            </div>
          )}
        </div>

        {/* Needs Action Students */}
        {needsActionStudents && needsActionStudents.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <FileWarning className="w-6 h-6 text-yellow-600" />
              Needs Action ({needsActionStudents.length})
            </h2>
            <div className="space-y-3">
              {needsActionStudents.slice(0, 10).map((risk: any) => {
                const enrollment = risk.enrollments;
                const student = enrollment?.profiles;
                const program = enrollment?.programs;

                return (
                  <div
                    key={risk.id}
                    className="flex items-center justify-between p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded"
                  >
                    <div>
                      <div className="font-semibold text-black">
                        {student?.first_name} {student?.last_name}
                      </div>
                      <div className="text-sm text-black">
                        {program?.name} • {risk.overdue_count} overdue •{' '}
                        {risk.progress_percentage}% complete
                      </div>
                    </div>
                    <Link
                      href={`/admin/students/${student?.id}`}
                      className="px-4 py-2 bg-brand-blue-600 text-white rounded-lg font-semibold hover:bg-brand-blue-700"
                    >
                      Review
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Low Completion Programs */}
        {lowCompletionPrograms && lowCompletionPrograms.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <TrendingDown className="w-6 h-6 text-brand-blue-600" />
              Programs Needing Attention
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-black">
                      Program
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-black">
                      Total Students
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-black">
                      Completion Rate
                    </th>
                    <th className="text-center py-3 px-4 font-semibold text-black">
                      Dropout Rate
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-black">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {lowCompletionPrograms.map((program: any) => (
                    <tr
                      key={program.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4 font-medium text-black">
                        {program.name}
                      </td>
                      <td className="py-3 px-4 text-center text-black">
                        {program.total}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-bold ${program.completionRate < 50 ? 'text-brand-red-600' : 'text-yellow-600'}`}
                        >
                          {program.completionRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-brand-red-600">
                          {program.dropoutRate}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/programs/${program.id}`}
                          className="text-brand-blue-600 hover:underline font-semibold"
                        >
                          Investigate →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
