import { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import BillingCard, { type BillingSummary } from '@/components/learner/BillingCard';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { APPRENTICE_PORTAL_CONFIGS } from '@/components/portal/ApprenticePortalShell';
import { AlertTriangle, ArrowLeft, CreditCard, DollarSign, ChevronRight } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Billing | Apprentice Portal',
  description: 'Update your payment method and view tuition status.',
};

export const dynamic = 'force-dynamic';

export default async function ApprenticeBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?redirect=/apprentice/billing');
  }

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  const portalPath =
    (programSlug && APPRENTICE_PORTAL_CONFIGS[programSlug]?.portalPath) || '/apprentice';

  const hdrs = await headers();
  const billingUpdated = hdrs.get('x-pathname')?.includes('billing=updated');

  const db = await getAdminClient();

  if (programSlug === 'barber-apprenticeship' && db) {
    const { data: sub } = await db
      .from('barber_subscriptions')
      .select(
        'payment_status, weekly_payment_cents, remaining_balance, full_tuition_amount, amount_paid_at_checkout, next_payment_date, fully_paid, setup_fee_paid, stripe_customer_id, stripe_subscription_id',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!sub) {
      return (
        <BillingFallback
          portalPath={portalPath}
          message="No barber tuition account was found. Contact support if you recently enrolled."
        />
      );
    }

    const billing: BillingSummary = {
      program: 'barber',
      paymentStatus: sub.payment_status ?? 'pending_payment_method',
      weeklyPaymentCents: sub.weekly_payment_cents,
      remainingBalance: sub.remaining_balance,
      fullTuitionAmount: sub.full_tuition_amount,
      amountPaidAtCheckout: sub.amount_paid_at_checkout,
      nextPaymentDate: sub.next_payment_date,
      fullyPaid: sub.fully_paid ?? false,
      setupFeePaid: sub.setup_fee_paid ?? false,
    };

    const needsPaymentMethod =
      !sub.fully_paid &&
      !sub.stripe_subscription_id &&
      !sub.setup_fee_paid;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link
          href={portalPath}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {billingUpdated && (
          <div className="rounded-lg border border-brand-green-200 bg-brand-green-50 p-4 text-sm text-brand-green-800">
            Payment method updated. Weekly tuition will process on your next billing date.
          </div>
        )}

        {needsPaymentMethod && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Payment method required</p>
              <p>
                Add a debit or credit card below to stay enrolled. Without a card on file, your
                apprenticeship access will pause and OJT hours will stop counting.
              </p>
            </div>
          </div>
        )}

        <BillingCard billing={billing} />

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-600 space-y-2">
          <p className="font-semibold text-slate-800">Tuition policy</p>
          <p>
            Weekly barber apprenticeship tuition is billed automatically. You can update your
            payment method here — self-service subscription cancellation is not available in the
            student portal.
          </p>
          <p>
            If you are behind on payments, update your card immediately. Missed payments trigger a
            grace period, then suspension of clock-in and hour logging until the balance is
            current.
          </p>
        </div>
      </div>
    );
  }

  // Check for other subscriptions (cosmetology, etc.)
  const { data: cosmoSub } = programSlug === 'cosmetology-apprenticeship' && db
    ? await db
        .from('cosmetology_subscriptions')
        .select(
          'payment_status, weekly_payment_cents, remaining_balance, full_tuition_amount, amount_paid_at_checkout, next_payment_date, fully_paid, setup_fee_paid, stripe_customer_id, stripe_subscription_id',
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  if (cosmoSub) {
    const billing: BillingSummary = {
      program: 'cosmetology',
      paymentStatus: cosmoSub.payment_status ?? 'pending_payment_method',
      weeklyPaymentCents: cosmoSub.weekly_payment_cents,
      remainingBalance: cosmoSub.remaining_balance,
      fullTuitionAmount: cosmoSub.full_tuition_amount,
      amountPaidAtCheckout: cosmoSub.amount_paid_at_checkout,
      nextPaymentDate: cosmoSub.next_payment_date,
      fullyPaid: cosmoSub.fully_paid ?? false,
      setupFeePaid: cosmoSub.setup_fee_paid ?? false,
    };

    const needsPaymentMethod =
      !cosmoSub.fully_paid &&
      !cosmoSub.stripe_subscription_id &&
      !cosmoSub.setup_fee_paid;

    return (
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <Link
          href={portalPath}
          className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {needsPaymentMethod && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-sm text-red-800">
              <p className="font-semibold mb-1">Payment method required</p>
              <p>
                Add a debit or credit card below to stay enrolled. Without a card on file, your
                apprenticeship access will pause and OJT hours will stop counting.
              </p>
            </div>
          </div>
        )}

        <BillingCard billing={billing} />
      </div>
    );
  }

  // For programs without subscription management, show student payment portal
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <Link
        href={portalPath}
        className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to dashboard
      </Link>

      <StudentPaymentCard programSlug={programSlug} portalPath={portalPath} />
    </div>
  );
}

function StudentPaymentCard({ programSlug, portalPath }: { programSlug: string | null; portalPath: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-brand-blue-600" />
          <h2 className="text-base font-semibold text-slate-900">Payment & Billing</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
          Student Portal
        </span>
      </div>

      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-600">
          Manage your tuition payments and view your billing history.
        </p>

        <div className="grid gap-3">
          <Link
            href="/apprentice/billing"
            className="flex items-center justify-between p-4 bg-brand-blue-50 rounded-lg hover:bg-brand-blue-100 transition"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-brand-blue-600" />
              <div>
                <p className="font-medium text-slate-900">Manage Payment Method</p>
                <p className="text-xs text-slate-600">Add or update your card on file</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>

          <Link
            href="/billing"
            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">Payment History</p>
                <p className="text-xs text-slate-600">View past payments and receipts</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>

          <Link
            href="/enrollment"
            className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition"
          >
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-slate-600" />
              <div>
                <p className="font-medium text-slate-900">Make a Payment</p>
                <p className="text-xs text-slate-600">Pay your tuition balance</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400" />
          </Link>
        </div>

        <div className="pt-4 border-t">
          <p className="text-xs text-slate-500">
            Need help with billing?{' '}
            <Link href="/contact" className="text-brand-blue-600 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
