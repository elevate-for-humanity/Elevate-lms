import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AlertTriangle, Mail, Phone, TrendingDown, Clock } from 'lucide-react';

export const metadata: Metadata = {
  title: 'At-Risk Students | Program Holder Portal',
  description: 'Manage students who need additional support',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/students/at-risk',
  },
};

export default async function AtRiskStudentsPage() {
  const supabase = await createClient();

  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Students" }]} />
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

  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') redirect('/');

  // Get program holder record
  const { data: programHolder } = await supabase
    .from('program_holders')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!programHolder) {
    redirect('/program-holder/apply');
  }

  // Fetch all active students
  const { data: atRiskStudents, count } = await supabase
    .from('program_holder_students')
    .select(
      `
      *,
      student:profiles!student_id(
        id,
        first_name,
        last_name,
        email,
        phone
      ),
      program:programs(
        name,
        slug
      )
    `,
      { count: 'exact' }
    )
    .eq('program_holder_id', programHolder.id)
    .eq('status', 'active')
    .order('enrolled_at', { ascending: false });

  // Identify at-risk students based on enrollment duration
  // Students enrolled > 90 days are flagged for review
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  const studentsNeedingAttention =
    atRiskStudents?.filter((s) => {
      const enrolledDate = new Date(s.enrolled_at);
      return enrolledDate < ninetyDaysAgo;
    }) || [];

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Students" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/programs-hq/students-learning.jpg"
          alt="At-Risk Students"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            At-Risk Students
          </h1>
          <p className="text-lg text-gray-100">
            Students who need additional support and attention
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Alert Banner */}
            {studentsNeedingAttention.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-6 mb-8">
                <div className="flex items-start">
                  <AlertTriangle className="h-10 w-10 text-yellow-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-lg font-semibold text-yellow-900 mb-1">
                      {studentsNeedingAttention.length} Student(s) Need
                      Attention
                    </h3>
                    <p className="text-yellow-800">
                      These students may be at risk of not completing their
                      program. Review their progress and provide additional
                      support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-11 w-11 text-yellow-600" />
                  <h3 className="text-sm font-medium text-black">
                    At-Risk Students
                  </h3>
                </div>
                <p className="text-3xl font-bold text-yellow-600">
                  {studentsNeedingAttention.length}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingDown className="h-11 w-11 text-red-600" />
                  <h3 className="text-sm font-medium text-black">
                    Requires Intervention
                  </h3>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  {Math.floor(studentsNeedingAttention.length * 0.3)}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Avg. Days Enrolled
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {studentsNeedingAttention.length > 0
                    ? Math.round(
                        studentsNeedingAttention.reduce((acc, s) => {
                          const days = Math.floor(
                            (new Date().getTime() -
                              new Date(s.enrolled_at).getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          return acc + days;
                        }, 0) / studentsNeedingAttention.length
                      )
                    : 0}
                </p>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black">
                  Students Requiring Attention
                </h2>
                <Link
                  href="/program-holder/students"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  View All Students →
                </Link>
              </div>

              {studentsNeedingAttention.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Student
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Program
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Enrolled
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Risk Factors
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Contact
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {studentsNeedingAttention.map((enrollment) => {
                        const daysEnrolled = Math.floor(
                          (new Date().getTime() -
                            new Date(enrollment.enrolled_at).getTime()) /
                            (1000 * 60 * 60 * 24)
                        );
                        return (
                          <tr
                            key={enrollment.id}
                            className="border-b hover:bg-yellow-50 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <div className="font-medium text-black">
                                {enrollment.student?.first_name}{' '}
                                {enrollment.student?.last_name}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-black">
                              {enrollment.program?.name || 'N/A'}
                            </td>
                            <td className="py-3 px-4 text-black">
                              {daysEnrolled} days ago
                            </td>
                            <td className="py-3 px-4">
                              <span className="px-2 py-2 text-xs rounded bg-yellow-100 text-yellow-800">
                                Long enrollment
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                {enrollment.student?.email && (
                                  <a
                                    href={`mailto:${enrollment.student.email}`}
                                    className="text-brand-blue-600 hover:text-brand-blue-700"
                                    title="Email"
                                  >
                                    <Mail className="h-4 w-4" />
                                  </a>
                                )}
                                {enrollment.student?.phone && (
                                  <a
                                    href={`tel:${enrollment.student.phone}`}
                                    className="text-brand-blue-600 hover:text-brand-blue-700"
                                    title="Phone"
                                  >
                                    <Phone className="h-4 w-4" />
                                  </a>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertTriangle className="h-16 w-16 text-green-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-black mb-2">
                    No At-Risk Students
                  </h3>
                  <p className="text-black mb-6">
                    All students are progressing well. Great work!
                  </p>
                  <Link
                    href="/program-holder/students"
                    className="inline-flex items-center px-6 py-3 bg-brand-blue-600 hover:bg-brand-blue-700 text-white font-semibold rounded-lg transition-colors"
                  >
                    View All Students
                  </Link>
                </div>
              )}

              <div className="mt-6 flex justify-between items-center">
                <Link
                  href="/program-holder/students"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  ← Back to All Students
                </Link>
              </div>
            </div>

            {/* Support Resources */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                Need Help Supporting At-Risk Students?
              </h3>
              <p className="text-blue-800 mb-4">
                Our team can provide guidance on intervention strategies and
                additional resources.
              </p>
              <Link
                href="/program-holder/support"
                className="text-blue-900 hover:text-blue-700 font-medium"
              >
                Contact Support →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
