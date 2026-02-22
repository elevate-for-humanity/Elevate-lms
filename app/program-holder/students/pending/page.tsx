import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
export const dynamic = 'force-dynamic';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { UserPlus, Mail, Phone, XCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pending Applications | Program Holder Portal',
  description: 'Review pending student applications',
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/students/pending',
  },
};

export default async function PendingStudentsPage() {
  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;

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

  const { data: profile } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'program_holder') redirect('/');

  // Get program holder record
  const { data: programHolder } = await db
    .from('program_holders')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!programHolder) {
    redirect('/program-holder/apply');
  }

  // Fetch pending applications
  // Note: This assumes there's an applications table or pending status in enrollments
  // For now, we'll check for enrollments with 'pending' status
  const { data: pendingApplications, count } = await db
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
    .eq('status', 'pending')
    .order('enrolled_at', { ascending: false });

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Students" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center text-white overflow-hidden">
        <Image
          src="/images/heroes/learners.jpg"
          alt="Pending Applications"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
          <UserPlus className="h-16 w-16 mx-auto mb-4" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Pending Applications
          </h1>
          <p className="text-lg text-gray-100">
            Review and accept student enrollment requests
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <UserPlus className="h-11 w-11 text-brand-orange-600" />
                  <h3 className="text-sm font-medium text-black">
                    Pending Applications
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-orange-600">
                  {count || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-slate-400 flex-shrink-0">•</span>
                  <h3 className="text-sm font-medium text-black">
                    This Week
                  </h3>
                </div>
                <p className="text-3xl font-bold text-brand-green-600">
                  {pendingApplications?.filter((a) => {
                    const weekAgo = new Date();
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return new Date(a.enrolled_at) >= weekAgo;
                  }).length || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="h-11 w-11 text-black" />
                  <h3 className="text-sm font-medium text-black">
                    Awaiting Review
                  </h3>
                </div>
                <p className="text-3xl font-bold text-black">
                  {count || 0}
                </p>
              </div>
            </div>

            {/* Applications List */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-black">
                  Applications to Review
                </h2>
                <Link
                  href="/program-holder/students"
                  className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                >
                  View All Students →
                </Link>
              </div>

              {pendingApplications && pendingApplications.length > 0 ? (
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
                          Applied
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Contact
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-black">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingApplications.map((application) => (
                        <tr
                          key={application.id}
                          className="border-b hover:bg-slate-50 transition-colors"
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-black">
                              {application.student?.first_name}{' '}
                              {application.student?.last_name}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-black">
                            {application.program?.name || 'N/A'}
                          </td>
                          <td className="py-3 px-4 text-black">
                            {new Date(
                              application.enrolled_at
                            ).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              {application.student?.email && (
                                <a
                                  href={`mailto:${application.student.email}`}
                                  className="text-brand-blue-600 hover:text-brand-blue-700"
                                  title="Email"
                                >
                                  <Mail className="h-4 w-4" />
                                </a>
                              )}
                              {application.student?.phone && (
                                <a
                                  href={`tel:${application.student.phone}`}
                                  className="text-brand-blue-600 hover:text-brand-blue-700"
                                  title="Phone"
                                >
                                  <Phone className="h-4 w-4" />
                                </a>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex gap-2">
                              <button className="px-3 py-2 bg-brand-green-600 hover:bg-brand-green-700 text-white text-sm font-medium rounded transition-colors" aria-label="Action button">
                                Accept
                              </button>
                              <button className="px-3 py-2 bg-brand-red-600 hover:bg-brand-red-700 text-white text-sm font-medium rounded transition-colors" aria-label="Action button">
                                Decline
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <UserPlus className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-black mb-2">
                    No Pending Applications
                  </h3>
                  <p className="text-black mb-6">
                    There are no student applications waiting for review.
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
          </div>
        </div>
      </section>
    </div>
  );
}
