import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminBillingAddonsPage() {
  const admin = await requireAdminClient();
  const { data: addons } = await admin!
    .from('saas_addon_catalog')
    .select('code, name, monthly_price, feature_codes, active')
    .order('sort_order');

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Code</th>
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">$/mo</th>
            <th className="px-4 py-3 font-semibold">Features unlocked</th>
          </tr>
        </thead>
        <tbody>
          {(addons ?? []).map((a) => (
            <tr key={a.code} className="border-t border-slate-100">
              <td className="px-4 py-3 font-mono text-xs">{a.code}</td>
              <td className="px-4 py-3">{a.name}</td>
              <td className="px-4 py-3">${a.monthly_price}</td>
              <td className="px-4 py-3 text-xs">{(a.feature_codes ?? []).join(', ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
