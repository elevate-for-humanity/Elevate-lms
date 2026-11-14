import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminBillingPlansPage() {
  const admin = await requireAdminClient();
  const { data: plans } = await admin!
    .from('subscription_plans')
    .select('slug, name, monthly_price, annual_price, limits, active')
    .order('sort_order');

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Plan</th>
            <th className="px-4 py-3 font-semibold">Monthly</th>
            <th className="px-4 py-3 font-semibold">Annual</th>
            <th className="px-4 py-3 font-semibold">Limits</th>
            <th className="px-4 py-3 font-semibold">Active</th>
          </tr>
        </thead>
        <tbody>
          {(plans ?? []).map((p) => (
            <tr key={p.slug} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium">{p.name}</td>
              <td className="px-4 py-3">${p.monthly_price}</td>
              <td className="px-4 py-3">${p.annual_price ?? '—'}</td>
              <td className="px-4 py-3 font-mono text-xs">{JSON.stringify(p.limits)}</td>
              <td className="px-4 py-3">{p.active ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {!plans?.length && (
        <p className="p-6 text-slate-500 text-sm">
          No plans in database. Run migration 20260702000017_saas_subscription_foundation.sql in
          Supabase SQL Editor.
        </p>
      )}
    </div>
  );
}
