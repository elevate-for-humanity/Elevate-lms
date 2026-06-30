import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { TUITION_CENTS, PAYMENT_TERM_WEEKS, weeklyPaymentCents } from '@/lib/barber/pricing';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

// POST /api/barber/setup-intent
// Creates a Stripe Customer (if needed) and a SetupIntent for saving a payment method.
// Called from the payment-setup onboarding step.

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

    // Get profile for name/email
    const { data: profile } = await db
      .from('profiles')
      .select('full_name, first_name, last_name, email')
      .eq('id', user.id)
      .maybeSingle();

    const email = profile?.email ?? user.email ?? '';
    const name =
      profile?.full_name ||
      `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim() ||
      email;

    // Check if a barber_subscription already exists with a Stripe customer
    const { data: existingSub } = await db
      .from('barber_subscriptions')
      .select('id, stripe_customer_id, stripe_subscription_id, status')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingSub?.stripe_subscription_id && existingSub.status === 'active') {
      return safeError('Subscription already active', 409);
    }

    const stripe = getStripe();
    if (!stripe) return safeError('Payment system unavailable', 503);

    // Reuse existing Stripe customer or create new one
    let customerId = existingSub?.stripe_customer_id ?? null;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: { user_id: user.id, program: 'barber-apprenticeship' },
      });
      customerId = customer.id;
    }

    // Create SetupIntent — usage: off_session so we can charge weekly without user present
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: 'off_session',
      payment_method_types: ['card'],
      metadata: { user_id: user.id, program: 'barber-apprenticeship' },
    });

    // Upsert barber_subscriptions with customer ID so we can find it later
    // Default weekly amount — overridden by DB value if sub already exists
    let defaultWeeklyAmountCents = weeklyPaymentCents(0);

    if (!existingSub) {
      // Get enrollment for reference
      const { data: enrollment } = await db
        .from('program_enrollments')
        .select('id, amount_paid_cents')
        .eq('user_id', user.id)
        .eq('program_slug', 'barber-apprenticeship')
        .maybeSingle();

      const amountPaidCents = enrollment?.amount_paid_cents ?? 0;
      // Payment term is fixed at PAYMENT_TERM_WEEKS (29) for all students.
      // Transfer hours affect program duration only, never the payment schedule.
      defaultWeeklyAmountCents = weeklyPaymentCents(amountPaidCents / 100);

      await db.from('barber_subscriptions').insert({
        user_id: user.id,
        enrollment_id: enrollment?.id ?? null,
        stripe_customer_id: customerId,
        customer_email: email,
        customer_name: name,
        status: 'pending_payment_method',
        setup_fee_paid: amountPaidCents > 0,
        setup_fee_amount: amountPaidCents,
        weekly_payment_cents: defaultWeeklyAmountCents,
        weeks_remaining: PAYMENT_TERM_WEEKS,
      });
    } else if (!existingSub.stripe_customer_id) {
      await db
        .from('barber_subscriptions')
        .update({ stripe_customer_id: customerId })
        .eq('id', existingSub.id);
    }

    // Pull final weekly amount from DB (may differ if sub already existed)
    const { data: finalSub } = await db
      .from('barber_subscriptions')
      .select('weekly_payment_cents, weeks_remaining')
      .eq('user_id', user.id)
      .maybeSingle();

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId,
      weeklyPaymentCents: finalSub?.weekly_payment_cents ?? defaultWeeklyAmountCents,
      weeksRemaining: finalSub?.weeks_remaining ?? PAYMENT_TERM_WEEKS,
    });
  } catch (err) {
    logger.error('[barber/setup-intent] Error', err);
    return safeInternalError(err, 'Failed to create setup intent');
  }
}
