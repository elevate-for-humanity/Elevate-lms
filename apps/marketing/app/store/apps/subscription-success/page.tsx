import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getIndividualAppCatalog } from '@/lib/apps/individual-app-plans';
import { syncIndividualAppLifecycle } from '@/lib/platform/subscription-lifecycle';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-20">
      <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">We could not verify this subscription</h1>
        <p className="mt-4 leading-7 text-slate-600">{message}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/store/apps" className="rounded-xl bg-slate-900 px-5 py-3 font-bold text-white">
            Return to Store
          </Link>
          <Link href="/contact" className="rounded-xl border border-slate-300 px-5 py-3 font-bold text-slate-700">
            Contact Support
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function IndividualAppSubscriptionSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  await hydrateProcessEnv();

  const { session_id: sessionId } = await searchParams;
  if (!sessionId) return <ErrorState message="The Stripe checkout session ID is missing." />;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect(`/login?redirect=${encodeURIComponent(`/store/apps/subscription-success?session_id=${sessionId}`)}`);
  }

  const stripe = getStripe();
  if (!stripe) return <ErrorState message="Stripe billing is not configured." />;

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return <ErrorState message="Stripe could not find that checkout session." />;
  }

  const metadata = session.metadata || {};
  if (metadata.checkout_type !== 'individual_app') {
    return <ErrorState message="This checkout session is not an individual app subscription." />;
  }
  if (metadata.user_id !== user.id) {
    return <ErrorState message="This checkout belongs to a different signed-in user." />;
  }
  if (session.status !== 'complete') {
    return <ErrorState message="Stripe has not marked this checkout as complete." />;
  }

  const catalog = getIndividualAppCatalog(metadata.app_slug || '');
  const plan = catalog?.plans.find((candidate) => candidate.id === metadata.plan_id);
  if (!catalog || !plan) {
    return <ErrorState message="The purchased app or plan is not in the current Store catalog." />;
  }

  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : null;
  if (!subscriptionId) {
    return <ErrorState message="Stripe did not attach a recurring subscription to this checkout." />;
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    if (!['active', 'trialing'].includes(stripeSubscription.status)) {
      return <ErrorState message={`Stripe subscription status is ${stripeSubscription.status}, so access was not activated.`} />;
    }

    const subscriptionMetadata = stripeSubscription.metadata || {};
    if (
      subscriptionMetadata.checkout_type !== 'individual_app' ||
      subscriptionMetadata.user_id !== user.id ||
      subscriptionMetadata.app_slug !== catalog.slug ||
      subscriptionMetadata.plan_id !== plan.id
    ) {
      return <ErrorState message="Stripe subscription metadata does not match this purchase." />;
    }

    const admin = await requireAdminClient();
    await syncIndividualAppLifecycle(admin, stripeSubscription);
  } catch {
    return <ErrorState message="Your payment was verified, but the app entitlement could not be synchronized. Please contact support before purchasing again." />;
  }

  redirect(`/apps/${catalog.slug}?subscription=active`);
}
