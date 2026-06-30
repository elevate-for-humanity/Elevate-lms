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

  const { data: program } = await db
    .from('programs')
    .select('id, name, title')
    .eq('id', programId)
    .maybeSingle();

  if (!program) return <div className="p-8 text-center text-slate-700">Program not found.</div>;

  const { data: enrollments } = await db
    .from('program_enrollments')
    .select(
      'id, user_id, full_name, email, progress, status, progress_percent, enrolled_at',
    )
    .eq('program_id', programId)
    .order('enrolled_at', { ascending: false })
    .limit(100);

  const items = enrollments || [];
  const completed = items.filter((i: any) => i.status === 'completed').length;
  // Alias enrolled_at → created_at for display consistency

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">
        Grades — {program.name || program.title}
      </h1>

      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Total Enrollments</h3>
          <p className="text-3xl font-bold text-brand-blue-600">{items.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Active</h3>
          <p className="text-3xl font-bold text-brand-green-600">
            {items.filter((i: any) => i.status === 'active').length}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-sm font-medium text-slate-700 mb-2">Completed</h3>
          <p className="text-3xl font-bold text-brand-blue-600">{completed}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold mb-4">Student Grades</h2>
        {items.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-700 border-b">
                  <th className="pb-3 font-medium">Student</th>
                  <th className="pb-3 font-medium text-center">Progress</th>
                  <th className="pb-3 font-medium text-center">Grade</th>
                  <th className="pb-3 font-medium text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((item: any) => {
                  return (
                    <tr key={item.id} className="hover:bg-white">
                      <td className="py-3">
                        <p className="font-medium text-slate-900">
                          {item.full_name || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-700">{item.email || ''}</p>
                      </td>
                      <td className="py-3 text-center font-medium">{item.progress_percent || item.progress || 0}%</td>
                      <td className="py-3 text-center font-bold">—</td>
                      <td className="py-3 text-center">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            item.status === 'completed'
                              ? 'bg-brand-green-100 text-brand-green-800'
                              : item.status === 'active'
                                ? 'bg-brand-blue-100 text-brand-blue-800'
                                : 'bg-white text-slate-700'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <GraduationCap aria-label="graduationcap" className="w-12 h-12 text-slate-700 mx-auto mb-3" />
            <p className="text-slate-700">No student enrollments in this program yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
