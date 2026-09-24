import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import BillingCard, { type BillingSummary } from '@/components/learner/BillingCard';
import { resolveApprenticeProgramSlug } from '@/lib/portal/resolve-apprentice-program';
import { APPRENTICE_PORTAL_CONFIGS } from '@/components/portal/ApprenticePortalShell';
import { resolvePortalPreviewSubject } from '@/lib/admin/portal-preview';
import { AlertTriangle, ArrowLeft, ChevronRight, CreditCard, DollarSign } from 'lucide-react';
import {
  getApprenticeBillingAccess,
  type ApprenticeDashboardInvoice,
} from '@/lib/billing/apprentice-invoice-batch';

export const metadata: Metadata = {
  title: 'Billing | Apprentice Portal',
  description: 'Review your tuition schedule, PayPal agreement, and payment status.',
};
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
};

type ScheduleRow = {
  amount_cents: number;
  cadence: string;
  next_invoice_date: string;
  status: string;
  provider_status: string;
  provider_subscription_id: string | null;
  provider_approval_url: string | null;
};

function summary(
  program: 'barber' | 'cosmetology',
  sub: SubscriptionRow,
  schedule: ScheduleRow | null,
): BillingSummary {
  const hasSubscription =
    schedule?.status === 'active' &&
    schedule.provider_status === 'active' &&
    Boolean(schedule.provider_subscription_id);
  return {
    program,
    paymentStatus:
      !sub.fully_paid && !hasSubscription
        ? 'pending_payment_method'
        : schedule?.status === 'active'
          ? 'active'
          : (sub.payment_status ?? 'pending_payment_method'),
    weeklyPaymentCents:
      schedule?.cadence === 'weekly'
        ? Number(schedule.amount_cents)
        : (sub.weekly_payment_cents ?? null),
    remainingBalance: sub.remaining_balance ?? null,
    fullTuitionAmount: sub.full_tuition_amount ?? null,
    amountPaidAtCheckout: sub.amount_paid_at_checkout ?? null,
    nextPaymentDate: schedule?.next_invoice_date ?? sub.next_payment_date ?? null,
    fullyPaid: sub.fully_paid ?? false,
    setupFeePaid: sub.setup_fee_paid ?? false,
    hasSubscription,
  };
}

function BillingFallback({ portalPath, message }: { portalPath: string; message: string }) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link
        href={portalPath}
        className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h1 className="font-bold text-slate-950">Billing account needs review</h1>
            <p className="mt-1 text-sm text-slate-700">{message}</p>
          </div>
        </div>
      </div>
      <StudentPaymentCard />
    </div>
  );
}

