import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { Users } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Program Enrollments | Elevate Admin' };

export default async function ProgramEnrollmentsPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: program } = await supabase.from('programs').select('id, title').or(`code.eq.${code},slug.eq.${code}`).maybeSingle();
  if (!program) return <div className="p-8"><h1 className="text-2xl font-bold">Program not found</h1></div>;

  const { data: enrollments } = await supabase
    .from('program_enrollments')
    .select('id, user_id, status, progress_percent, enrolled_at, completed_at, created_at')
    .eq('program_id', program.id)
    .order('created_at', { ascending: false })
    .limit(100);

  // Get user names
  const userIds = [...new Set((enrollments || []).map((e: any) => e.user_id).filter(Boolean))];
  const profiles: Record<string, any> = {};
  if (userIds.length > 0) {
    const { data: profs } = await supabase.from('profiles').select('id, first_name, last_name, email').in('id', userIds);
    for (const p of profs || []) profiles[p.id] = p;
  }

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    completed: 'bg-brand-blue-100 text-brand-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    withdrawn: 'bg-red-100 text-red-800',
    pending: 'bg-gray-100 text-gray-600',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <nav className="text-sm mb-4">
        <ol className="flex items-center space-x-2 text-gray-500">
          <li><Link href="/admin/programs" className="hover:text-brand-blue-600">Programs</Link></li>
          <li>/</li>
          <li><Link href={`/admin/programs/${code}/dashboard`} className="hover:text-brand-blue-600">{program.title}</Link></li>
          <li>/</li>
          <li className="text-gray-900 font-medium">Enrollments</li>
        </ol>
      </nav>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Enrollments — {program.title}</h1>

      {(!enrollments || enrollments.length === 0) ? (
        <div className="bg-white rounded-lg border p-12 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments yet</h3>
          <p className="text-gray-500">Students will appear here once they enroll in this program.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Student</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Progress</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Enrolled</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {enrollments.map((e: any) => {
                const p = profiles[e.user_id];
                const name = p ? `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.email : e.user_id?.slice(0, 8);
                return (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{name}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[e.status] || 'bg-gray-100 text-gray-600'}`}>
                        {e.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div className="bg-brand-blue-600 h-2 rounded-full" style={{ width: `${e.progress_percent || 0}%` }} />
                        </div>
                        <span className="text-gray-500 text-xs">{e.progress_percent || 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {e.enrolled_at ? new Date(e.enrolled_at).toLocaleDateString() : e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
