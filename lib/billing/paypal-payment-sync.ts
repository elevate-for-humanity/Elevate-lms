import { hasVerifiedRecurringRelease } from './recurring-release';
import { getPayPalSubscription, listPayPalSubscriptionTransactions } from './providers/paypal-subscriptions';
import 'server-only';

import {
  billingWeekEnd,
  billingWeekStart,
  findInvoiceForScheduleWeek,
  nextWeeklyInvoiceDateAfter,
  PAYABLE_INVOICE_STATUSES,
  type ScheduleWeekInvoice,
} from './apprentice-invoice-batch';
import { createQuickBooksBillingProvider, recordQuickBooksExternalPayment } from './providers/quickbooks';
import { nextInvoiceDate, type BillingCadence } from './schedule';

type Database = any;

export interface PayPalSubscriptionPayment {
  paymentId: string;
  subscriptionId: string;
  paidAt: string;
  amountCents: number;
  currency: string;
}

export function normalizePayPalSubscriptionStatus(status: string):
  | 'approval_pending'
  | 'active'
  | 'suspended'
  | 'canceled'
  | 'expired'
  | 'failed' {
  const value = status.toUpperCase();
  if (value === 'ACTIVE') return 'active';
  if (value === 'SUSPENDED') return 'suspended';
  if (value === 'CANCELLED' || value === 'CANCELED') return 'canceled';
  if (value === 'EXPIRED') return 'expired';
  if (value === 'APPROVAL_PENDING' || value === 'APPROVED') return 'approval_pending';
  return 'failed';
}

