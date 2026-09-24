import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';
import { AuthorizationActions } from './AuthorizationActions';
import { CreateSchedule } from './CreateSchedule';
import { ScheduleActions } from './ScheduleActions';
import { PayPalSetupAction } from './PayPalSetupAction';

export const dynamic = 'force-dynamic';

function nextMonthlyBillingDate(dayOfMonth: number) {
  const today = new Date();
  const thisMonth = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), dayOfMonth),
  );
  const next =
    thisMonth >= new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()))
      ? thisMonth
      : new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + 1, dayOfMonth));
  return next.toLocaleDateString('en-US', { timeZone: 'UTC' });
}

export default async function AdminBillingSubscriptionsPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();
  const [{ data: schedules }, { data: authorizations }, { data: preferences }, { data: history }] = await Promise.all([
    db
      .from('billing_schedules')
      .select(
        'id,customer_name,product_name,status,cadence,next_invoice_date,provider,collection_mode,collection_provider,provider_status,provider_approval_url',
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
    (db as any)
      .from('billing_account_preferences')
      .select(
        'id,account_name,cadence,billing_day_of_month,is_apprentice_tuition,setup_status,notes',
      )
      .order('account_name'),
    db
      .from('organization_subscriptions')
      .select(
        'status,billing_interval,current_period_end,billing_provider,provider_subscription_id,tenants(name,slug),subscription_plans(name,slug)',
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
            Admin subscriptions, signed-payment releases, PayPal automatic collection, and QuickBooks accounting.
          </p>
        </div>
        <CreateSchedule />
      </div>
      {preferences?.length ? (
        <section className="overflow-hidden rounded-xl border border-amber-300 bg-amber-50">
          <h2 className="border-b border-amber-200 px-4 py-3 font-bold">Account billing instructions</h2>
          <div className="divide-y divide-amber-200">
            {preferences.map((preference: any) => (
              <div key={preference.id} className="grid gap-2 px-4 py-4 text-sm md:grid-cols-[1fr_1fr_2fr]">
                <div>
                  <p className="font-bold text-slate-950">{preference.account_name}</p>
                  <p className="capitalize text-slate-700">{preference.cadence}</p>
                </div>
                <div>
                  <p className="font-semibold text-slate-950">
                    {preference.cadence === 'monthly' && preference.billing_day_of_month
                      ? `${preference.billing_day_of_month}th of each month`
                      : 'See account notes'}
                  </p>
                  <p className="text-slate-700">
                    Next date:{' '}
                    {preference.cadence === 'monthly' && preference.billing_day_of_month
                      ? nextMonthlyBillingDate(preference.billing_day_of_month)
                      : 'Not calculated'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold capitalize text-amber-950">
                    {String(preference.setup_status).replaceAll('_', ' ')}
                  </p>
                  <p className="text-amber-900">
                    {preference.notes || 'Provider, amount, and authorization still need to be configured.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
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
        <h2 className="border-b px-4 py-3 font-bold">Apprentice subscriptions</h2>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Cadence</th>
              <th className="px-4 py-3">Next invoice</th>
              <th className="px-4 py-3">Automatic collection</th>
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
                <td className="px-4 py-3">
                  {s.collection_mode === 'automatic' ? (
                    <PayPalSetupAction
                      scheduleId={s.id}
                      providerStatus={s.provider_status}
                      approvalUrl={s.provider_approval_url}
                    />
                  ) : (
                    <span className="text-xs text-slate-500">Manual invoice</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="overflow-x-auto rounded-xl border bg-white">
        <h2 className="border-b px-4 py-3 font-bold">Organization subscription history</h2>
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
