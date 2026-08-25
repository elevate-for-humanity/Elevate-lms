import type Stripe from 'stripe';
import type { SupabaseClient } from '@/lib/supabase';
import {
  syncIndividualAppLifecycle,
  syncPlatformSubscriptionLifecycle,
} from '@/lib/platform/subscription-lifecycle';
import { syncHostShopSubscriptionLifecycle } from '@/lib/platform/orchestration/host-shop-subscription';
import {
  COURSE_BUILDER_APP_SLUG,
  COURSE_BUILDER_MONTHLY_ALLOWANCE,
} from '@/lib/course-builder/credits';

function directSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = invoice as unknown as {
    subscription?: string | { id?: string } | null;
    parent?: {
      subscription_details?: {
        subscription?: string | { id?: string } | null;
      } | null;
    } | null;
  };
  const subscription = raw.subscription ?? raw.parent?.subscription_details?.subscription ?? null;
  if (!subscription) return null;
  return typeof subscription === 'string' ? subscription : (subscription.id ?? null);
}

function invoiceCustomerId(invoice: Stripe.Invoice): string | null {
  const customer = invoice.customer;
  if (!customer) return null;
  return typeof customer === 'string' ? customer : customer.id;
}

function recognizedSubscription(subscription: Stripe.Subscription): boolean {
  const checkoutType = subscription.metadata?.checkout_type;
  const legacyType = subscription.metadata?.type;
  return (
    checkoutType === 'platform_saas' ||
    checkoutType === 'individual_app' ||
    checkoutType === 'host_shop_subscription' ||
    legacyType === 'host_shop_subscription'
  );
}

async function syncSubscriptionState(
  db: SupabaseClient,
  subscription: Stripe.Subscription,
): Promise<void> {
  await syncPlatformSubscriptionLifecycle(db, subscription);
  await syncIndividualAppLifecycle(db, subscription);
  await syncHostShopSubscriptionLifecycle(db, subscription);
}

async function persistInvoice(
  db: SupabaseClient,
  invoice: Stripe.Invoice,
  status: 'paid' | 'failed',
): Promise<void> {
  const subscriptionId = directSubscriptionId(invoice);
  if (!subscriptionId) return;

  const raw = invoice as unknown as {
    amount_paid?: number;
    amount_due?: number;
    period_start?: number;
    period_end?: number;
    hosted_invoice_url?: string | null;
    attempt_count?: number;
    last_payment_error?: { message?: string } | null;
  };

  await db.from('subscription_invoices').upsert(
    {
      stripe_invoice_id: invoice.id,
      subscription_id: subscriptionId,
      customer_id: invoiceCustomerId(invoice),
      amount_paid: status === 'paid' ? (raw.amount_paid ?? 0) : 0,
      amount_due: raw.amount_due ?? 0,
      status,
      period_start: raw.period_start ? new Date(raw.period_start * 1000).toISOString() : null,
      period_end: raw.period_end ? new Date(raw.period_end * 1000).toISOString() : null,
      paid_at: status === 'paid' ? new Date().toISOString() : null,
      invoice_url: raw.hosted_invoice_url ?? null,
      failure_message: status === 'failed' ? (raw.last_payment_error?.message ?? null) : null,
      attempt_count: raw.attempt_count ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_invoice_id' },
  );
}

async function grantCourseBuilderInvoiceCredits(
  db: SupabaseClient,
  invoice: Stripe.Invoice,
  subscription: Stripe.Subscription,
): Promise<void> {
  const metadata = subscription.metadata ?? {};
  const addons = String(metadata.addon_slugs ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  if (
    metadata.checkout_type !== 'platform_saas' ||
    !metadata.tenant_id ||
    !addons.includes(COURSE_BUILDER_APP_SLUG)
  ) {
    return;
  }

  const annual = ['annual', 'year', 'yearly', 'annually'].includes(metadata.billing_interval);
  const credits = COURSE_BUILDER_MONTHLY_ALLOWANCE * (annual ? 12 : 1);
  const rawInvoice = invoice as unknown as { period_start?: number; period_end?: number };
  const { error } = await db.rpc('grant_tenant_course_builder_credits', {
    p_tenant_id: metadata.tenant_id,
    p_app_slug: COURSE_BUILDER_APP_SLUG,
    p_credits: credits,
    p_operation: annual ? 'annual_subscription_allowance' : 'monthly_subscription_allowance',
    p_idempotency_key: `stripe-invoice:${invoice.id}:course-builder-allowance`,
    p_period_start: rawInvoice.period_start
      ? new Date(rawInvoice.period_start * 1000).toISOString()
      : null,
    p_period_end: rawInvoice.period_end
      ? new Date(rawInvoice.period_end * 1000).toISOString()
      : null,
    p_metadata: {
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: subscription.id,
      billing_interval: annual ? 'annual' : 'monthly',
    },
  });
  if (error) throw new Error(`Course Builder credit grant failed: ${error.message}`);
}

/**
 * Processes recurring Elevate SaaS subscription events after Stripe signature
 * verification. Returns true only when the event belongs to a canonical Elevate
 * recurring product family; legacy tuition/donation/store flows remain owned by
 * the legacy switch in /api/webhooks/stripe.
 */
export async function processSubscriptionEvent(
  db: SupabaseClient,
  stripe: Stripe,
  event: Stripe.Event,
): Promise<boolean> {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      if (!recognizedSubscription(subscription)) return false;
      await syncSubscriptionState(db, subscription);
      return true;
    }

    case 'invoice.payment_succeeded':
    case 'invoice.paid':
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = directSubscriptionId(invoice);
      if (!subscriptionId) return false;

      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      if (!recognizedSubscription(subscription)) return false;

      await persistInvoice(
        db,
        invoice,
        event.type === 'invoice.payment_failed' ? 'failed' : 'paid',
      );
      await syncSubscriptionState(db, subscription);
      if (event.type !== 'invoice.payment_failed') {
        await grantCourseBuilderInvoiceCredits(db, invoice, subscription);
      }
      return true;
    }

    default:
      return false;
  }
}
