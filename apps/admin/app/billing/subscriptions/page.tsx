import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { AuthorizationActions } from './AuthorizationActions';
import { CreateSchedule } from './CreateSchedule';
import { ScheduleActions } from './ScheduleActions';

export const dynamic = 'force-dynamic';

export default async function AdminBillingSubscriptionsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();
  const [{ data: schedules }, { data: authorizations }, { data: history }] = await Promise.all([
    db
      .from('billing_schedules')
      .select(
        'id,customer_name,product_name,status,cadence,next_invoice_date,legacy_stripe_subscription_id',
      )
      .order('created_at', { ascending: false })
      .limit(250),
    db
      .from('billing_migration_authorizations')
      .select(
        'id,customer_name,customer_email,product_name,amount_cents,cadence,status,document_path,document_name',
      )
      .order('created_at', { ascending: false })
      .limit(250),
    db
      .from('organization_subscriptions')
      .select(
        'status,billing_interval,current_period_end,stripe_subscription_id,tenants(name,slug),subscription_plans(name,slug)',
      )
      .order('created_at', { ascending: false })
      .limit(100),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Billing schedules</h1>
          <p className="text-sm text-slate-600">
            QuickBooks schedules, authorization reviews, and preserved Stripe history.
          </p>
        </div>
        <CreateSchedule />
      </div>
      <section className="overflow-x-auto rounded-xl border bg-white">
        <h2 className="border-b px-4 py-3 font-bold">Subscription authorizations</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Subscription</th>
              <th className="px-4 py-3">Document</th>
              <th className="px-4 py-3">Review</th>
            </tr>
          </thead>
          <tbody>
            {(authorizations || []).map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-4 py-3">
                  {a.customer_name}
                  <br />
                  <span className="text-xs text-slate-500">{a.customer_email}</span>
                </td>
                <td className="px-4 py-3">
                  {a.product_name}
                  <br />
                  <span className="text-xs capitalize">
                    ${(Number(a.amount_cents) / 100).toFixed(2)} {a.cadence}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.document_name || 'Not uploaded'}
                  <br />
                  <span className="text-xs capitalize">{a.status}</span>
                </td>
                <td className="px-4 py-3">
                  <AuthorizationActions
                    id={a.id}
                    status={a.status}
                    hasDocument={Boolean(a.document_path)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!authorizations?.length ? (
          <p className="p-6 text-sm text-slate-500">No authorization requests.</p>
        ) : null}
      </section>
      <section className="overflow-x-auto rounded-xl border bg-white">
        <h2 className="border-b px-4 py-3 font-bold">QuickBooks schedules</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Cadence</th>
              <th className="px-4 py-3">Next invoice</th>
            </tr>
          </thead>
          <tbody>
            {(schedules || []).map((s) => (
              <tr key={s.id} className="border-t">
                <td className="px-4 py-3">{s.customer_name}</td>
                <td className="px-4 py-3">{s.product_name}</td>
                <td className="px-4 py-3">
                  <ScheduleActions id={s.id} status={s.status} />
                </td>
                <td className="px-4 py-3 capitalize">{s.cadence}</td>
                <td className="px-4 py-3">{new Date(s.next_invoice_date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="overflow-x-auto rounded-xl border bg-white">
        <h2 className="border-b px-4 py-3 font-bold">Stripe subscription history</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Period end</th>
            </tr>
          </thead>
          <tbody>
            {(history || []).map((r: any, i) => (
              <tr key={i} className="border-t">
                <td className="px-4 py-3">
                  {(Array.isArray(r.tenants) ? r.tenants[0] : r.tenants)?.name || '—'}
                </td>
                <td className="px-4 py-3">
                  {(Array.isArray(r.subscription_plans)
                    ? r.subscription_plans[0]
                    : r.subscription_plans
                  )?.name || '—'}
                </td>
                <td className="px-4 py-3">{r.status}</td>
                <td className="px-4 py-3">
                  {r.current_period_end ? new Date(r.current_period_end).toLocaleDateString() : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
