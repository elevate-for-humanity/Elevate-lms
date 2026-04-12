import { Metadata } from 'next';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import Link from 'next/link';
import Image from 'next/image';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  alternates: {
    canonical: 'https://www.elevateforhumanity.org/program-holder/grades',
  },
  title: 'Program Holder Grades | Elevate For Humanity',
  description: 'Review and manage student grades, assessments, and academic progress across your programs.',
};

export default async function GradesPage() {
  const { db, programIds } = await requireProgramHolder();

  // Fetch student enrollments scoped to owned programs
  const { data: items, count } = programIds.length > 0
    ? await db
        .from('student_enrollments')
        .select('id, student_id, program_id, progress, status, grade, created_at, profiles!student_enrollments_student_id_fkey(full_name, email)', { count: 'exact' })
        .in('program_id', programIds)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [], count: 0 };

  const programNames: Record<string, string> = {};
  if (programIds.length > 0) {
    const { data: progDetails } = await db
      .from('programs')
      .select('id, name, title')
      .in('id', programIds);
    (progDetails || []).forEach((p: any) => { programNames[p.id] = p.name || p.title || 'Untitled'; });
  }

  return (
    <div className="min-h-screen bg-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Breadcrumbs items={[{ label: "Program Holder", href: "/program-holder" }, { label: "Grades" }]} />
        </div>
      {/* Hero Section */}
      <section className="relative h-48 md:h-64 overflow-hidden">
        <Image
          src="/images/pages/program-holder-page-1.jpg"
          alt="Grades"
          fill
          className="object-cover"
          quality={100}
          priority
          sizes="100vw"
        />

      </section>

      {/* Content Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-7xl mx-auto">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Total Enrollments</h3>
                <p className="text-3xl font-bold text-brand-blue-600">{count || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Active</h3>
                <p className="text-3xl font-bold text-brand-green-600">
                  {items?.filter((i: any) => i.status === 'active').length || 0}
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Completed</h3>
                <p className="text-3xl font-bold text-brand-blue-600">
                  {items?.filter((i: any) => i.status === 'completed').length || 0}
                </p>
              </div>
            </div>

            {/* Student Grades Table */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-2xl font-bold mb-4">Student Grades</h2>
              {items && items.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b">
                        <th className="pb-3 font-medium">Student</th>
                        <th className="pb-3 font-medium">Program</th>
                        <th className="pb-3 font-medium text-center">Progress</th>
                        <th className="pb-3 font-medium text-center">Grade</th>
                        <th className="pb-3 font-medium text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.map((item: any) => {
                        const studentProfile = item.profiles as any;
                        return (
                          <tr key={item.id} className="hover:bg-white">
                            <td className="py-3">
                              <p className="font-medium text-gray-900">{studentProfile?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-gray-500">{studentProfile?.email || ''}</p>
                            </td>
                            <td className="py-3 text-gray-700">{programNames[item.program_id] || '—'}</td>
                            <td className="py-3 text-center">
                              <span className="font-medium">{item.progress || 0}%</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className="font-bold">{item.grade || '—'}</span>
                            </td>
                            <td className="py-3 text-center">
                              <span className={`text-xs font-medium px-2 py-1 rounded ${
                                item.status === 'completed' ? 'bg-brand-green-100 text-brand-green-800' :
                                item.status === 'active' ? 'bg-brand-blue-100 text-brand-blue-800' :
                                'bg-white text-gray-600'
                              }`}>{item.status}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No student enrollments found for your programs.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl font-bold mb-3">Need Help?</h2>
            <p className="text-white mb-6">
              Contact support for questions about grades, assessments, or student progress.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/program-holder/support" className="bg-white text-brand-blue-700 px-6 py-3 rounded-lg font-semibold hover:bg-white">
                Contact Support
              </Link>
              <Link href="/program-holder/dashboard" className="bg-brand-blue-800 text-white px-6 py-3 rounded-lg font-semibold hover:bg-brand-blue-600 border-2 border-white">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
