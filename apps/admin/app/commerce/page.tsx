import type { Metadata } from 'next';
import Link from 'next/link';
import { requireRole } from '@/lib/auth/require-role';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Commerce | Admin' };

function money(cents: number | null | undefined) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(
    Number(cents || 0) / 100,
  );
}

export default async function CommerceAdminPage() {
  await requireRole(['admin', 'super_admin']);
  const db = await requireAdminClient();

  const [ordersRes, implementationOrdersRes, subsRes, cartsRes, couponsRes] = await Promise.all([
    db
      .from('store_orders')
      .select('id,user_id,status,total_cents,stripe_session_id,items,created_at,updated_at')
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('implementation_orders')
      .select(
        'id,package_name,payment_choice,status,package_total_cents,checkout_amount_cents,amount_paid_cents,balance_due_cents,installment_count,installment_amount_cents,customer_email,customer_name,stripe_checkout_session_id,created_at,paid_at',
      )
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('subscriptions')
      .select(
        'id,user_id,tenant_id,plan_id,status,current_period_start,current_period_end,cancel_at_period_end,created_at',
      )
      .order('created_at', { ascending: false })
      .limit(50),
    db
      .from('cart_items')
      .select('id,user_id,product_id,quantity,created_at')
      .order('created_at', { ascending: false })
      .limit(100),
    db
      .from('coupons')
      .select('id,code,discount_type,discount_value,usage_count,usage_limit,expires_at,is_active')
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const orders = ordersRes.data ?? [];
  const implementationOrders = implementationOrdersRes.data ?? [];
  const subscriptions = subsRes.data ?? [];
  const carts = cartsRes.data ?? [];
  const coupons = couponsRes.data ?? [];
  const paid = orders.filter((o: any) =>
    ['paid', 'complete', 'completed'].includes(String(o.status || '').toLowerCase()),
  );
  const pending = orders.filter((o: any) => String(o.status || '').toLowerCase() === 'pending');
  const revenueCents = paid.reduce(
    (sum: number, order: any) => sum + Number(order.total_cents || 0),
    0,
  );
  const activeSubs = subscriptions.filter((s: any) =>
    ['active', 'trialing'].includes(String(s.status || '').toLowerCase()),
  );

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <header>
        <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">
          Admin · Commerce
        </p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">Store, checkout & subscriptions</h1>
        <p className="mt-2 max-w-3xl text-slate-600">
          Canonical operations view for store orders, active carts, subscriptions, and promotion
          codes backed by Supabase.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {[
          ['Orders', orders.length],
          ['Pending checkout', pending.length],
          ['Paid revenue', money(revenueCents)],
          ['Active subscriptions', activeSubs.length],
          ['Cart line items', carts.length],
          ['Platform builds', implementationOrders.length],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="text-2xl font-black text-slate-950">{value}</div>
            <div className="mt-1 text-sm font-semibold text-slate-600">{label}</div>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Standalone platform orders</h2>
            <p className="text-sm text-slate-600">
              Deposits, full payments, remaining balances and manual monthly invoice schedules.
            </p>
          </div>
          <Link
            href="https://store.elevateforhumanity.org/store/implementation-packages"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
          >
            Open packages
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Customer</th>
                <th className="px-3 py-3">Package</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Paid</th>
                <th className="px-3 py-3">Balance</th>
                <th className="px-3 py-3">Schedule</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {implementationOrders.length ? (
                implementationOrders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-3 py-3">
                      {order.created_at ? new Date(order.created_at).toLocaleString('en-US') : '—'}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold">{order.customer_name || 'Checkout pending'}</div>
                      <div className="text-xs text-slate-600">
                        {order.customer_email || 'Contact collected after payment'}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-bold">{order.package_name}</div>
                      <div className="text-xs text-slate-600">
                        {order.payment_choice === 'deposit' ? 'Deposit plan' : 'Paid in full'}
                      </div>
                    </td>
                    <td className="px-3 py-3 font-bold">
                      {String(order.status || 'unknown').replaceAll('_', ' ')}
                    </td>
                    <td className="px-3 py-3">{money(order.amount_paid_cents)}</td>
                    <td className="px-3 py-3 font-bold">{money(order.balance_due_cents)}</td>
                    <td className="px-3 py-3">
                      {Number(order.installment_count || 0) > 0
                        ? `${order.installment_count} × ${money(order.installment_amount_cents)} monthly`
                        : 'None'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    No standalone platform orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black">Recent store orders</h2>
            <p className="text-sm text-slate-600">
              Server-created Stripe Checkout orders. Client prices are not trusted.
            </p>
          </div>
          <Link
            href="https://www.elevateforhumanity.org/store"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold"
          >
            Open public store
          </Link>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b">
                <th className="px-3 py-3">Created</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3">Total</th>
                <th className="px-3 py-3">Items</th>
                <th className="px-3 py-3">Stripe session</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.length ? (
                orders.map((order: any) => (
                  <tr key={order.id}>
                    <td className="px-3 py-3">
                      {order.created_at ? new Date(order.created_at).toLocaleString('en-US') : '—'}
                    </td>
                    <td className="px-3 py-3 font-bold">{order.status || 'unknown'}</td>
                    <td className="px-3 py-3">{money(order.total_cents)}</td>
                    <td className="px-3 py-3">
                      {Array.isArray(order.items) ? order.items.length : '—'}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">
                      {order.stripe_session_id || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-slate-500">
                    No store orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Subscriptions</h2>
          <div className="mt-4 divide-y">
            {subscriptions.length ? (
              subscriptions.map((sub: any) => (
                <div key={sub.id} className="py-3">
                  <div className="flex justify-between gap-4">
                    <span className="font-bold">{sub.plan_id || 'Plan'}</span>
                    <span className="font-bold">{sub.status || 'unknown'}</span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {sub.current_period_start || '—'} → {sub.current_period_end || '—'}
                    {sub.cancel_at_period_end ? ' · cancels at period end' : ''}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-slate-500">No subscriptions found.</p>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black">Promotion codes</h2>
          <div className="mt-4 divide-y">
            {coupons.length ? (
              coupons.map((coupon: any) => (
                <div key={coupon.id} className="py-3">
                  <div className="flex justify-between gap-4">
                    <span className="font-mono font-bold">{coupon.code}</span>
                    <span
                      className={
                        coupon.is_active ? 'font-bold text-emerald-700' : 'font-bold text-slate-500'
                      }
                    >
                      {coupon.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    {coupon.discount_type} · {String(coupon.discount_value)} · uses{' '}
                    {coupon.usage_count ?? 0}/{coupon.usage_limit ?? '∞'}
                  </div>
                </div>
              ))
            ) : (
              <p className="py-6 text-sm text-slate-500">No coupons found.</p>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