function InvoiceLedger({ invoices }: { invoices: ApprenticeDashboardInvoice[] }) {
  const openStatuses = new Set(['draft', 'open', 'past_due', 'unpaid', 'pending']);
  const open = invoices.filter((invoice) => openStatuses.has(invoice.status.toLowerCase()));
  if (!invoices.length) return null;
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 p-5">
        <h2 className="font-bold text-slate-950">Invoices due</h2>
        <p className="mt-1 text-sm text-slate-600">
          Every QuickBooks invoice and Pay Now link assigned to your account.
        </p>
      </div>
      {open.length ? (
        <div className="divide-y divide-slate-100">
          {open.map((invoice) => (
            <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-bold text-slate-950">
                  Invoice {invoice.invoiceNumber || invoice.id.slice(0, 8)}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Due {invoice.dueDate || 'now'} · {invoice.status.replace(/_/g, ' ')}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-black text-slate-950">
                  ${(invoice.amountCents / 100).toFixed(2)}
                </span>
                {invoice.paymentUrl ? (
                  <a
                    href={invoice.paymentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-bold text-white"
                  >
                    Pay now
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="p-5 text-sm font-semibold text-emerald-700">No open invoices.</p>
      )}
      {open.length ? (
        <div className="m-5 rounded-lg border-2 border-red-300 bg-red-50 p-4 text-sm text-red-900">
          <strong>Account access warning:</strong> If an invoice remains unpaid after its due date,
          your course account will be suspended, active sessions will be signed out, and you will
          not be able to sign in again until every past-due invoice is paid.
        </div>
      ) : null}
    </section>
  );
}

function SubscriptionBilling({
  billing,
  portalPath,
  needsBillingAgreement,
  billingApprovalUrl,
  previewing,
  invoices,
}: {
  billing: BillingSummary;
  portalPath: string;
  needsBillingAgreement: boolean;
  billingApprovalUrl?: string | null;
  previewing: boolean;
  invoices: ApprenticeDashboardInvoice[];
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link
        href={portalPath}
        className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      {needsBillingAgreement ? (
        <div className="flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div className="text-sm text-red-800">
            <p className="mb-1 font-semibold">PayPal approval required</p>
            <p>
              Complete the recurring-payment release and approve the PayPal billing agreement to
              keep the tuition account current.
            </p>
            {billingApprovalUrl ? (
              <a
                href={billingApprovalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex rounded-lg bg-[#0070ba] px-4 py-2 font-bold text-white"
              >
                Approve PayPal billing
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      <BillingCard billing={billing} readOnly={previewing} />
      <section className="rounded-xl border border-indigo-200 bg-indigo-50 p-5">
        <h2 className="font-black text-slate-950">Affirm financing</h2>
        <p className="mt-1 text-sm leading-6 text-slate-700">If Affirm is offered on your QuickBooks invoice, select Affirm from the invoice payment screen to check eligibility and apply. Approval, available plans, and terms are determined by Affirm. Checking the invoice does not change the amount you owe Elevate.</p>
        {invoices.some((invoice) => invoice.paymentUrl) ? (
          <a href={invoices.find((invoice) => invoice.paymentUrl)?.paymentUrl || '#'} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-indigo-700 px-5 py-3 text-sm font-black text-white">Open invoice & check Affirm eligibility</a>
        ) : (
          <p className="mt-3 text-xs font-semibold text-slate-600">Your invoice payment link will appear here after QuickBooks synchronization.</p>
        )}
      </section>
      <InvoiceLedger invoices={invoices} />
    </div>
  );
}

export default async function ApprenticeBillingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const db = await requireAdminClient();
  const subject = await resolvePortalPreviewSubject(db, user?.id);
  if (!subject.userId) redirect('/login?redirect=/apprentice/billing');
  const billingAccess = await getApprenticeBillingAccess(db, subject.userId);
  const programSlug = await resolveApprenticeProgramSlug(db, subject.userId);
  const portalPath =
    (programSlug && APPRENTICE_PORTAL_CONFIGS[programSlug]?.portalPath) || '/apprentice';
  const { data: billingAuthorization } = await db
    .from('billing_migration_authorizations')
    .select('billing_schedule_id')
    .eq('user_id', subject.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data: automaticSchedule } = billingAuthorization?.billing_schedule_id
    ? await db
        .from('billing_schedules')
        .select(
          'amount_cents,cadence,next_invoice_date,status,provider_status,provider_subscription_id,provider_approval_url',
        )
        .eq('id', billingAuthorization.billing_schedule_id)
        .maybeSingle()
    : { data: null };
  const schedule = automaticSchedule as ScheduleRow | null;

  if (programSlug === 'barber-apprenticeship') {
    const { data } = await db
      .from('barber_subscriptions')
      .select(
        'payment_status,weekly_payment_cents,remaining_balance,full_tuition_amount,amount_paid_at_checkout,next_payment_date,fully_paid,setup_fee_paid',
      )
      .eq('user_id', subject.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sub = data as SubscriptionRow | null;
    if (!sub && !schedule)
      return (
        <BillingFallback
          portalPath={portalPath}
          message="No barber tuition account was found. Contact support if you recently enrolled."
        />
      );
    const billing = summary('barber', sub || {}, schedule);
    return (
      <SubscriptionBilling
        billing={billing}
        portalPath={portalPath}
        needsBillingAgreement={!billing.fullyPaid && !billing.hasSubscription}
        billingApprovalUrl={schedule?.provider_approval_url}
        previewing={subject.previewing}
        invoices={billingAccess.invoices}
      />
    );
  }

  if (programSlug === 'cosmetology-apprenticeship') {
    const { data } = await db
      .from('cosmetology_subscriptions')
      .select(
        'payment_status,weekly_payment_cents,remaining_balance,full_tuition_amount,amount_paid_at_checkout,next_payment_date,fully_paid,setup_fee_paid',
      )
      .eq('user_id', subject.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    const sub = data as SubscriptionRow | null;
    if (sub || schedule) {
      const billing = summary('cosmetology', sub || {}, schedule);
      return (
        <SubscriptionBilling
          billing={billing}
          portalPath={portalPath}
          needsBillingAgreement={!billing.fullyPaid && !billing.hasSubscription}
          billingApprovalUrl={schedule?.provider_approval_url}
          previewing={subject.previewing}
          invoices={billingAccess.invoices}
        />
      );
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <Link
        href={portalPath}
        className="inline-flex items-center gap-2 text-sm text-slate-700 hover:text-slate-950"
      >
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>
      <StudentPaymentCard />
    </div>
  );
}

function StudentPaymentCard() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-200 p-5">
        <CreditCard className="h-5 w-5 text-brand-blue-600" />
        <h2 className="font-semibold text-slate-950">Payment & Billing</h2>
      </div>
      <div className="space-y-3 p-5">
        <p className="text-sm text-slate-700">
          Manage the recurring-payment release, PayPal agreement, and payment history.
        </p>
        <Link
          href="/lms/documents"
          className="flex items-center justify-between rounded-lg bg-brand-blue-50 p-4 hover:bg-brand-blue-100"
        >
          <span className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-brand-blue-700" />
            <span>
              <span className="block font-medium text-slate-950">PayPal billing agreement</span>
              <span className="text-xs text-slate-600">
                Complete the signed release and provider approval steps
              </span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
        <Link
          href="/billing"
          className="flex items-center justify-between rounded-lg bg-slate-50 p-4 hover:bg-slate-100"
        >
          <span className="flex items-center gap-3">
            <DollarSign className="h-5 w-5" />
            <span>
              <span className="block font-medium text-slate-950">Payment History</span>
              <span className="text-xs text-slate-600">View payments and receipts</span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
        <Link
          href="/lms/documents"
          className="flex items-center justify-between rounded-lg bg-brand-blue-50 p-4 hover:bg-brand-blue-100"
        >
          <span className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-brand-blue-700" />
            <span>
              <span className="block font-medium text-slate-950">Billing documents</span>
              <span className="text-xs text-slate-600">
                Review authorization status and required action
              </span>
            </span>
          </span>
          <ChevronRight className="h-5 w-5 text-slate-400" />
        </Link>
      </div>
    </div>
  );
}
