import 'server-only';

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
  const providerStatus = normalizePayPalSubscriptionStatus(input.status);
  const scheduleResult = await db
    .from('billing_schedules')
    .select('id,status')
    .eq('collection_provider', 'paypal')
    .eq('provider_subscription_id', input.subscriptionId)
    .maybeSingle();
  if (scheduleResult.error) throw new Error(scheduleResult.error.message);
  if (!scheduleResult.data) return null;

  const authorization = await db
    .from('billing_migration_authorizations')
    .select('id,status')
    .eq('billing_schedule_id', scheduleResult.data.id)
    .eq('authorization_scope', 'recurring_tuition')
    .eq('status', 'approved')
    .maybeSingle();
  if (authorization.error) throw new Error(authorization.error.message);
  const canActivate = providerStatus === 'active' && Boolean(authorization.data);
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
): Promise<{ scheduleId: string; alreadyProcessed: boolean }> {
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

  const idempotencyKey = `paypal:${payment.paymentId}`;
  await createQuickBooksBillingProvider(db).createManualInvoice({
    idempotencyKey,
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
