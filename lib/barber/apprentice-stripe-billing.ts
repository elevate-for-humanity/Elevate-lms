import type Stripe from 'stripe';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getBillingCycleAnchor } from '@/lib/programs/pricing';
import { PRICES } from '@/lib/stripe/prices';
import { logger } from '@/lib/logger';
import { BARBER_PROGRAM_ID } from '@/lib/barber/pricing';

/** Live barber apprentice Stripe customers (repi account). */
export const BARBER_APPRENTICE_STRIPE_CUSTOMERS = {
  cus_UGFxoJKjtlNoy8: {
    name: 'Jordan White',
    email: 'jbwhite888@icloud.com',
    enrollmentId: '47e75da9-2903-4b9a-ba3b-fc23f00ec1a5',
    weeklyRateCents: 7641,
    startDate: '2026-04-17',
    downPaymentCents: 200_000,
    paymentTermWeeks: 29,
  },
  cus_UTVa6pmsYlWBsp: {
    name: 'Natalia Roa',
    email: 'natataroa@gmail.com',
    enrollmentId: '6ad966f1-f8fd-457f-9f5e-5391072f9f29',
    weeklyRateCents: 15103,
    startDate: '2026-05-12',
    downPaymentCents: 60_000,
    paymentTermWeeks: 29,
  },
  cus_UG4BIa05facQez: {
    name: 'Mercedes Wellington',
    email: 'msanqin@gmail.com',
    enrollmentId: '0320f78d-40df-4fb4-b5b9-3bed858e975b',
    weeklyRateCents: 15103,
    startDate: '2026-05-18',
    downPaymentCents: 60_000,
    paymentTermWeeks: 29,
  },
} as const;

export type ApprenticeBillingAction =
  | 'ensure_subscription'
  | 'pay_open_invoices'
  | 'record_cash_payment';

/** Stripe autopay — Jordan + Natalia */
export const BARBER_STRIPE_WEEKLY_CUSTOMERS = ['cus_UGFxoJKjtlNoy8', 'cus_UTVa6pmsYlWBsp'] as const;

/** Cash weekly — Mercedes pays in person */
export const BARBER_CASH_WEEKLY_CUSTOMER = 'cus_UG4BIa05facQez' as const;

export interface ApprenticeBillingResult {
  customerId: string;
  name: string;
  action: ApprenticeBillingAction;
  ok: boolean;
  detail: string;
  subscriptionId?: string;
  invoiceId?: string;
}

export interface RunApprenticeBillingOptions {
  /** Defaults to Jordan, Natalia, and Mercedes. */
  customerIds?: string[];
  actions?: ApprenticeBillingAction[];
}

function resolveCustomerIds(customerIds?: string[]): string[] {
  const allowed = Object.keys(BARBER_APPRENTICE_STRIPE_CUSTOMERS);
  const requested = customerIds?.length
    ? customerIds
    : ['cus_UGFxoJKjtlNoy8', 'cus_UTVa6pmsYlWBsp', 'cus_UG4BIa05facQez'];
  const invalid = requested.filter((id) => !allowed.includes(id));
  if (invalid.length) {
    throw new Error(`Unknown customer id(s): ${invalid.join(', ')}`);
  }
  return requested;
}

async function getDefaultPaymentMethodId(
  stripe: Stripe,
  customerId: string,
): Promise<string | null> {
  const customer = await stripe.customers.retrieve(customerId);
  if ('deleted' in customer && customer.deleted) return null;
  const activeCustomer = customer as Stripe.Customer;
  const fromSettings = activeCustomer.invoice_settings?.default_payment_method;
  if (typeof fromSettings === 'string') return fromSettings;
  if (fromSettings && typeof fromSettings === 'object' && 'id' in fromSettings) {
    return fromSettings.id;
  }
  const pms = await stripe.paymentMethods.list({ customer: customerId, type: 'card', limit: 1 });
  return pms.data[0]?.id ?? null;
}

