import type Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import {
  constructStripeEventWithAnySecret,
  getCanonicalStripeWebhookSecrets,
} from '@/lib/stripe/construct-webhook-event';
import { syncHostShopSubscriptionLifecycle } from '@/lib/platform/orchestration/host-shop-subscription';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function invoiceSubscriptionId(invoice: Stripe.Invoice): string | null {
  const raw = invoice as unknown as { subscription?: string | { id?: string } | null };
  return typeof raw.subscription === 'string' ? raw.subscription : raw.subscription?.id ?? null;
}

export async function POST(request: NextRequest) {
  await hydrateProcessEnv();
  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'Missing signature' }, { status: 400 });

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = constructStripeEventWithAnySecret(stripe, body, signature, getCanonicalStripeWebhookSecrets());
  } catch (error) {
    logger.error('[host-shop/subscription/webhook] signature verification failed', error instanceof Error ? error : undefined);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const admin = await requireAdminClient();
  try {
    if (
      event.type === 'customer.subscription.created' ||
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      await syncHostShopSubscriptionLifecycle(admin, event.data.object as Stripe.Subscription);
    } else if (event.type === 'invoice.payment_failed' || event.type === 'invoice.payment_succeeded') {
      const subscriptionId = invoiceSubscriptionId(event.data.object as Stripe.Invoice);
      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        await syncHostShopSubscriptionLifecycle(admin, subscription);
      }
    }
  } catch (error) {
    logger.error('[host-shop/subscription/webhook] processing failed', error instanceof Error ? error : undefined, {
      eventId: event.id,
      eventType: event.type,
    });
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
