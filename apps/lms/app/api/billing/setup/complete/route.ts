import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';

const PROGRAM_CONFIG = {
  'barber-apprenticeship': { table: 'barber_subscriptions', product: 'Barber Apprenticeship — Weekly Tuition' },
  'cosmetology-apprenticeship': { table: 'cosmetology_subscriptions', product: 'Cosmetology Apprenticeship — Weekly Tuition' },
} as const;

function nextMondayEpoch(): number {
  const now = new Date();
  const days = ((8 - now.getUTCDay()) % 7) || 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days, 12));
  return Math.floor(monday.getTime() / 1000);
}

export async function GET(req: NextRequest) {
  await hydrateProcessEnv();
  const userDb = await createClient();
  const { data: { user } } = await userDb.auth.getUser();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');
  if (!user) return NextResponse.redirect(`${appUrl}/login?redirect=/apprentice/billing`);

  const sessionId = req.nextUrl.searchParams.get('session_id');
  if (!sessionId) return NextResponse.redirect(`${appUrl}/apprentice/billing?setup=missing`);

  const stripe = getStripe();
  if (!stripe) return NextResponse.redirect(`${appUrl}/apprentice/billing?setup=unavailable`);
  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['setup_intent'] });
  if (session.client_reference_id !== user.id || session.metadata?.user_id !== user.id) {
    return NextResponse.redirect(`${appUrl}/apprentice/billing?setup=invalid`);
  }

  const enrollmentId = session.metadata?.enrollment_id;
  const programSlug = session.metadata?.program_slug as keyof typeof PROGRAM_CONFIG | undefined;
  const config = programSlug ? PROGRAM_CONFIG[programSlug] : undefined;
  const setupIntent = session.setup_intent;
  const paymentMethodId = typeof setupIntent === 'object' && setupIntent && typeof setupIntent.payment_method === 'string'
    ? setupIntent.payment_method
    : null;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (!enrollmentId || !config || !paymentMethodId || !customerId) {
    return NextResponse.redirect(`${appUrl}/apprentice/billing?setup=incomplete`);
  }

  const admin = await requireAdminClient();
  const [{ data: enrollment }, { data: pricing }] = await Promise.all([
    admin.from('program_enrollments').select('id,user_id,stripe_subscription_id,amount_paid_cents').eq('id', enrollmentId).eq('user_id', user.id).maybeSingle(),
    admin.from('program_pricing').select('tuition_cents').eq('program_slug', programSlug).eq('active', true).maybeSingle(),
  ]);
  if (!enrollment || enrollment.stripe_subscription_id || !pricing?.tuition_cents) {
    return NextResponse.redirect(`${appUrl}/apprentice/billing?setup=already-configured`);
  }

  const tuitionCents = Number(pricing.tuition_cents);
  const paidCents = Number(enrollment.amount_paid_cents || 0);
  const remainingCents = Math.max(0, tuitionCents - paidCents);
  const installmentCount = programSlug === 'cosmetology-apprenticeship' ? 54 : 52;
  // Never round up a recurring installment: that could collect more than the
  // disclosed balance. Exact plans (including Logan's $5,400 / 54) have no remainder.
  const weeklyCents = Math.floor(remainingCents / installmentCount);
  const unscheduledRemainderCents = remainingCents - weeklyCents * installmentCount;

  await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId }).catch(() => {});
  await stripe.customers.update(customerId, { invoice_settings: { default_payment_method: paymentMethodId } });
  const price = await stripe.prices.create({
    currency: 'usd',
    unit_amount: weeklyCents,
    recurring: { interval: 'week' },
    product_data: { name: config.product },
    metadata: { program_slug: programSlug, installment_count: String(installmentCount) },
  });
  const startDate = nextMondayEpoch();
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    default_payment_method: paymentMethodId,
    items: [{ price: price.id }],
    trial_end: startDate,
    cancel_at: startDate + installmentCount * 7 * 24 * 60 * 60,
    proration_behavior: 'none',
    metadata: {
      kind: 'apprenticeship_weekly_tuition',
      enrollment_id: enrollment.id,
      user_id: user.id,
      program_slug: programSlug,
      installment_count: String(installmentCount),
      scheduled_amount_cents: String(weeklyCents * installmentCount),
      unscheduled_remainder_cents: String(unscheduledRemainderCents),
      authorized_checkout_session_id: session.id,
    },
  });

  const now = new Date().toISOString();
  const nextPayment = new Date(startDate * 1000).toISOString();
  const { data: existingSub } = await admin.from(config.table).select('id').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
  const subscriptionPayload = {
    user_id: user.id,
    enrollment_id: enrollment.id,
    stripe_subscription_id: subscription.id,
    stripe_customer_id: customerId,
    stripe_checkout_session_id: session.id,
    customer_email: user.email,
    status: subscription.status,
    payment_status: 'active',
    setup_fee_paid: paidCents > 0,
    setup_fee_amount: paidCents,
    weekly_payment_cents: weeklyCents,
    weeks_remaining: installmentCount,
    full_tuition_amount: tuitionCents / 100,
    amount_paid_at_checkout: paidCents / 100,
    remaining_balance: remainingCents / 100,
    fully_paid: remainingCents === 0,
    payment_method: 'stripe_autopay',
    payment_model: 'weekly_subscription',
    billing_cycle_anchor: nextPayment,
    next_payment_date: nextPayment,
    updated_at: now,
  };
  if (existingSub?.id) await admin.from(config.table).update(subscriptionPayload).eq('id', existingSub.id);
  else await admin.from(config.table).insert(subscriptionPayload);

  await Promise.all([
    admin.from('program_enrollments').update({
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      stripe_subscription_status: subscription.status,
      payment_plan_months: null,
      next_payment_date: nextPayment,
      balance_remaining: remainingCents / 100,
      updated_at: now,
    }).eq('id', enrollment.id),
    admin.from('billing_authorizations').update({
      status: 'authorized',
      stripe_subscription_id: subscription.id,
      stripe_payment_method_id: paymentMethodId,
      completed_at: now,
    }).eq('stripe_checkout_session_id', session.id).eq('user_id', user.id),
  ]);

  return NextResponse.redirect(`${appUrl}/apprentice/billing?setup=success`);
}