async function ensureWeeklySubscription(
  stripe: Stripe,
  customerId: string,
): Promise<ApprenticeBillingResult> {
  const meta =
    BARBER_APPRENTICE_STRIPE_CUSTOMERS[
      customerId as keyof typeof BARBER_APPRENTICE_STRIPE_CUSTOMERS
    ];
  const name = meta.name;

  const subs = await stripe.subscriptions.list({ customer: customerId, status: 'all', limit: 20 });
  const active = subs.data.find((s) => s.status === 'active' || s.status === 'trialing');
  if (active) {
    return {
      customerId,
      name,
      action: 'ensure_subscription',
      ok: true,
      detail: `Already has ${active.status} subscription`,
      subscriptionId: active.id,
    };
  }

  const pmId = await getDefaultPaymentMethodId(stripe, customerId);
  if (!pmId) {
    return {
      customerId,
      name,
      action: 'ensure_subscription',
      ok: false,
      detail: 'No default card on customer — add payment method in Stripe Dashboard',
    };
  }

  await stripe.paymentMethods.attach(pmId, { customer: customerId }).catch(() => {});
  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: pmId },
  });

  const weeklyPriceId = PRICES.BARBER_WEEKLY;
  let priceId = weeklyPriceId;

  if (!priceId) {
    const created = await stripe.prices.create({
      currency: 'usd',
      unit_amount: meta.weeklyRateCents,
      recurring: { interval: 'week', interval_count: 1 },
      product_data: { name: 'Barber Apprenticeship — Weekly Tuition' },
    });
    priceId = created.id;
  }

  const billingAnchor = getBillingCycleAnchor();
  const cancelAt = billingAnchor + meta.paymentTermWeeks * 7 * 24 * 60 * 60;

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    default_payment_method: pmId,
    items: [{ price: priceId }],
    billing_cycle_anchor: billingAnchor,
    proration_behavior: 'none',
    metadata: {
      program: 'barber-apprenticeship',
      program_holder: 'Elevate Prestige Barber and Beauty Institute',
      enrollment_id: meta.enrollmentId,
      apprentice_name: meta.name,
    },
    cancel_at: cancelAt,
  });

  const db = await requireAdminClient();
  await db
    .from('barber_subscriptions')
    .update({
      stripe_subscription_id: subscription.id,
      stripe_customer_id: customerId,
      weekly_payment_cents: meta.weeklyRateCents,
      payment_status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_customer_id', customerId)
    .then(
      () => {},
      (err) => {
        logger.warn('[apprentice-billing] barber_subscriptions update failed (non-fatal)', err);
      },
    );

  return {
    customerId,
    name,
    action: 'ensure_subscription',
    ok: true,
    detail: `Created subscription ${subscription.id}`,
    subscriptionId: subscription.id,
  };
}

async function payOpenInvoices(
  stripe: Stripe,
  customerId: string,
): Promise<ApprenticeBillingResult> {
  const meta =
    BARBER_APPRENTICE_STRIPE_CUSTOMERS[
      customerId as keyof typeof BARBER_APPRENTICE_STRIPE_CUSTOMERS
    ];
  const name = meta.name;

  const open = await stripe.invoices.list({
    customer: customerId,
    status: 'open',
    limit: 10,
  });

  if (!open.data.length) {
    const draft = await stripe.invoices.list({
      customer: customerId,
      status: 'draft',
      limit: 5,
    });
    if (!draft.data.length) {
      return {
        customerId,
        name,
        action: 'pay_open_invoices',
        ok: true,
        detail: 'No open or draft invoices',
      };
    }
    const finalized: string[] = [];
    for (const inv of draft.data) {
      const fin = await stripe.invoices.finalizeInvoice(inv.id);
      finalized.push(fin.id);
    }
    open.data.push(
      ...(await stripe.invoices.list({ customer: customerId, status: 'open', limit: 10 })).data,
    );
    if (!open.data.length) {
      return {
        customerId,
        name,
        action: 'pay_open_invoices',
        ok: true,
        detail: `Finalized ${finalized.length} draft invoice(s); none left open`,
      };
    }
  }

  const paid: string[] = [];
  const errors: string[] = [];

  for (const inv of open.data) {
    try {
      const paidInv = await stripe.invoices.pay(inv.id);
      paid.push(paidInv.id);
    } catch (err) {
      errors.push(`${inv.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return {
    customerId,
    name,
    action: 'pay_open_invoices',
    ok: errors.length === 0,
    detail: errors.length
      ? `Paid ${paid.length}; failed: ${errors.join('; ')}`
      : `Paid ${paid.length} invoice(s)`,
    invoiceId: paid[0],
  };
}

function fridayWeekKey(date = new Date()): string {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = (day + 2) % 7;
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** Record an in-person cash weekly payment (dashboard + admin revenue). Idempotent per week. */
export async function recordApprenticeCashPayment(
  customerId: string,
  options?: { amountCents?: number; weekKey?: string; note?: string },
): Promise<ApprenticeBillingResult> {
  const meta =
    BARBER_APPRENTICE_STRIPE_CUSTOMERS[
      customerId as keyof typeof BARBER_APPRENTICE_STRIPE_CUSTOMERS
    ];
  if (!meta) {
    return {
      customerId,
      name: customerId,
      action: 'record_cash_payment',
      ok: false,
      detail: 'Unknown customer id',
    };
  }

  const amountCents = options?.amountCents ?? meta.weeklyRateCents;
  const weekKey = options?.weekKey ?? fridayWeekKey();
  const cashInvoiceId = `cash_${customerId}_${weekKey}`;
  const db = await requireAdminClient();

  const { data: sub, error: subErr } = await db
    .from('barber_subscriptions')
    .select(
      'id, user_id, enrollment_id, weeks_remaining, remaining_balance, payment_status, failed_payment_at',
    )
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (subErr || !sub) {
    return {
      customerId,
      name: meta.name,
      action: 'record_cash_payment',
      ok: false,
      detail: subErr?.message ?? 'barber_subscriptions row not found',
    };
  }

  const { data: existingCash } = await db
    .from('barber_payments')
    .select('id')
    .eq('stripe_invoice_id', cashInvoiceId)
    .maybeSingle();

  if (existingCash) {
    return {
      customerId,
      name: meta.name,
      action: 'record_cash_payment',
      ok: true,
      detail: `Already recorded cash for week ${weekKey}`,
      invoiceId: cashInvoiceId,
    };
  }

  const amountDollars = amountCents / 100;
  const now = new Date().toISOString();
  const weeksBefore = sub.weeks_remaining ?? null;
  const weeksAfter = weeksBefore != null && weeksBefore > 0 ? weeksBefore - 1 : weeksBefore;
  const remainingBalance =
    sub.remaining_balance != null
      ? Math.max(0, Number(sub.remaining_balance) - amountDollars)
      : null;

  const { error: payErr } = await db.from('barber_payments').insert({
    user_id: sub.user_id,
    stripe_subscription_id: null,
    stripe_invoice_id: cashInvoiceId,
    amount_paid: amountDollars,
    amount: amountDollars,
    status: 'paid',
    payment_date: now,
    description: options?.note ?? `Weekly tuition (cash) — week of ${weekKey}`,
  });

  if (payErr) {
    return {
      customerId,
      name: meta.name,
      action: 'record_cash_payment',
      ok: false,
      detail: payErr.message,
    };
  }

  await db
    .from('billing_events')
    .insert({
      barber_subscription_id: sub.id,
      user_id: sub.user_id,
      event_type: 'charge_succeeded',
      amount_cents: amountCents,
      stripe_invoice_id: cashInvoiceId,
      weeks_remaining_before: weeksBefore,
      weeks_remaining_after: weeksAfter,
      metadata: {
        payment_method: 'cash',
        week_key: weekKey,
        recorded_by: 'recordApprenticeCashPayment',
        note: options?.note ?? null,
      },
    })
    .then(
      () => {},
      (err) => {
        logger.warn('[apprentice-billing] billing_events insert failed (non-fatal)', err);
      },
    );

  if (sub.user_id) {
    await db
      .from('payment_transactions')
      .insert({
        program_id: BARBER_PROGRAM_ID,
        user_id: sub.user_id,
        enrollment_id: sub.enrollment_id ?? meta.enrollmentId,
        amount: amountDollars,
        currency: 'usd',
        status: 'completed',
        payment_method: 'cash',
        description: `Barber weekly tuition (cash) — ${meta.name} — week of ${weekKey}`,
        metadata: { cash_invoice_id: cashInvoiceId, customer_id: customerId },
      })
      .then(
        () => {},
        (err) => {
          logger.warn('[apprentice-billing] payment_transactions insert failed (non-fatal)', err);
        },
      );
  }

  const subPatch: Record<string, unknown> = {
    payment_status: 'active',
    payment_method: 'cash',
    last_payment_date: now,
    failed_payment_at: null,
    suspension_deadline: null,
    suspended_at: null,
    suspension_reason: null,
    updated_at: now,
  };
  if (weeksAfter != null) subPatch.weeks_remaining = weeksAfter;
  if (remainingBalance != null) subPatch.remaining_balance = remainingBalance;
  if (weeksAfter === 0) {
    subPatch.fully_paid = true;
    subPatch.payment_status = 'paid_in_full';
  }

  await db.from('barber_subscriptions').update(subPatch).eq('id', sub.id);

  if (sub.enrollment_id) {
    await db
      .from('program_enrollments')
      .update({
        payment_status: 'active',
        updated_at: now,
      })
      .eq('id', sub.enrollment_id)
      .then(
        () => {},
        () => {},
      );
  }

  return {
    customerId,
    name: meta.name,
    action: 'record_cash_payment',
    ok: true,
    detail: `Recorded $${amountDollars.toFixed(2)} cash for week ${weekKey}`,
    invoiceId: cashInvoiceId,
  };
}

export async function runApprenticeStripeBilling(
  stripe: Stripe,
  options: RunApprenticeBillingOptions = {},
): Promise<ApprenticeBillingResult[]> {
  const customerIds = resolveCustomerIds(options.customerIds);
  const actions = options.actions ?? ['ensure_subscription', 'pay_open_invoices'];
  const results: ApprenticeBillingResult[] = [];

  for (const customerId of customerIds) {
    if (actions.includes('ensure_subscription')) {
      results.push(await ensureWeeklySubscription(stripe, customerId));
    }
    if (actions.includes('pay_open_invoices')) {
      results.push(await payOpenInvoices(stripe, customerId));
    }
  }

  return results;
}

/** Jordan + Natalia (Stripe) and Mercedes (cash) — canonical weekly ops run. */
export async function runWeeklyApprenticePayments(
  stripe: Stripe,
): Promise<ApprenticeBillingResult[]> {
  const stripeResults = await runApprenticeStripeBilling(stripe, {
    customerIds: [...BARBER_STRIPE_WEEKLY_CUSTOMERS],
    actions: ['ensure_subscription', 'pay_open_invoices'],
  });
  const cashResult = await recordApprenticeCashPayment(BARBER_CASH_WEEKLY_CUSTOMER);
  return [...stripeResults, cashResult];
}
