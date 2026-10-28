import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'My Purchases | Elevate Store', robots: { index: false, follow: false } };
const currency = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
const statusLabels: Record<string, string> = {
  paid: 'Payment received', pending: 'Awaiting payment confirmation', failed: 'Checkout needs attention',
  refunded: 'Refunded', cancelled: 'Cancelled', canceled: 'Cancelled',
};

export default async function StoreOrdersPage({ searchParams }: { searchParams: Promise<{ order_id?: string }> }) {
  const { order_id } = await searchParams;
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  const returnPath = `/store/orders${order_id ? `?order_id=${encodeURIComponent(order_id)}` : ''}`;
  if (!user) redirect(`/login?redirect=${encodeURIComponent(returnPath)}`);
  const db = await requireAdminClient();
  // Privileged reads are bound to the authenticated buyer, never a supplied user ID.
  let query = db.from('store_orders').select('id,status,total_cents,items,created_at')
    .eq('user_id', user.id).order('created_at', { ascending: false }).limit(50);
  if (order_id) query = query.eq('id', order_id);
  const [ordersResult, accessResult] = await Promise.all([
    query,
    db.from('user_entitlements').select('id,name,product_id,entitlement_type,status')
      .eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(100),
  ]);
  const failed = Boolean(ordersResult.error || accessResult.error);
  const orders = ordersResult.data ?? [];
  const access = accessResult.data ?? [];
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <p className="text-sm font-bold uppercase tracking-widest text-brand-red-700">Elevate Store</p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">My purchases</h1>
      <p className="mt-3 text-slate-700">Your payment status and purchased access, verified from your account.</p>
      <div className="mt-5 flex flex-wrap gap-4">
        <Link className="font-bold underline" href="/store">Continue shopping</Link>
        {order_id && <Link className="font-bold underline" href="/store/orders">View all orders</Link>}
      </div>
      {failed ? <p role="alert" className="mt-8 rounded-xl border border-amber-300 p-5">We could not load your purchases. Please refresh or contact support. Do not submit another payment for the same order.</p> : <>
        <section className="mt-8" aria-label="Order history">
          <h2 className="text-2xl font-bold">Orders</h2>
          {!orders.length && <p className="mt-4 rounded-xl border p-5">{order_id ? 'This order is unavailable in your account.' : 'You have no store orders yet.'}</p>}
          <div className="mt-4 space-y-4">{orders.map(order => (
            <article key={order.id} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="font-bold">{statusLabels[order.status] ?? 'Status under review'}</h3>
                <strong>{currency(Number(order.total_cents))}</strong>
              </div>
              <p className="mt-2 break-all text-xs text-slate-500">Order {order.id}</p>
              <ul className="mt-4 space-y-2">{(Array.isArray(order.items) ? order.items : []).map((item: any, index: number) => (
                <li key={`${item.product_id}-${index}`} className="flex flex-wrap justify-between gap-2 border-t pt-2">
                  <span>{item.name} × {item.quantity}</span>
                  <span>{currency(Number(item.unit_price_cents) * Number(item.quantity))}</span>
                </li>
              ))}</ul>
              {order.status === 'pending' && <p className="mt-4 text-sm text-slate-600">Payment is not confirmed yet. If you already paid, allow time for verification and refresh this page before paying again.</p>}
              <Link className="mt-4 inline-flex min-h-11 items-center font-bold underline" href={`/contact?topic=store-order&order=${encodeURIComponent(order.id)}`}>Get help with this order</Link>
            </article>
          ))}</div>
        </section>
        <section className="mt-10" aria-label="Purchased access">
          <h2 className="text-2xl font-bold">Active purchases</h2>
          {!access.length ? <p className="mt-3 text-slate-600">Purchased access appears after your payment is verified.</p> : <ul className="mt-4 grid gap-4 sm:grid-cols-2">{access.map(item => (
            <li key={item.id} className="rounded-xl border border-slate-200 p-5">
              <h3 className="font-bold">{item.name}</h3>
              <p className="mt-2 text-sm text-emerald-800">Active access</p>
              <Link className="mt-3 inline-flex min-h-11 items-center font-bold underline" href={`/contact?topic=purchase-access&product=${encodeURIComponent(item.product_id ?? item.id)}`}>Get access support</Link>
            </li>
          ))}</ul>}
        </section>
      </>}
    </main>
  );
}
