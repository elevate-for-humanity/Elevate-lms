import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle, ArrowRight, Package } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import CartPurchaseComplete from '@/components/store/CartPurchaseComplete.client';
import { finalizeCartPurchase } from '@/lib/store/finalize-cart-purchase';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Purchase Confirmed | Elevate Store',
  robots: { index: false, follow: false },
};

export default async function CartSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) redirect('/store/cart');

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `https://app.elevateforhumanity.org/login?redirect=${encodeURIComponent(
        `https://www.elevateforhumanity.org/store/cart-success?session_id=${session_id}`,
      )}`,
    );
  }

  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) return <Pending />;

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    return <Pending />;
  }

  const belongsToUser =
    session.client_reference_id === user.id || session.customer_details?.email === user.email;
  const complete =
    session.metadata?.kind === 'store_purchase' &&
    session.metadata?.checkout_type === 'store_cart' &&
    ['paid', 'no_payment_required'].includes(session.payment_status ?? '');
  if (!belongsToUser || !complete) return <Pending />;

  let db;
  try {
    db = await requireAdminClient();
  } catch {
    return <Pending message="Payment is confirmed, but order processing is temporarily unavailable. Do not submit another payment." />;
  }

  const finalized = await finalizeCartPurchase({
    db,
    session,
    expectedUserId: user.id,
  });
  if (!finalized.success) {
    return (
      <Pending
        message={`Payment is confirmed, but the order still needs processing. Do not submit another payment. ${finalized.error || ''}`.trim()}
      />
    );
  }

  const productCount = Math.max(1, Number(session.metadata?.item_count || 1));
  const hasPhysical = session.metadata?.has_physical_items === 'true';

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
      <CartPurchaseComplete />
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-700" aria-hidden />
        </div>
        <h1 className="mt-5 text-3xl font-black text-slate-950">Payment confirmed</h1>
        <p className="mt-3 text-slate-700">
          Your paid order is recorded for {productCount} store item{productCount === 1 ? '' : 's'}.
          Digital access has been granted for eligible products.
        </p>
        {hasPhysical ? (
          <div className="mx-auto mt-6 flex max-w-md items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-700">
            <Package className="mt-0.5 h-5 w-5 flex-none text-brand-red-700" aria-hidden />
            <p>
              Your order includes a physical item. Shipping information collected by Stripe is stored
              with the paid order for fulfillment.
            </p>
          </div>
        ) : null}
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/store" className="rounded-xl bg-brand-red-600 px-6 py-3 font-bold text-white hover:bg-brand-red-700">
            Continue Shopping
          </Link>
          <a
            href="https://app.elevateforhumanity.org/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-900 hover:bg-slate-50"
          >
            Open Account <ArrowRight className="h-4 w-4" aria-hidden />
          </a>
        </div>
        <p className="mt-6 break-all font-mono text-xs font-semibold text-slate-600">Order: {finalized.orderId}</p>
      </div>
    </main>
  );
}

function Pending({
  message = 'Do not submit another payment. Return to your account or contact support if this status does not update.',
}: {
  message?: string;
}) {
  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-300 bg-white p-8 text-center">
        <h1 className="text-2xl font-black text-slate-950">Payment verification pending</h1>
        <p className="mt-3 text-slate-700">{message}</p>
        <Link href="/store" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800">
          Return to Store
        </Link>
      </div>
    </main>
  );
}
