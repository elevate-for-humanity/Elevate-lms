import { Metadata } from 'next';
import { requireRole } from '@/lib/auth/require-role';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { ModulesTable } from './modules-table';

export const dynamic = 'force-dynamic';
export const revalidate = 60;

export const metadata: Metadata = {
  title: 'Modules Management | Admin',
  description: 'Manage program modules and SCORM packages',
};

export default async function ModulesPage() {
  await requireRole(['admin', 'super_admin']);
  const supabase = await createClient();

  // Fetch program modules (LMS)
  const { data: modules, count: totalModules } = await supabase
    .from('modules')
    .select(
      `
      *,
      program:programs(name, title, slug),
      scorm_package:scorm_packages(id, title, version)
    `,
      { count: 'exact' },
    )
    .order('created_at', { ascending: false });

  // Fetch staff training modules
  const { data: trainingModules, count: totalTrainingModules } = await supabase
    .from('training_modules')
    .select('*', { count: 'exact' })
    .order('order_index', { ascending: true });

  const { count: scormModules } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .eq('module_type', 'scorm');

  const { count: lessonModules } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .eq('module_type', 'lesson');

  const { count: assessmentModules } = await supabase
    .from('modules')
    .select('*', { count: 'exact', head: true })
    .eq('module_type', 'assessment');

  // Get programs for filtering
  const { data: programs } = await supabase
    .from('programs')
    .select('id, title, slug')
    .eq('is_active', true)
    .order('title');

  return (
    <div className="min-h-screen bg-white p-8">
      {/* Hero Image */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Modules' }]} />
      </div>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-black">Modules Management</h1>
              <p className="text-black mt-1">Manage program modules and SCORM content</p>
            </div>
            <Link
              href="/admin/modules/new"
              className="bg-brand-blue-600 hover:bg-brand-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              + Create Module
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Program Modules</h3>
              <p className="text-base md:text-lg font-bold text-black">{totalModules || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Staff Training</h3>
              <p className="text-base md:text-lg font-bold text-amber-600">{totalTrainingModules || 0}</p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">SCORM Packages</h3>
              <p className="text-base md:text-lg font-bold text-brand-blue-600">
                {scormModules || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Lessons</h3>
              <p className="text-base md:text-lg font-bold text-brand-green-600">
                {lessonModules || 0}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-sm font-medium text-black mb-1">Assessments</h3>
              <p className="text-base md:text-lg font-bold text-brand-blue-600">
                {assessmentModules || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Staff Training Modules */}
        {(trainingModules?.length ?? 0) > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-black mb-4">Staff Training Modules</h2>
            <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Title</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Duration</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Required</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {trainingModules?.map((mod: Record<string, any>) => (
                    <tr key={mod.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-black font-mono">{mod.order_index}</td>
                      <td className="px-4 py-3 text-sm font-medium text-black">{mod.title}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 max-w-xs truncate">{mod.description}</td>
                      <td className="px-4 py-3 text-sm text-black">{mod.duration_minutes ? `${mod.duration_minutes}m` : '—'}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${mod.is_required ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                          {mod.is_required ? 'Required' : 'Optional'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <Link
                          href={`/admin/staff-portal/training`}
                          className="text-brand-blue-600 hover:text-brand-blue-700 font-medium"
                        >
                          View in Staff Portal →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Program Modules Table */}
        <h2 className="text-xl font-bold text-black mb-4">Program Modules (LMS)</h2>
        <ModulesTable modules={modules || []} programs={programs || []} />
      </div>
    </div>
  );
}
