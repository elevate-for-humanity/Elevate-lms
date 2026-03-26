import { Metadata } from 'next';
import Link from 'next/link';
import { BookOpen, Plus, Edit, Eye, Trash2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { requireProgramHolder } from '@/lib/auth/require-program-holder';

export const metadata: Metadata = {
  title: 'Manage Programs | Program Holder Portal',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function ProgramHolderProgramsPage() {
  const { db, programIds } = await requireProgramHolder();

  const { data: programsData } = programIds.length > 0
    ? await supabase
        .from('programs')
        .select('id, name, title, is_active, enrolled_count, completion_rate, created_at')
        .in('id', programIds)
        .order('created_at', { ascending: false })
    : { data: [] };

  const programs = (programsData || []).map(p => ({
    id: p.id,
    name: p.name || p.title || 'Untitled Program',
    status: p.is_active ? 'active' : 'draft',
    students: p.enrolled_count || 0,
    completion: p.completion_rate || 0,
    created: new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  }));

  return (
    <div className="min-h-screen bg-white">
      <Breadcrumbs items={[
        { label: 'Program Holder', href: '/program-holder/dashboard' },
        { label: 'Programs' },
      ]} />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Manage Programs</h1>
          <Link href="/program-holder/programs" className="flex items-center gap-2 bg-brand-blue-600 text-white px-4 py-2 rounded-lg hover:bg-brand-blue-700">
            <Plus className="w-5 h-5" /> Add Program
          </Link>
        </div>

        {programs.length > 0 ? (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Program</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Students</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Completion</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created</th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {programs.map((program) => (
                  <tr key={program.id} className="hover:bg-white">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue-100 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-5 h-5 text-brand-blue-600" />
                        </div>
                        <span className="font-medium text-gray-900">{program.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${program.status === 'active' ? 'bg-brand-green-100 text-brand-green-700' : 'bg-white text-gray-700'}`}>
                        {program.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-gray-600">{program.students}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-white rounded-full" style={{ width: `${program.completion}%` }} />
                        </div>
                        <span className="text-sm text-gray-600">{program.completion}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{program.created}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/program-holder/programs/${program.id}`} className="p-2 text-gray-600 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded">
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link href={`/program-holder/programs/${program.id}/edit`} className="p-2 text-gray-600 hover:text-brand-blue-600 hover:bg-brand-blue-50 rounded">
                          <Edit className="w-4 h-4" />
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
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No programs yet</h3>
            <p className="text-gray-600 mb-6">Create your first program to start enrolling students.</p>
            <Link href="/program-holder/programs" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-blue-600 text-white rounded-lg hover:bg-brand-blue-700">
              <Plus className="w-5 h-5" /> Create Program
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
