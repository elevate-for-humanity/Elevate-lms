import 'server-only';

import { createHash } from 'node:crypto';
import { payPalRequest } from '@/lib/integrations/paypal-client';
import type { BillingCadence } from '@/lib/billing/schedule';

type Database = any;

type Schedule = {
  id: string;
  customer_name: string;
  customer_email: string;
  canonical_product_key: string;
  product_name: string;
  product_description?: string | null;
  amount_cents: number;
  cadence: BillingCadence;
  next_invoice_date: string;
  remaining_invoices?: number | null;
  provider_product_id?: string | null;
  provider_plan_id?: string | null;
  provider_subscription_id?: string | null;
  provider_status?: string | null;
  provider_approval_url?: string | null;
};

type PayPalLink = { href?: string; rel?: string };

function splitSubscriberName(displayName: string): { given_name: string; surname?: string } {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  const givenName = (parts.shift() || 'Learner').slice(0, 140);
  const surname = parts.join(' ').slice(0, 140);
  return surname ? { given_name: givenName, surname } : { given_name: givenName };
}

function requestId(...parts: string[]): string {
  return createHash('sha256').update(parts.join(':')).digest('hex');
}

function billingFrequency(cadence: BillingCadence): { interval_unit: string; interval_count: number } {
  if (cadence === 'weekly') return { interval_unit: 'WEEK', interval_count: 1 };
  if (cadence === 'monthly') return { interval_unit: 'MONTH', interval_count: 1 };
  if (cadence === 'quarterly') return { interval_unit: 'MONTH', interval_count: 3 };
  return { interval_unit: 'YEAR', interval_count: 1 };
}

function safeStartTime(date: string): string {
  const requested = new Date(`${date}T14:00:00.000Z`);
  const minimum = new Date(Date.now() + 10 * 60 * 1000);
  return (requested > minimum ? requested : minimum).toISOString();
}

export async function provisionPayPalSubscription(db: Database, schedule: Schedule) {
  if (schedule.provider_status === 'active') {
    return {
      subscriptionId: schedule.provider_subscription_id,
      approvalUrl: schedule.provider_approval_url,
      status: 'active',
    };
  }

  let productId = schedule.provider_product_id || null;
  if (!productId) {
    const product = await payPalRequest<{ id: string }>(
      '/v1/catalogs/products',
      {
        method: 'POST',
        body: JSON.stringify({
          name: schedule.product_name,
          description: schedule.product_description || `Elevate subscription: ${schedule.product_name}`,
          type: 'SERVICE',
          category: 'EDUCATIONAL_AND_TEXTBOOKS',
        }),
      },
      requestId('billing-product', schedule.id),
    );
    productId = product.id;
    const saved = await db
      .from('billing_schedules')
      .update({ provider_product_id: productId, updated_at: new Date().toISOString() })
      .eq('id', schedule.id);
    if (saved.error) throw new Error(`PayPal product was created but could not be linked: ${saved.error.message}`);
  }

  let planId = schedule.provider_plan_id || null;
  if (!planId) {
    const plan = await payPalRequest<{ id: string }>(
      '/v1/billing/plans',
      {
        method: 'POST',
        body: JSON.stringify({
          product_id: productId,
          name: `${schedule.product_name} — ${schedule.cadence}`.slice(0, 127),
          description: `Automatic ${schedule.cadence} tuition collection`,
          billing_cycles: [
            {
              frequency: billingFrequency(schedule.cadence),
              tenure_type: 'REGULAR',
              sequence: 1,
              total_cycles: schedule.remaining_invoices || 0,
              pricing_scheme: {
                fixed_price: {
                  value: (Number(schedule.amount_cents) / 100).toFixed(2),
                  currency_code: 'USD',
                },
              },
            },
          ],
          payment_preferences: {
            auto_bill_outstanding: true,
            payment_failure_threshold: 3,
          },
        }),
      },
      requestId('billing-plan', schedule.id),
    );
    planId = plan.id;
    const saved = await db
      .from('billing_schedules')
      .update({ provider_plan_id: planId, updated_at: new Date().toISOString() })
      .eq('id', schedule.id);
    if (saved.error) throw new Error(`PayPal plan was created but could not be linked: ${saved.error.message}`);
  }

  let subscriptionId = schedule.provider_subscription_id || null;
  let approvalUrl = schedule.provider_approval_url || null;
  if (!subscriptionId) {
    const subscription = await payPalRequest<{
      id: string;
      status?: string;
      links?: PayPalLink[];
    }>(
      '/v1/billing/subscriptions',
      {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          start_time: safeStartTime(schedule.next_invoice_date),
          custom_id: schedule.id,
          subscriber: {
            name: splitSubscriberName(schedule.customer_name),
            email_address: schedule.customer_email,
          },
          application_context: {
            brand_name: 'Elevate for Humanity',
            locale: 'en-US',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'SUBSCRIBE_NOW',
            return_url: 'https://app.elevateforhumanity.org/lms/documents?paypal=approved',
            cancel_url: 'https://app.elevateforhumanity.org/lms/documents?paypal=canceled',
          },
        }),
      },
      requestId('billing-subscription', schedule.id),
    );
    subscriptionId = subscription.id;
    approvalUrl = subscription.links?.find((link) => link.rel === 'approve')?.href || null;
    const saved = await db
      .from('billing_schedules')
      .update({
        provider_subscription_id: subscriptionId,
        provider_status: 'approval_pending',
        provider_approval_url: approvalUrl,
        last_provider_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', schedule.id);
    if (saved.error) {
      throw new Error(`PayPal subscription was created but could not be linked: ${saved.error.message}`);
    }
  }

  return { subscriptionId, approvalUrl, status: 'approval_pending' };
}

export async function getPayPalSubscription(subscriptionId: string) {
  return payPalRequest<{
    id: string;
    status: string;
    custom_id?: string;
    billing_info?: { next_billing_time?: string; failed_payments_count?: number };
  }>(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}`);
}

export async function listPayPalSubscriptionTransactions(
  subscriptionId: string,
  startTime: string,
  endTime: string,
) {
  const query = new URLSearchParams({ start_time: startTime, end_time: endTime });
  return payPalRequest<{
    transactions?: Array<{
      id: string;
      status: string;
      time: string;
      amount_with_breakdown?: { gross_amount?: { currency_code?: string; value?: string } };
    }>;
  }>(`/v1/billing/subscriptions/${encodeURIComponent(subscriptionId)}/transactions?${query}`);
}