export async function syncPayPalSubscriptionState(
  db: Database,
  input: { subscriptionId: string; status: string },
): Promise<{ scheduleId: string; status: string; activated: boolean } | null> {
  const scheduleResult = await db
    .from('billing_schedules')
    .select('*')
    .eq('collection_provider', 'paypal')
    .eq('provider_subscription_id', input.subscriptionId)
    .maybeSingle();
  if (scheduleResult.error) throw new Error(scheduleResult.error.message);
  if (!scheduleResult.data) return null;

  // Provider state is authoritative when events arrive out of order.
  const actual = await getPayPalSubscription(input.subscriptionId);
  const providerStatus = normalizePayPalSubscriptionStatus(actual.status);

  const canActivate = providerStatus === 'active' && await hasVerifiedRecurringRelease(db, scheduleResult.data);
  const terminal = ['canceled', 'expired'].includes(providerStatus);
  const update = await db
    .from('billing_schedules')
    .update({
      provider_status: providerStatus,
      status: canActivate ? 'active' : terminal ? 'canceled' : 'paused',
      activated_at: canActivate ? new Date().toISOString() : null,
      last_provider_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleResult.data.id);
  if (update.error) throw new Error(update.error.message);
  return { scheduleId: scheduleResult.data.id, status: providerStatus, activated: canActivate };
}

export async function syncPayPalPaymentToQuickBooks(
  db: Database,
  payment: PayPalSubscriptionPayment,
): Promise<{
  scheduleId: string;
  alreadyProcessed: boolean;
  /** Set when the payment was applied to the week's existing invoice. */
  appliedToInvoiceId?: string;
  /** Set when the week's invoice was already paid and no new invoice was created. */
  duplicateSkipped?: boolean;
}> {
  const existing = await db
    .from('billing_invoices')
    .select('billing_schedule_id,status')
    .eq('collection_provider', 'paypal')
    .eq('provider_payment_id', payment.paymentId)
    .maybeSingle();
  if (existing.error) throw new Error(existing.error.message);
  if (existing.data?.status === 'paid' && existing.data.billing_schedule_id) {
    return { scheduleId: existing.data.billing_schedule_id, alreadyProcessed: true };
  }

  const scheduleResult = await db
    .from('billing_schedules')
    .select('*')
    .eq('collection_provider', 'paypal')
    .eq('provider_subscription_id', payment.subscriptionId)
    .maybeSingle();
  if (scheduleResult.error || !scheduleResult.data) {
    throw new Error(scheduleResult.error?.message || 'PayPal subscription is not linked to a billing schedule.');
  }
  const schedule = scheduleResult.data;
  if (payment.currency.toUpperCase() !== 'USD') {
    throw new Error(`Unsupported PayPal payment currency: ${payment.currency}.`);
  }
  if (Number(schedule.amount_cents) !== payment.amountCents) {
    throw new Error(
      `PayPal payment amount ${payment.amountCents} does not match schedule amount ${schedule.amount_cents}.`,
    );
  }

  // Reconcile is the single writer. A payment for a week that already has an
  // invoice is applied to that invoice instead of creating a second invoice
  // for the same week — the two writers previously used different
  // idempotency keys (`apprentice-fallback:` vs `paypal:`) and could not see
  // each other's invoices, which is how students were charged twice.
  const weekStart = billingWeekStart(new Date(payment.paidAt));
  const target = await resolvePayPalPaymentTarget(db, schedule, payment);
  if (target.action === 'skip-duplicate') {
    // The week's invoice is already paid (e.g. the student paid the fallback
    // invoice by hand and PayPal also collected). Creating another invoice
    // would charge a third time. The second payment is not in QuickBooks, so
    // it must be accounted for as a human refund review — an idempotent
    // provider-event record keyed by the PayPal payment ID — instead of being
    // silently acknowledged by the webhook or only logged by reconcile.
    await recordDuplicatePaymentForRefundReview(db, {
      scheduleId: schedule.id,
      payment,
      weekStart,
      invoice: target.invoice,
    });
    return { scheduleId: schedule.id, alreadyProcessed: true, duplicateSkipped: true };
  }
  if (target.action === 'apply') {
    await recordQuickBooksExternalPayment(db, {
      idempotencyKey: `paypal:${payment.paymentId}`,
      billingInvoiceId: target.invoice.id,
      billingScheduleId: schedule.id,
      collectionProvider: 'paypal',
      providerPaymentId: payment.paymentId,
      paidAt: payment.paidAt,
    });
    await advanceScheduleAfterPayment(db, schedule, weekStart);
    return { scheduleId: schedule.id, alreadyProcessed: false, appliedToInvoiceId: target.invoice.id };
  }

  const idempotencyKey = `paypal:${payment.paymentId}`;
  await createQuickBooksBillingProvider(db).createManualInvoice({
    idempotencyKey,
    billingScheduleId: schedule.id,
    customer: {
      externalKey: schedule.customer_external_key,
      displayName: schedule.customer_name,
      email: schedule.customer_email,
    },
    lines: [
      {
        canonicalKey: schedule.canonical_product_key,
        name: schedule.product_name,
        description: schedule.product_description || undefined,
        quantity: 1,
        unitAmountCents: payment.amountCents,
      },
    ],
    dueDate: payment.paidAt.slice(0, 10),
    memo: `PayPal automatic tuition payment ${payment.paymentId}`,
    fulfillment: schedule.fulfillment_type
      ? { type: schedule.fulfillment_type, payload: schedule.fulfillment_payload || {} }
      : undefined,
  });
  await recordQuickBooksExternalPayment(db, {
    idempotencyKey,
    billingScheduleId: schedule.id,
    collectionProvider: 'paypal',
    providerPaymentId: payment.paymentId,
    paidAt: payment.paidAt,
  });

  const remaining =
    schedule.remaining_invoices == null ? null : Math.max(0, schedule.remaining_invoices - 1);
  const completed = remaining === 0;
  const advanced = await db
    .from('billing_schedules')
    .update({
      remaining_invoices: remaining,
      status: completed ? 'completed' : 'active',
      next_invoice_date: completed
        ? schedule.next_invoice_date
        : nextInvoiceDate(schedule.next_invoice_date, schedule.cadence as BillingCadence),
      last_provider_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', schedule.id)
    .eq('next_invoice_date', schedule.next_invoice_date);
  if (advanced.error) throw new Error(advanced.error.message);
  return { scheduleId: schedule.id, alreadyProcessed: false };
}

/**
 * Persist a durable, idempotent refund-review record for a PayPal payment
 * that has no unposted invoice target because the week's invoice is already
 * paid. Without it the second collection leaves no trace in QuickBooks: the
 * PayPal webhook acknowledges the event as handled and reconcile only logs
 * the duplicate. Keyed by PayPal payment ID so webhook retries and
 * reconcile reruns record it exactly once (unique (provider,
 * provider_event_id) on billing_provider_events). Status 'processing' means
 * open — a human refund review is still owed.
 */
export async function recordDuplicatePaymentForRefundReview(
  db: Database,
  input: {
    scheduleId: string;
    payment: PayPalSubscriptionPayment;
    weekStart: string;
    invoice: ScheduleWeekInvoice;
  },
): Promise<void> {
  const inserted = await db
    .from('billing_provider_events')
    .insert({
      provider: 'paypal',
      provider_event_id: `paypal-refund-review:${input.payment.paymentId}`,
      event_type: 'payment.duplicate',
      resource_id: input.payment.paymentId,
      status: 'processing',
      payload: {
        billingScheduleId: input.scheduleId,
        paymentId: input.payment.paymentId,
        amountCents: input.payment.amountCents,
        paidAt: input.payment.paidAt,
        weekStart: input.weekStart,
        invoiceId: input.invoice.id,
        invoiceNumber: input.invoice.invoice_number,
      },
    })
    .select('id')
    .single();
  if (!inserted.error) return;
  if (inserted.error.code === '23505') return; // Already recorded for this payment.
  throw new Error(
    `Could not record duplicate PayPal payment for refund review: ${inserted.error.message}`,
  );
}

export type PayPalPaymentTarget =
  | { action: 'apply'; invoice: ScheduleWeekInvoice }
  | { action: 'skip-duplicate'; invoice: ScheduleWeekInvoice }
  | { action: 'create' };

/**
 * Decide how a PayPal payment for one billing week is written to QuickBooks.
 * Pure decision step (one local lookup), exported so the duplicate cases are
 * unit-testable without QuickBooks or PayPal calls.
 */
export async function resolvePayPalPaymentTarget(
  db: Database,
  schedule: { id: string; amount_cents: number },
  payment: PayPalSubscriptionPayment,
): Promise<PayPalPaymentTarget> {
  const weekStart = billingWeekStart(new Date(payment.paidAt));
  const existingInvoice = await findInvoiceForScheduleWeek(db, {
    scheduleId: schedule.id,
    amountCents: payment.amountCents,
    weekStart,
  });
  if (!existingInvoice) return { action: 'create' };
  if (existingInvoice.status === 'paid') {
    return { action: 'skip-duplicate', invoice: existingInvoice };
  }
  if (
    (PAYABLE_INVOICE_STATUSES as readonly string[]).includes(existingInvoice.status) &&
    existingInvoice.provider_invoice_id
  ) {
    return { action: 'apply', invoice: existingInvoice };
  }
  // An invoice exists for the week but it can neither take a payment (still
  // being created) nor be treated as settled. Defer: the next reconcile run
  // retries instead of creating a second invoice for the same week.
  throw new Error(
    `PayPal payment ${payment.paymentId} matches invoice ${existingInvoice.id} for week ${weekStart}, but that invoice is ${existingInvoice.status} and cannot take the payment yet.`,
  );
}

/**
 * Whether a schedule has already been advanced past the given billing week.
 * The schedule's next invoice date keeps its enrollment anchor weekday
 * (weekly cadence adds 7 days), so it is usually NOT a Monday: comparing it
 * with the week's Monday wrongly reports "already advanced" for any
 * Tuesday–Sunday anchor, and that week's installment is then never consumed
 * — remaining_invoices never decrements and the schedule stalls. A schedule
 * is past the week only when its next invoice date falls after the week's
 * Sunday.
 */
export function scheduleAdvancedPastWeek(
  nextInvoiceDate: string | null | undefined,
  weekStart: string,
): boolean {
  return String(nextInvoiceDate || '') > billingWeekEnd(weekStart);
}

/**
 * Advance a schedule after its weekly payment was applied to an invoice the
 * fallback writer already created. The fallback already consumed this week's
 * schedule slot (remaining count and next invoice date) when it created the
 * invoice, so advancing again would skip a week and double-count the
 * payment. Only advance when the schedule has not already been advanced past
 * the payment's week (e.g. the fallback's advance failed earlier).
 */
async function advanceScheduleAfterPayment(
  db: Database,
  schedule: any,
  weekStart: string,
): Promise<void> {
  const alreadyAdvanced = scheduleAdvancedPastWeek(schedule.next_invoice_date, weekStart);
  if (alreadyAdvanced) {
    const touched = await db
      .from('billing_schedules')
      .update({
        last_provider_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule.id);
    if (touched.error) throw new Error(touched.error.message);
    return;
  }
  const remaining =
    schedule.remaining_invoices == null ? null : Math.max(0, schedule.remaining_invoices - 1);
  const completed = remaining === 0;
  const advanced = await db
    .from('billing_schedules')
    .update({
      remaining_invoices: remaining,
      status: completed ? 'completed' : 'active',
      next_invoice_date: completed
        ? schedule.next_invoice_date
        : nextWeeklyInvoiceDateAfter(schedule.next_invoice_date, weekStart),
      last_provider_sync_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', schedule.id)
    .eq('next_invoice_date', schedule.next_invoice_date);
  if (advanced.error) throw new Error(advanced.error.message);
}

/**
 * Defense-in-depth for the fallback writer: has PayPal already collected this
 * schedule's payment for the given billing week? The fallback route calls this
 * before creating an invoice; a completed matching payment means the week is
 * already paid and no fallback invoice may be created for it.
 */
export async function hasCompletedPayPalPaymentForWeek(
  subscriptionId: string,
  amountCents: number,
  weekStart: string,
): Promise<boolean> {
  const start = `${weekStart}T00:00:00.000Z`;
  const end = new Date().toISOString();
  const result = await listPayPalSubscriptionTransactions(subscriptionId, start, end);
  return (result.transactions || []).some((transaction) => {
    const gross = transaction.amount_with_breakdown?.gross_amount;
    return (
      transaction.status === 'COMPLETED' &&
      gross?.currency_code?.toUpperCase() === 'USD' &&
      Math.round(Number(gross?.value || 0) * 100) === amountCents
    );
  });
}
