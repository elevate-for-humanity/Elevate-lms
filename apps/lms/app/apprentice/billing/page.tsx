import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import BillingCard, { type BillingSummary } from '@/components/learner/BillingCard';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { APPRENTICE_PORTAL_CONFIGS } from '@/components/portal/ApprenticePortalShell';
import { AlertTriangle, ArrowLeft, ChevronRight, CreditCard, DollarSign } from 'lucide-react';

export const metadata: Metadata = { title: 'Billing | Apprentice Portal', description: 'Update your payment method and view tuition status.' };
export const dynamic = 'force-dynamic';

type SubscriptionRow = {
  payment_status?: string | null;
  weekly_payment_cents?: number | null;
  remaining_balance?: number | null;
  full_tuition_amount?: number | null;
  amount_paid_at_checkout?: number | null;
  next_payment_date?: string | null;
  fully_paid?: boolean | null;
  setup_fee_paid?: boolean | null;
  stripe_subscription_id?: string | null;
};

function summary(program: 'barber' | 'cosmetology', sub: SubscriptionRow): BillingSummary {
  return {
    program,
    paymentStatus: sub.payment_status ?? 'pending_payment_method',
    weeklyPaymentCents: sub.weekly_payment_cents ?? null,
    remainingBalance: sub.remaining_balance ?? null,
    fullTuitionAmount: sub.full_tuition_amount ?? null,
    amountPaidAtCheckout: sub.amount_paid_at_checkout ?? null,
    nextPaymentDate: sub.next_payment_date ?? null,
    fullyPaid: sub.fully_paid ?? false,
    setupFeePaid: sub.setup_fee_paid ?? false,
  };
}

function BillingFallback({ portalPath, message }: { portalPath: string; message: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link href={portalPath} className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" /><div><h1 className="font-bold text-slate-950">Billing account needs review</h1><p className="mt-1 text-sm text-slate-700">{message}</p></div></div>
      </div>
      <StudentPaymentCard />
    </div>
  );
}

function SubscriptionBilling({ billing, portalPath, needsPaymentMethod }: { billing: BillingSummary; portalPath: string; needsPaymentMethod: boolean }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link href={portalPath} className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      {needsPaymentMethod ? (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm text-red-800"><p className="mb-1 font-semibold">Payment method required</p><p>Add or update your payment method to keep the tuition account current.</p></div>
        </div>
      ) : null}
      <BillingCard billing={billing} />
    </div>
  );
}

export default async function ApprenticeBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/apprentice/billing');

  const programSlug = await resolveApprenticeProgramSlug(supabase, user.id);
  const portalPath = (programSlug && APPRENTICE_PORTAL_CONFIGS[programSlug]?.portalPath) || '/apprentice';
  const db = await requireAdminClient();

  if (programSlug === 'barber-apprenticeship') {
    const { data } = await db
      .from('barber_subscriptions')
      .select('payment_status,weekly_payment_cents,remaining_balance,full_tuition_amount,amount_paid_at_checkout,next_payment_date,fully_paid,setup_fee_paid,stripe_subscription_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sub = data as SubscriptionRow | null;
    if (!sub) return <BillingFallback portalPath={portalPath} message="No barber tuition account was found. Contact support if you recently enrolled." />;
    return <SubscriptionBilling billing={summary('barber', sub)} portalPath={portalPath} needsPaymentMethod={!sub.fully_paid && !sub.stripe_subscription_id && !sub.setup_fee_paid} />;
  }

  if (programSlug === 'cosmetology-apprenticeship') {
    const { data } = await db
      .from('cosmetology_subscriptions')
      .select('payment_status,weekly_payment_cents,remaining_balance,full_tuition_amount,amount_paid_at_checkout,next_payment_date,fully_paid,setup_fee_paid,stripe_subscription_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sub = data as SubscriptionRow | null;
    if (sub) return <SubscriptionBilling billing={summary('cosmetology', sub)} portalPath={portalPath} needsPaymentMethod={!sub.fully_paid && !sub.stripe_subscription_id && !sub.setup_fee_paid} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link href={portalPath} className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-950"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      <StudentPaymentCard />
    </div>
  );
}

function StudentPaymentCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 p-5"><CreditCard className="h-5 w-5 text-brand-blue-600" /><h2 className="font-semibold text-slate-950">Payment & Billing</h2></div>
      <div className="space-y-3 p-5">
        <p className="text-sm text-slate-700">Manage tuition payments and view your billing history.</p>
        <Link href="/billing" className="flex items-center justify-between rounded-lg bg-slate-50 p-4 hover:bg-slate-100"><span className="flex items-center gap-3"><DollarSign className="h-5 w-5" /><span><span className="block font-medium text-slate-950">Payment History</span><span className="text-xs text-slate-600">View payments and receipts</span></span></span><ChevronRight className="h-5 w-5 text-slate-400" /></Link>
        <Link href="/enrollment" className="flex items-center justify-between rounded-lg bg-brand-blue-50 p-4 hover:bg-brand-blue-100"><span className="flex items-center gap-3"><CreditCard className="h-5 w-5 text-brand-blue-700" /><span><span className="block font-medium text-slate-950">Make a Payment</span><span className="text-xs text-slate-600">Review tuition and payment options</span></span></span><ChevronRight className="h-5 w-5 text-slate-400" /></Link>
      </div>
    </div>
  );
}
