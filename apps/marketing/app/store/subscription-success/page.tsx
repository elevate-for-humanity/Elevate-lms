import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle, ArrowRight, CreditCard, PlusCircle } from 'lucide-react';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { ADD_ON_MARKETPLACE, getBasePlan } from '@/lib/store/platform-pricing';
import { syncPlatformSubscriptionLifecycle } from '@/lib/platform/subscription-lifecycle';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Subscription Confirmed | Elevate Store',
  robots: { index: false, follow: false },
};

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;
  if (!session_id) redirect('/store/plans');

  await hydrateProcessEnv();
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?redirect=${encodeURIComponent(`/store/subscription-success?session_id=${session_id}`)}`);

  const stripe = getStripe();
  if (!stripe) {
    return <Failure message="Billing verification is temporarily unavailable. Your card will not be charged again by refreshing this page." />;
  }

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(session_id);
  } catch {
    return <Failure message="We could not verify this checkout session." />;
  }

  const belongsToUser = session.client_reference_id === user.id || session.customer_details?.email === user.email;
  const isPlatformSubscription = session.mode === 'subscription' && session.metadata?.checkout_type === 'platform_saas';
  const paid = session.payment_status === 'paid' || session.status === 'complete';

  if (!belongsToUser || !isPlatformSubscription || !paid) {
    return <Failure message="This subscription has not been verified as completed for your account." />;
  }

  const planId = session.metadata?.plan_id ?? '';
  const plan = getBasePlan(planId);
  if (!plan) return <Failure message="The purchased platform plan is not in the current Store catalog." />;

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  if (!subscriptionId) {
    return <Failure message="Stripe did not attach a recurring subscription to this checkout." />;
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!['active', 'trialing'].includes(stripeSubscription.status)) {
      return <Failure message={`Stripe subscription status is ${stripeSubscription.status}, so platform access was not activated.`} />;
    }
    if (
      stripeSubscription.metadata?.checkout_type !== 'platform_saas' ||
      stripeSubscription.metadata?.user_id !== user.id ||
      stripeSubscription.metadata?.plan_id !== plan.id
    ) {
      return <Failure message="Stripe subscription metadata does not match this platform purchase." />;
    }

    const admin = await requireAdminClient();
    await syncPlatformSubscriptionLifecycle(admin, stripeSubscription);
  } catch {
    return <Failure message="Your payment was verified, but platform access could not be synchronized. Please contact support before purchasing again." />;
  }

  const purchasedAddons = new Set((session.metadata?.addon_slugs || '').split(',').map((value) => value.trim()).filter(Boolean));
  const planFeatures = new Set(plan.features || []);
  const recommendedAddons = ADD_ON_MARKETPLACE.filter((addon) => {
    if (purchasedAddons.has(addon.slug)) return false;
    if (addon.features.length > 0 && addon.features.every((feature) => planFeatures.has(feature))) return false;
    return true;
  }).slice(0, 6);

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-8 w-8 text-green-700" />
          </div>
          <h1 className="text-center text-3xl font-black text-slate-950">Subscription confirmed</h1>
          <p className="mt-3 text-center text-slate-600">
            Stripe confirmed your {plan.name} subscription and Elevate synchronized the workspace entitlements before showing this confirmation.
          </p>

          <div className="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-slate-700">
            <div className="flex items-center gap-2 font-semibold text-slate-900">
              <CreditCard className="h-4 w-4" /> Billing reference
            </div>
            <p className="mt-2 break-all font-mono text-xs">{session.id}</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <a
              href="https://app.elevateforhumanity.org/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-bold text-white hover:bg-brand-red-700"
            >
              Open Platform <ArrowRight className="h-4 w-4" />
            </a>
            <Link href="/store/plans" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50">
              Manage plan options
            </Link>
            <Link href="/store/apps" className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50">
              Search full Store
            </Link>
          </div>
        </section>

        {recommendedAddons.length > 0 && (
          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex items-center gap-3">
              <PlusCircle className="h-6 w-6 text-brand-red-700" />
              <div>
                <h2 className="text-2xl font-black text-slate-950">Add more capability</h2>
                <p className="mt-1 text-sm text-slate-600">These options are not already included in the plan you just purchased.</p>
              </div>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {recommendedAddons.map((addon) => (
                <article key={addon.slug} className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                  <h3 className="font-black text-slate-900">{addon.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{addon.description}</p>
                  <div className="mt-4 text-lg font-black text-slate-900">${addon.priceMonthly}/mo</div>
                  <Link href={`/store/plans?addon=${encodeURIComponent(addon.slug)}`} className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-brand-red-700 hover:underline">
                    Add or compare <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              ))}
            </div>
          </section>
        )}
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
        <Link href="/store/plans" className="mt-6 inline-flex rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white">
          Return to plans
        </Link>
      </div>
    </main>
  );
}
