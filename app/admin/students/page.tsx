import { Metadata } from 'next';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  Users,
  GraduationCap,
  TrendingUp,
  Clock,
  Mail,
  Phone,
} from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/admin/students',
  },
  title: 'Students Management | Elevate For Humanity',
  description:
    'Manage student enrollments, track progress, and monitor academic performance.',
};

export default async function StudentsPage() {
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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    redirect('/unauthorized');
  }

  // Fetch students with enrollment data
  const { data: students, count: totalStudents } = await supabase
    .from('profiles')
    .select(
      `
      *,
      enrollments:enrollments(
        id,
        status,
        progress,
        program:programs(name, slug)
      )
    `,
      { count: 'exact' }
    )
    .eq('role', 'student')
    .order('created_at', { ascending: false })
    .limit(50);

  // Get active enrollments count
  const { count: activeEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  // Get completed enrollments count
  const { count: completedEnrollments } = await supabase
    .from('enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  // Get recent students (last 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const { count: recentStudents } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')
    .gte('created_at', weekAgo.toISOString());

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumbs */}
      <div className="bg-slate-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Students' }]} />
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/programs-hq/students-learning.jpg"
          alt="Students Management"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Students Management
          </h1>
          <p className="text-base md:text-lg mb-8 text-gray-100">
            Manage student enrollments, track progress, and monitor academic
            performance
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/admin/enrollments"
              className="bg-brand-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              View Enrollments
            </Link>
            <Link
              href="/admin/dashboard"
              className="bg-white hover:bg-gray-100 text-brand-blue-600 px-8 py-4 rounded-lg text-lg font-semibold transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Total Students
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {totalStudents || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <GraduationCap className="h-11 w-11 text-brand-green-600" />
                  <h3 className="text-sm font-medium text-black">
                    Active Enrollments
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-green-600">
                  {activeEnrollments || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-11 w-11 text-brand-blue-600" />
                  <h3 className="text-sm font-medium text-black">
                    Completed
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {completedEnrollments || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Clock className="h-11 w-11 text-brand-orange-600" />
                  <h3 className="text-sm font-medium text-black">
                    New (7 days)
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-orange-600">
                  {recentStudents || 0}
                </p>
              </div>
            </div>

            {/* Students List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Students</h2>
                <Link
                  href="/admin/students/export"
                  className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
                >
                  Export Data
                </Link>
              </div>
              {students && students.length > 0 ? (
                <div className="space-y-4">
                  {students.map((student: any) => (
                    <div
                      key={student.id}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">
                            {student.full_name || 'Unnamed Student'}
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm text-black">
                            {student.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-4 w-4" />
                                {student.email}
                              </span>
                            )}
                            {student.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-4 w-4" />
                                {student.phone}
                              </span>
                            )}
                            <span>
                              Joined:{' '}
                              {new Date(
                                student.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                          {student.enrollments &&
                            student.enrollments.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-black mb-1">
                                  Enrollments:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {student.enrollments.map(
                                    (enrollment: any, idx: number) => (
                                      <span
                                        key={idx}
                                        className={`text-xs px-2 py-2 rounded ${
                                          enrollment.status === 'active'
                                            ? 'bg-brand-green-100 text-green-700'
                                            : enrollment.status === 'completed'
                                              ? 'bg-brand-blue-100 text-brand-blue-700'
                                              : 'bg-gray-100 text-black'
                                        }`}
                                      >
                                        {enrollment.program?.name ||
                                          'Unknown Program'}{' '}
                                        - {enrollment.status}
                                        {enrollment.progress &&
                                          ` (${enrollment.progress}%)`}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                        <Link
                          href={`/admin/students/${student.id}`}
                          className="text-brand-blue-600 hover:text-brand-blue-700 text-sm font-medium ml-4"
                        >
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-black text-lg">No students found</p>
                  <p className="text-black text-sm mt-2">
                    Students will appear here once they register
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-brand-blue-700 text-white">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-base md:text-lg text-brand-blue-100 mb-8">
              Explore training programs and earn industry certifications through Elevate for
              programs.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link
                href="/contact"
                className="bg-white text-brand-blue-700 px-8 py-4 rounded-lg font-semibold hover:bg-gray-50 text-lg"
              >
                Apply Now
              </Link>
              <Link
                href="/programs"
                className="bg-brand-blue-800 text-white px-8 py-4 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white text-lg"
              >
                Browse Programs
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
