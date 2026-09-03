import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminFeatureFlagsPage() {
  const admin = await requireAdminClient();
  const { data: features } = await admin!.from('features').select('code, name').order('code');

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <p className="text-sm text-slate-600 mb-4">
        Feature codes used by <code className="font-mono text-xs">requireFeature(organizationId, code)</code>.
      </p>
      <ul className="grid sm:grid-cols-2 gap-2 text-sm">
        {(features ?? []).map((f) => (
          <li key={f.code} className="flex gap-2 border border-slate-100 rounded-lg px-3 py-2">
            <span className="font-mono text-brand-blue-700">{f.code}</span>
            <span className="text-slate-600">{f.name}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
