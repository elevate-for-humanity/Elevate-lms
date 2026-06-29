import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function AdminBillingSubscriptionsPage() {
  const admin = await requireAdminClient();
  const { data: rows } = await admin!
    .from('organization_subscriptions')
    .select(
      'status, billing_interval, current_period_end, stripe_subscription_id, tenants ( name, slug ), subscription_plans ( name, slug )',
    )
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left">
          <tr>
            <th className="px-4 py-3 font-semibold">Organization</th>
            <th className="px-4 py-3 font-semibold">Plan</th>
            <th className="px-4 py-3 font-semibold">Status</th>
            <th className="px-4 py-3 font-semibold">Interval</th>
            <th className="px-4 py-3 font-semibold">Period end</th>
          </tr>
        </thead>
        <tbody>
          {(rows ?? []).map((r, i) => {
            const tenant = Array.isArray(r.tenants) ? r.tenants[0] : r.tenants;
            const plan = Array.isArray(r.subscription_plans)
              ? r.subscription_plans[0]
              : r.subscription_plans;
            return (
              <tr key={i} className="border-t border-slate-100">
                <td className="px-4 py-3">{tenant?.name ?? tenant?.slug ?? '—'}</td>
                <td className="px-4 py-3">{plan?.name ?? '—'}</td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">{r.billing_interval}</td>
                <td className="px-4 py-3">
                  {r.current_period_end
                    ? new Date(r.current_period_end).toLocaleDateString()
                    : '—'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!rows?.length && (
        <p className="p-6 text-slate-500 text-sm">No organization subscriptions yet.</p>
      )}
    </div>
  );
}
