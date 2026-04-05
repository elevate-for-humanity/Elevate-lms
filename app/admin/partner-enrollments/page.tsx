import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: 'Partner Enrollments | Admin',
};

export default async function PartnerEnrollmentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin')
    redirect('/unauthorized');

  const { data: enrollments, count } = await supabase
    .from('partner_course_enrollments')
    .select(
      '*, student:profiles(full_name, email), course:partner_lms_courses(course_name)',
      { count: 'exact' }
    )
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-white p-8">

      {/* Hero Image */}
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Partner Enrollments" }]} />
        </div>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Partner Course Enrollments</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-black mb-4">Total: {count || 0}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-black uppercase">
                    Progress
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {enrollments?.map((e: any) => (
                  <tr key={e.id}>
                    <td className="px-6 py-4">{e.student?.full_name}</td>
                    <td className="px-6 py-4">{e.course?.course_name}</td>
                    <td className="px-6 py-4">{e.status}</td>
                    <td className="px-6 py-4">{e.progress_percentage || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
