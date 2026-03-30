import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { getAllFeatures, groupFeaturesByStatus } from '@/lib/features';
import type { FeatureDefinition } from '@/lib/features';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Feature Registry | Admin | Elevate For Humanity',
  robots: { index: false, follow: false },
};

const STATUS_STYLES: Record<string, string> = {
  enabled: 'bg-green-100 text-green-800',
  beta:    'bg-yellow-100 text-yellow-800',
  disabled:'bg-gray-100 text-gray-600',
};

const SURFACE_LABELS: Record<string, string> = {
  'global':               'Global',
  'lms':                  'LMS',
  'lms-lesson':           'LMS Lesson',
  'admin':                'Admin',
  'admin-course-builder': 'Admin › Course Builder',
  'admin-compliance':     'Admin › Compliance',
  'admin-analytics':      'Admin › Analytics',
  'marketing':            'Marketing',
  'employer':             'Employer',
  'learner':              'Learner',
};

function FeatureRow({ f }: { f: FeatureDefinition }) {
  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50">
      <td className="px-4 py-3">
        <p className="font-medium text-slate-900 text-sm">{f.name}</p>
        <p className="text-xs text-slate-500 mt-0.5">{f.description}</p>
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 font-mono">{f.id}</td>
      <td className="px-4 py-3 text-xs text-slate-600">
        {SURFACE_LABELS[f.surface] ?? f.surface}
      </td>
      <td className="px-4 py-3 text-xs text-slate-600 capitalize">{f.category}</td>
      <td className="px-4 py-3">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLES[f.status]}`}>
          {f.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-slate-400 font-mono truncate max-w-[200px]">
        {f.component}
      </td>
      {f.requiresEnvVar && (
        <td className="px-4 py-3 text-xs text-slate-500 font-mono">{f.requiresEnvVar}</td>
      )}
      {!f.requiresEnvVar && <td className="px-4 py-3" />}
    </tr>
  );
}

export default async function FeatureRegistryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/admin/features');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    redirect('/unauthorized');
  }

  const all = getAllFeatures();
  const grouped = groupFeaturesByStatus();

  const byStatus = [
    { label: 'Enabled', key: 'enabled' as const, features: grouped.enabled },
    { label: 'Beta',    key: 'beta'    as const, features: grouped.beta    },
    { label: 'Disabled',key: 'disabled'as const, features: grouped.disabled},
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumbs items={[{ label: 'Admin', href: '/admin' }, { label: 'Feature Registry' }]} />

        <div className="mt-6 mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Feature Registry</h1>
            <p className="text-slate-500 mt-1 text-sm">
              {all.length} registered features across {Object.keys(SURFACE_LABELS).length} surfaces
            </p>
          </div>
          <div className="flex gap-3">
            {byStatus.map(({ label, key, features }) => (
              <div key={key} className={`px-3 py-2 rounded-lg text-center ${STATUS_STYLES[key]}`}>
                <p className="text-lg font-bold">{features.length}</p>
                <p className="text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {byStatus.map(({ label, key, features }) => features.length > 0 && (
          <section key={key} className="mb-10">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
              {label} ({features.length})
            </h2>
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Feature</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">ID</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Surface</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Category</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Status</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Component</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-600">Env Var</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f) => <FeatureRow key={f.id} f={f} />)}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
