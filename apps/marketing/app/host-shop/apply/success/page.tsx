import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { emitPlatformEvent, PlatformEventType } from '@/lib/platform/orchestration/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Host Shop Application Submitted | Elevate', robots: { index: false, follow: false } };

const APPLICATION_FEE_CENTS = 5000;

export default async function HostShopApplicationSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect('/host-shop/apply');

  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) return <Failure message="Payment verification is temporarily unavailable." />;

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return <Failure message="Stripe could not find this payment session." />;
  }

  const applicationId = session.metadata?.application_id || session.client_reference_id || '';
  const paymentIntentId = typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  if (
    session.status !== 'complete' ||
    session.payment_status !== 'paid' ||
    session.mode !== 'payment' ||
    session.metadata?.checkout_type !== 'host_shop_application_fee' ||
    !applicationId ||
    session.amount_total !== APPLICATION_FEE_CENTS ||
    session.currency !== 'usd'
  ) {
    return <Failure message="This Host Shop application fee has not been verified as paid." />;
  }

  const db = await requireAdminClient();
  const { data: application } = await db
    .from('host_shop_applications')
    .select('id,status,application_fee_status,stripe_session_id')
    .eq('id', applicationId)
    .maybeSingle();
  if (!application) return <Failure message="The Host Shop application attached to this payment was not found." />;

  const now = new Date().toISOString();
  if (application.application_fee_status !== 'paid' || application.status === 'drafted') {
    const update: Record<string, unknown> = {
      status: application.status === 'drafted' ? 'submitted' : application.status,
      application_fee_status: 'paid',
      application_fee_amount_cents: APPLICATION_FEE_CENTS,
      application_fee_paid_at: now,
      stripe_session_id: session.id,
      stripe_payment_intent_id: paymentIntentId,
      updated_at: now,
    };
    if (application.status === 'drafted') update.submitted_at = now;

    const { error } = await db
      .from('host_shop_applications')
      .update(update)
      .eq('id', applicationId);
    if (error) return <Failure message="Payment was verified, but the Host Shop application could not be synchronized." />;
  }

  try {
    await emitPlatformEvent(db, {
      eventType: PlatformEventType.APPLICATION_SUBMITTED,
      category: 'application',
      source: 'marketing.host-shop.apply.success',
      subjectType: 'host_shop_application',
      subjectId: applicationId,
      correlationId: session.id,
      idempotencyKey: `host-shop-application-submitted:${applicationId}`,
      payload: {
        application_id: applicationId,
        fee_paid: true,
        amount_cents: APPLICATION_FEE_CENTS,
      },
    });
  } catch {
    // The database row is authoritative; the event can be replayed separately.
  }

  return (
    <main className="min-h-[65vh] bg-slate-50 px-4 py-16">
      <div className="mx-auto max-w-xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-black uppercase tracking-widest text-emerald-700">Payment verified</p>
        <h1 className="mt-3 text-3xl font-black text-slate-950">Host Shop application submitted</h1>
        <p className="mt-4 leading-7 text-slate-600">
          Your $50 application fee and application are linked to the same record. You do not need to submit or pay again.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/apprenticeships" className="rounded-xl bg-slate-950 px-6 py-3 font-bold text-white">
            View Apprenticeships
          </Link>
          <Link href="/contact" className="rounded-xl border border-slate-300 px-6 py-3 font-bold text-slate-700">
            Contact Support
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
        <h1 className="text-2xl font-black text-slate-950">Application payment verification pending</h1>
        <p className="mt-3 text-slate-600">{message}</p>
        <Link href="/contact" className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white">
          Contact Support
        </Link>
      </div>
    </main>
  );
}
