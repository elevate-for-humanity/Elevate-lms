import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { syncHostShopSubscriptionLifecycle } from '@/lib/platform/orchestration/host-shop-subscription';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Host Shop Subscription Confirmed | Elevate', robots: { index: false, follow: false } };

const HOST_SHOP_DASHBOARD_URL = 'https://app.elevateforhumanity.org/host-shop/dashboard';

export default async function HostShopSubscriptionSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect(HOST_SHOP_DASHBOARD_URL);

  await hydrateProcessEnv();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) {
    redirect(`/login?redirect=${encodeURIComponent(`/host-shop/subscription/success?session_id=${sessionId}`)}`);
  }

  const stripe = getStripe();
  if (!stripe) return <Failure message="Billing verification is temporarily unavailable." />;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (
      session.status !== 'complete' ||
      session.mode !== 'subscription' ||
      session.client_reference_id !== user.id ||
      session.metadata?.checkout_type !== 'host_shop_subscription'
    ) {
      return <Failure message="This checkout could not be verified for the signed-in Host Shop account." />;
    }

    const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
    if (!subscriptionId) return <Failure message="Stripe did not attach a recurring subscription to this checkout." />;

    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!['active', 'trialing'].includes(subscription.status)) {
      return <Failure message={`Stripe subscription status is ${subscription.status}, so portal access was not activated.`} />;
    }
    if (
      subscription.metadata?.user_id !== user.id ||
      subscription.metadata?.checkout_type !== 'host_shop_subscription'
    ) {
      return <Failure message="Stripe subscription identity does not match this Host Shop login." />;
    }

    const admin = await requireAdminClient();
    await syncHostShopSubscriptionLifecycle(admin, subscription);
  } catch {
    return <Failure message="Your payment was verified, but Host Shop access could not be synchronized. Contact support before purchasing again." />;
  }

  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-widest text-emerald-700">Subscription confirmed</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Host Shop access is synchronized</h1>
        <p className="mt-4 leading-7 text-slate-600">Your Stripe subscription and Elevate Host Shop partnership now use the same billing status.</p>
        <Link href={HOST_SHOP_DASHBOARD_URL} className="mt-8 inline-flex rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">
          Open Host Shop Dashboard
        </Link>
      </div>
    </main>
  );
}

function Failure({ message }: { message: string }) {
  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Subscription verification pending</h1>
        <p className="mt-3 text-slate-600">{message}</p>
        <Link href={HOST_SHOP_DASHBOARD_URL} className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">
          Return to Host Shop Dashboard
        </Link>
      </div>
    </main>
  );
}
