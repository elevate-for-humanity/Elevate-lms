import { Metadata } from 'next';
import { GraduationCap } from 'lucide-react';
import { requireProgramAccess } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Grades | Program Holder', robots: { index: false } };

export default async function ProgramGradesPage({
  params,
}: {
  params: Promise<{ programId: string }>;
}) {
  const { programId } = await params;
  const { db } = await requireProgramAccess(programId);

  const { data: program } = await supabase
    .from('programs')
    .select('id, name, title')
    .eq('id', programId)
    .single();

  if (!program) return <div className="p-8 text-center text-gray-500">Program not found.</div>;

  const { data: enrollments } = await supabase
    .from('student_enrollments')
    .select('id, student_id, progress, status, grade, created_at, profiles!student_enrollments_student_id_fkey(full_name, email)')
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
    .limit(100);

  const items = enrollments || [];
  const completed = items.filter((i: any) => i.status === 'completed').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Grades — {program.name || program.title}
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Enrollments</h3>
          <p className="text-3xl font-bold text-brand-blue-600">{items.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Active</h3>
          <p className="text-3xl font-bold text-brand-green-600">
            {items.filter((i: any) => i.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Completed</h3>
          <p className="text-3xl font-bold text-brand-blue-600">{completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Student Grades</h2>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium text-center">Progress</th>
                  <th className="pb-3 font-medium text-center">Grade</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item: any) => {
                  const profile = item.profiles as any;
                  return (
                    <tr key={item.id} className="hover:bg-white">
                      <td className="py-3">
                        <p className="font-medium text-gray-900">{profile?.full_name || 'Unknown'}</p>
                        <p className="text-xs text-gray-500">{profile?.email || ''}</p>
                      </td>
                      <td className="py-3 text-center font-medium">{item.progress || 0}%</td>
                      <td className="py-3 text-center font-bold">{item.grade || '—'}</td>
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
          <div className="text-center py-8">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No student enrollments in this program yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
