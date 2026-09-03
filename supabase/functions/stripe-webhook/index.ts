/**
 * Stripe Webhook Handler
 * Syncs Stripe subscription events to Supabase
 *
 * Copyright (c) 2025 Elevate for Humanity
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.0.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET')!;
const WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const stripe = new Stripe(STRIPE_SECRET, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Plan mapping: Stripe Price ID → Entitlements
const PLAN_MAP: Record<
  string,
  {
    plan: string;
    max_seats: number;
    max_courses: number;
    features: Record<string, boolean>;
  }
> = {
  // Starter Plan
  price_starter: {
    plan: 'starter',
    max_seats: 5,
    max_courses: 10,
    features: {
      audit: true,
      customBranding: false,
      sso: false,
      aiWebsiteBuilder: false,
      aiCourseCreator: false,
      mobileApps: false,
      advancedAnalytics: false,
    },
  },
  // Growth Plan
  price_growth: {
    plan: 'growth',
    max_seats: 50,
    max_courses: 100,
    features: {
      audit: true,
      customBranding: true,
      sso: false,
      aiWebsiteBuilder: true,
      aiCourseCreator: true,
      mobileApps: true,
      advancedAnalytics: true,
    },
  },
  // Enterprise Plan
  price_enterprise: {
    plan: 'enterprise',
    max_seats: -1, // unlimited
    max_courses: -1, // unlimited
    features: {
      audit: true,
      customBranding: true,
      sso: true,
      aiWebsiteBuilder: true,
      aiCourseCreator: true,
      mobileApps: true,
      advancedAnalytics: true,
      whiteLabel: true,
      prioritySupport: true,
    },
  },
};

serve(async (req) => {
  try {
    // Verify webhook signature
    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
    } catch (err) {
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const priceId = subscription.items.data[0]?.price?.id || '';
  const plan = PLAN_MAP[priceId] || PLAN_MAP['price_starter'];

  // Find org by Stripe customer ID
  const { data: billing, error: findError } = await supabase
    .from('billing_subscriptions')
    .select('org_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (findError || !billing) {
    return;
  }

  const orgId = billing.org_id;

  // Update billing subscription
  const { error: billingError } = await supabase.from('billing_subscriptions').upsert({
    org_id: orgId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    plan: plan.plan,
    status: subscription.status,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    seats: subscription.quantity || 1,
    metadata: subscription.metadata || {},
    updated_at: new Date().toISOString(),
  });

  if (billingError) {
    throw billingError;
  }

  // Update entitlements
  const { error: entError } = await supabase.from('entitlements').upsert({
    org_id: orgId,
    max_seats: plan.max_seats,
    max_courses: plan.max_courses,
    features: plan.features,
    source: 'stripe',
    updated_at: new Date().toISOString(),
  });

  if (entError) {
    throw entError;
  }

  // Update org tier
  const { error: orgError } = await supabase
    .from('orgs')
    .update({
      tier: plan.plan,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orgId);

  if (orgError) {
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  // Find org
  const { data: billing } = await supabase
    .from('billing_subscriptions')
    .select('org_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (!billing) return;

  // Update to cancelled status
  await supabase
    .from('billing_subscriptions')
    .update({
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', billing.org_id);

  // Downgrade to starter entitlements
  const starterPlan = PLAN_MAP['price_starter'];
  await supabase
    .from('entitlements')
    .update({
      max_seats: starterPlan.max_seats,
      max_courses: starterPlan.max_courses,
      features: starterPlan.features,
      source: 'stripe',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', billing.org_id);

  // Update org tier
  await supabase
    .from('orgs')
    .update({
      tier: 'starter',
      status: 'suspended',
      updated_at: new Date().toISOString(),
    })
    .eq('id', billing.org_id);
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find org
  const { data: billing } = await supabase
    .from('billing_subscriptions')
    .select('org_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (!billing) return;

  // Update status to active
  await supabase
    .from('billing_subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', billing.org_id);

  // Reactivate org if suspended
  await supabase
    .from('orgs')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('id', billing.org_id);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;

  // Find org
  const { data: billing } = await supabase
    .from('billing_subscriptions')
    .select('org_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();

  if (!billing) return;

  // Update status to past_due
  await supabase
    .from('billing_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('org_id', billing.org_id);
}
