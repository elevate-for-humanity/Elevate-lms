import { Metadata } from 'next';
import Link from 'next/link';
import { Users, Mail, Eye } from 'lucide-react';
import { requireProgramAccess } from '@/lib/auth/require-program-holder';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Students | Program Holder', robots: { index: false } };

export default async function ProgramStudentsPage({
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
    .single();

  if (!program) return <div className="p-8 text-center text-gray-500">Program not found.</div>;

  // Fetch students enrolled in THIS program only
  const { data: enrollments } = await db
    .from('student_enrollments')
    .select('id, student_id, progress, status, created_at, profiles!student_enrollments_student_id_fkey(full_name, email)')
    .eq('program_id', programId)
    .order('created_at', { ascending: false })
    .limit(100);

  const students = (enrollments || []).map((e: any) => ({
    id: e.id,
    name: e.profiles?.full_name || 'Unknown',
    email: e.profiles?.email || '',
    progress: e.progress || 0,
    status: e.status || 'unknown',
    enrolledAt: e.created_at,
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Students — {program.name || program.title}
        </h1>
        <span className="text-sm text-gray-500">{students.length} enrolled</span>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b bg-white">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium text-center">Progress</th>
                  <th className="px-4 py-3 font-medium text-center">Status</th>
                  <th className="px-4 py-3 font-medium">Enrolled</th>
                  <th className="px-4 py-3 font-medium text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-white">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div className="bg-brand-blue-600 h-2 rounded-full" style={{ width: `${Math.min(s.progress, 100)}%` }} />
                        </div>
                        <span className="text-xs font-medium">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-medium px-2 py-1 rounded ${
                        s.status === 'completed' ? 'bg-brand-green-100 text-brand-green-800' :
                        s.status === 'active' ? 'bg-brand-blue-100 text-brand-blue-800' :
                        s.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                        'bg-white text-gray-600'
                      }`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(s.enrolledAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 text-gray-400 hover:text-brand-blue-600" title="View details">
                          <Eye className="w-4 h-4" />
                        </button>
                        <a href={`mailto:${s.email}`} className="p-1 text-gray-400 hover:text-brand-blue-600" title="Email student">
                          <Mail className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No students enrolled in this program yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
