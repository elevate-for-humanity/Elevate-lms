import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { finalizeImplementationPurchase } from '@/lib/store/finalize-implementation-purchase';
import { formatImplementationPrice } from '@/lib/store/implementation-packages';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'Platform Purchase Confirmed | Elevate Store',
  robots: { index: false, follow: false },
};

export default async function ImplementationPackageSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id: sessionId } = await searchParams;
  if (!sessionId) redirect('/store/implementation-packages');

  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) return <Pending />;

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return <Pending />;
  }

  const isImplementationCheckout =
    session.metadata?.kind === 'implementation_package' &&
    session.metadata?.checkout_type === 'standalone_platform_build';
  const paymentConfirmed = ['paid', 'no_payment_required'].includes(session.payment_status ?? '');
  if (!isImplementationCheckout || !paymentConfirmed) return <Pending />;

  let db;
  try {
    db = await requireAdminClient();
  } catch {
    return (
      <Pending message="Payment is confirmed, but order recording is temporarily delayed. Do not submit another payment." />
    );
  }

  const finalized = await finalizeImplementationPurchase({ db, session });
  if (!finalized.success) {
    return (
      <Pending
        message={`Payment is confirmed, but order recording is still processing. Do not submit another payment. ${finalized.error || ''}`.trim()}
      />
    );
  }

  const isDeposit = finalized.status === 'deposit_paid';
  return (
    <main className="grid min-h-[70vh] place-items-center bg-slate-50 px-5 py-16">
      <section className="w-full max-w-2xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl sm:p-12">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-700" aria-hidden />
        <h1 className="mt-5 text-3xl font-black text-slate-950">Payment confirmed</h1>
        <p className="mt-4 font-semibold leading-7 text-slate-700">
          Your standalone platform order is recorded in Elevate. We will use the contact information
          provided at checkout to send the scope agreement and onboarding checklist.
        </p>
        {isDeposit ? (
          <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold leading-6 text-slate-800">
            Remaining contract balance: {formatImplementationPrice(finalized.balanceDueCents ?? 0)}.
            The agreed monthly payments will be sent as manual invoices and will not be
            automatically charged.
          </p>
        ) : (
          <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
            The selected package has been paid in full.
          </p>
        )}
        <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
          Project work begins after the signed scope and required branding and content materials are
          received.
        </p>
        <p className="mt-4 break-all font-mono text-xs font-semibold text-slate-500">
          Order: {finalized.orderId}
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            href="/contact?topic=standalone-platform-onboarding"
            className="rounded-xl bg-brand-red-700 px-6 py-3 font-black text-white hover:bg-brand-red-800"
          >
            Contact Onboarding
          </Link>
          <Link
            href="/store"
            className="rounded-xl border-2 border-slate-800 px-6 py-3 font-black text-slate-950 hover:bg-slate-100"
          >
            Return to Store
          </Link>
        </div>
      </section>
    </main>
  );
}

function Pending({
  message = 'Payment verification is still processing. Do not submit another payment. Contact support if this message remains.',
}: {
  message?: string;
}) {
  return (
    <main className="grid min-h-[65vh] place-items-center bg-slate-50 px-5 py-16">
      <section className="w-full max-w-xl rounded-2xl border border-amber-300 bg-white p-8 text-center">
        <h1 className="text-2xl font-black text-slate-950">Payment verification pending</h1>
        <p className="mt-3 text-slate-700">{message}</p>
        <Link
          href="/contact?topic=standalone-platform-payment"
          className="mt-6 inline-flex rounded-xl bg-slate-950 px-5 py-3 font-bold text-white hover:bg-slate-800"
        >
          Contact Support
        </Link>
      </section>
    </main>
  );
}
