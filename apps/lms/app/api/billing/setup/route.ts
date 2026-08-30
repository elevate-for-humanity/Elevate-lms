import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

const SUPPORTED_TABLES: Record<string, 'barber_subscriptions' | 'cosmetology_subscriptions'> = {
  'barber-apprenticeship': 'barber_subscriptions',
  'cosmetology-apprenticeship': 'cosmetology_subscriptions',
};

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'payment');
  if (rateLimited) return rateLimited;

  const body = (await req.json().catch(() => ({}))) as { authorized?: boolean };
  if (body.authorized !== true) {
    return NextResponse.json({ error: 'Automatic-payment authorization is required.' }, { status: 400 });
  }

  await hydrateProcessEnv();
  const userDb = await createClient();
  const { data: { user } } = await userDb.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  const admin = await requireAdminClient();
  const { data: enrollment } = await admin
    .from('program_enrollments')
    .select('id,user_id,program_slug,email,full_name,stripe_customer_id,stripe_subscription_id,funding_source,status,amount_paid_cents,down_payment')
    .eq('user_id', user.id)
    .eq('funding_source', 'self_pay')
    .not('status', 'in', '(withdrawn,completed,cancelled)')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!enrollment?.id || !SUPPORTED_TABLES[enrollment.program_slug]) {
    return NextResponse.json({ error: 'No eligible self-pay apprenticeship enrollment was found.' }, { status: 404 });
  }
  if (enrollment.stripe_subscription_id) {
    return NextResponse.json({ error: 'Automatic payments are already configured. Use Update Payment Method.' }, { status: 409 });
  }

  const requiredDepositCents = Math.max(0, Math.round(Number(enrollment.down_payment || 0) * 100));
  const paidCents = Math.max(0, Number(enrollment.amount_paid_cents || 0));
  if (requiredDepositCents > 0 && paidCents < requiredDepositCents) {
    return NextResponse.json({
      error: `The ${(requiredDepositCents / 100).toFixed(2)} enrollment deposit must be paid before weekly automatic payments can be authorized.`,
    }, { status: 409 });
  }

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });

  let customerId = enrollment.stripe_customer_id as string | null;
  if (!customerId) {
    const existing = await stripe.customers.list({ email: user.email, limit: 1 });
    const customer = existing.data[0] ?? await stripe.customers.create({
      email: user.email,
      name: enrollment.full_name || undefined,
      metadata: { user_id: user.id, enrollment_id: enrollment.id },
    });
    customerId = customer.id;
    // profiles.stripe_customer_id is a legacy UUID column in production; Stripe
    // customer IDs belong on the enrollment where the schema stores them as text.
    await admin.from('program_enrollments').update({ stripe_customer_id: customerId }).eq('id', enrollment.id);
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');
  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: customerId,
    client_reference_id: user.id,
    success_url: `${appUrl}/api/billing/setup/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/apprentice/billing?setup=cancelled`,
    metadata: {
      kind: 'apprenticeship_billing_setup',
      user_id: user.id,
      enrollment_id: enrollment.id,
      program_slug: enrollment.program_slug,
      authorization: 'weekly_tuition_autopay',
    },
    custom_text: {
      submit: {
        message: 'By saving this payment method, you authorize the finite weekly tuition schedule disclosed in your Elevate dashboard. Card data is stored by Stripe, not Elevate.',
      },
    },
  });

  await admin.from('billing_authorizations').insert({
    user_id: user.id,
    enrollment_id: enrollment.id,
    program_slug: enrollment.program_slug,
    authorization_type: 'weekly_tuition_autopay',
    status: 'checkout_started',
    stripe_customer_id: customerId,
    stripe_checkout_session_id: session.id,
    authorized_at: new Date().toISOString(),
    ip_address: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null,
    user_agent: req.headers.get('user-agent'),
  });

  return NextResponse.json({ url: session.url });
}

export const POST = withApiAudit('/api/billing/setup', _POST);
