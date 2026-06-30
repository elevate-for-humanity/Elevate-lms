import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

// POST /api/cosmetology/activate-subscription
// Called after Stripe SetupIntent confirms. Attaches the saved payment method
// to the customer and creates a weekly Stripe subscription.

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'payment');
    if (rateLimited) return rateLimited;

    await hydrateProcessEnv();

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) return safeError('Unauthorized', 401);

    const db = await requireAdminClient();

    const { data: sub } = await db
      .from('cosmetology_subscriptions')
      .select(
        'id, stripe_customer_id, stripe_subscription_id, weekly_payment_cents, weeks_remaining, status',
      )
      .eq('user_id', user.id)
      .maybeSingle();

    if (!sub) return safeError('No subscription record found', 404);
    if (sub.stripe_subscription_id && sub.status === 'active') {
      return NextResponse.json({ success: true, alreadyActive: true });
    }

    const stripe = getStripe();
    if (!stripe) return safeError('Payment system unavailable', 503);

    // Get the default payment method saved via SetupIntent
    const customer = (await stripe.customers.retrieve(sub.stripe_customer_id)) as any;
    const paymentMethodId =
      customer?.invoice_settings?.default_payment_method ??
      (
        await stripe.paymentMethods.list({
          customer: sub.stripe_customer_id,
          type: 'card',
          limit: 1,
        })
      ).data[0]?.id;

    if (!paymentMethodId) {
      return safeError('No payment method found on customer. Complete card setup first.', 400);
    }

    // Set as default payment method
    await stripe.customers.update(sub.stripe_customer_id, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    // Calculate next Friday billing anchor
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7;
    const nextFriday = new Date(now);
    nextFriday.setUTCDate(now.getUTCDate() + daysUntilFriday);
    nextFriday.setUTCHours(15, 0, 0, 0); // 10:00 AM ET = 15:00 UTC

    const weeklyAmountCents = sub.weekly_payment_cents;

    // Create product and price for this program
    const product = await stripe.products.create({
      name: 'Cosmetology Apprenticeship — Weekly Tuition',
      metadata: { program: 'cosmetology-apprenticeship' },
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: weeklyAmountCents,
      currency: 'usd',
      recurring: { interval: 'week', interval_count: 1 },
    });

    const stripeSubscription = await stripe.subscriptions.create({
      customer: sub.stripe_customer_id,
      default_payment_method: paymentMethodId,
      billing_cycle_anchor: Math.floor(nextFriday.getTime() / 1000),
      proration_behavior: 'none',
      items: [{ price: price.id }],
      metadata: {
        user_id: user.id,
        program: 'cosmetology-apprenticeship',
        weeks_remaining: String(sub.weeks_remaining),
      },
    });

    await db
      .from('cosmetology_subscriptions')
      .update({
        stripe_subscription_id: stripeSubscription.id,
        status: 'active',
        billing_cycle_anchor: new Date(stripeSubscription.billing_cycle_anchor * 1000).toISOString(),
        current_period_start: new Date((stripeSubscription as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((stripeSubscription as any).current_period_end * 1000).toISOString(),
        payment_status: 'active',
      })
      .eq('id', sub.id);

    // Mark profile onboarding complete
    await db
      .from('profiles')
      .update({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    logger.info('[cosmetology/activate-subscription] Subscription created', {
      userId: user.id,
      subscriptionId: stripeSubscription.id,
      weeklyAmountCents,
    });

    return NextResponse.json({ success: true, subscriptionId: stripeSubscription.id });
  } catch (err) {
    logger.error('[cosmetology/activate-subscription] Error', err);
    return safeInternalError(err, 'Failed to activate subscription');
  }
}
