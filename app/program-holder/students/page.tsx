import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Search, Filter, Download, Mail, Eye } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const metadata: Metadata = {
  title: 'Students | Program Holder Portal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProgramHolderStudentsPage() {
  const { db, programIds } = await requireProgramHolder();

  // Get programs this holder can access
  const { data: myPrograms } = programIds.length > 0
    ? await db
        .from('programs')
        .select('id, name, title')
        .in('id', programIds)
    : { data: [] };

  const programNames = (myPrograms || []).reduce<Record<string, string>>((acc, p) => {
    acc[p.id] = p.name || p.title || 'Unknown Program';
    return acc;
  }, {});

  // Get enrollments for those programs
  let students: Array<{
    id: string;
    name: string;
    email: string;
    program: string;
    progress: number;
    enrolled: string;
    status: string;
  }> = [];

  if (programIds.length > 0) {
    const { data: enrollments } = await db
      .from('student_enrollments')
      .select('id, student_id, program_id, progress, status, created_at, profiles!student_enrollments_student_id_fkey(full_name, email)')
      .in('program_id', programIds)
      .order('created_at', { ascending: false })
      .limit(100);

    students = (enrollments || []).map((e: any) => ({
      id: e.student_id,
      name: e.profiles?.full_name || 'Unknown',
      email: e.profiles?.email || '',
      program: programNames[e.program_id] || 'Unknown Program',
      progress: e.progress || 0,
      enrolled: new Date(e.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: e.status || 'active',
    }));
  }

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[
        { label: 'Program Holder', href: '/program-holder/dashboard' },
        { label: 'Students' },
      ]} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Students</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search students..." className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>

        {students.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Student</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Program</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Progress</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Enrolled</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-white">
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.program}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${student.progress === 100 ? 'bg-brand-green-500' : 'bg-brand-blue-500'}`} style={{ width: `${student.progress}%` }} />
                        </div>
                        <span className="text-sm text-gray-600">{student.progress}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{student.enrolled}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        student.status === 'completed' ? 'bg-brand-green-100 text-brand-green-700' :
                        student.status === 'active' ? 'bg-brand-blue-100 text-brand-blue-700' :
                        'bg-white text-gray-700'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/program-holder/students/${student.id}`} className="p-2 text-gray-600 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No students yet</h3>
            <p className="text-gray-600">Students will appear here once they enroll in your programs.</p>
          </div>
        )}
      </div>
    </div>
  );
}
