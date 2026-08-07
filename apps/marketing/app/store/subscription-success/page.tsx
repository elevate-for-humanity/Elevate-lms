import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle, ArrowRight, CreditCard } from 'lucide-react';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { createClient } from '@/lib/supabase/server';

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

  const plan = session.metadata?.plan_id ?? 'platform';

  return (
    <main className="min-h-[70vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-8 w-8 text-green-700" />
        </div>
        <h1 className="text-center text-3xl font-black text-slate-950">Subscription confirmed</h1>
        <p className="mt-3 text-center text-slate-600">
          Stripe confirmed your {plan} subscription. Your organization access is synchronized by the store webhook.
        </p>

        <div className="mt-8 rounded-xl bg-slate-50 p-5 text-sm text-slate-700">
          <div className="flex items-center gap-2 font-semibold text-slate-900">
            <CreditCard className="h-4 w-4" /> Billing reference
          </div>
          <p className="mt-2 break-all font-mono text-xs">{session.id}</p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <a
            href="https://app.elevateforhumanity.org/login"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-red-600 px-5 py-3 font-bold text-white hover:bg-brand-red-700"
          >
            Open Platform <ArrowRight className="h-4 w-4" />
          </a>
          <Link
            href="/store/plans"
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800 hover:bg-slate-50"
          >
            View Plans
          </Link>
        </div>
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
