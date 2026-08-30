import Link from 'next/link';
import { AlertCircle, Calendar, CreditCard, ShieldCheck } from 'lucide-react';
import { requireRole } from '@/lib/auth/require-role';
import { HOST_SHOP_ROLES } from '@/lib/rbac/role-matrix';
import { getHostShopBoard } from '@/lib/partner/board';
import { requireAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: 'Subscription | Host Shop Portal',
  description: 'View the host shop subscription record stored in Elevate.',
  robots: { index: false, follow: false },
};

export default async function SubscriptionPage() {
  const { user } = await requireRole(HOST_SHOP_ROLES);
  const board = await getHostShopBoard(user.id);
  const db = await requireAdminClient();
  const shopIds = board.shops.map((shop) => shop.id).filter(Boolean);

  const { data: subscriptions, error } = shopIds.length
    ? await db
        .from('host_shop_subscriptions')
        .select('id, host_shop_id, plan, status, started_at, expires_at, created_at')
        .in('host_shop_id', shopIds)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: [], error: null };

  const rows = subscriptions ?? [];
  const current = rows.find((subscription) =>
    ['active', 'trialing', 'past_due'].includes(String(subscription.status || '').toLowerCase()),
  ) ?? rows[0] ?? null;

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.14em] text-brand-blue-700">{board.partner?.name || 'Host Shop'}</p>
          <h1 className="mt-2 text-3xl font-black text-slate-950">Subscription</h1>
          <p className="mt-2 text-slate-600">Live host-shop subscription status. Sample prices and billing history have been removed.</p>
        </div>
        <Link href="/host-shop/dashboard" className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50">Back to dashboard</Link>
      </div>

      {error ? <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800">Subscription data could not be loaded. No sample billing information is being substituted.</div> : null}

      {current ? (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-blue-50 text-brand-blue-700"><CreditCard className="h-6 w-6" /></div><h2 className="mt-5 text-2xl font-black capitalize text-slate-950">{current.plan || 'Host Shop Plan'}</h2><p className="mt-1 text-sm text-slate-600">Subscription record {current.id}</p></div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-black capitalize text-slate-800">{current.status || 'unknown'}</span>
          </div>

          <dl className="mt-7 grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-5"><dt className="flex items-center gap-2 text-sm font-bold text-slate-600"><Calendar className="h-4 w-4" /> Started</dt><dd className="mt-2 font-black text-slate-950">{current.started_at ? new Date(current.started_at).toLocaleString() : 'Not recorded'}</dd></div>
            <div className="rounded-2xl border border-slate-200 p-5"><dt className="flex items-center gap-2 text-sm font-bold text-slate-600"><Calendar className="h-4 w-4" /> Expires / renews</dt><dd className="mt-2 font-black text-slate-950">{current.expires_at ? new Date(current.expires_at).toLocaleString() : 'Not recorded'}</dd></div>
          </dl>
        </section>
      ) : (
        <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 sm:p-9">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><AlertCircle className="h-6 w-6" /></div>
          <h2 className="mt-5 text-2xl font-black text-slate-950">No host-shop subscription record found</h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-700">This account does not currently have a record in the host-shop subscription ledger. The portal will not invent a plan, price, payment, or renewal date.</p>
          <div className="mt-6 rounded-2xl border border-brand-green-200 bg-brand-green-50 p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 text-brand-green-700" /><p className="text-sm font-semibold text-brand-green-950">Billing details appear only after a verified subscription or payment workflow creates the corresponding database record.</p></div></div>
          <Link href="https://www.elevateforhumanity.org/contact" className="mt-6 inline-flex rounded-xl bg-brand-blue-700 px-5 py-3 text-sm font-black text-white hover:bg-brand-blue-800">Contact support about host-shop billing</Link>
        </section>
      )}
    </main>
  );
}
