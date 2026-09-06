import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripeWriteClient } from '@/lib/stripe/client';
import { resolveStripeCustomer } from '@/lib/stripe/customer-resolver';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'payment');
  if (rateLimited) return rateLimited;

  await hydrateProcessEnv();
  const userDb = await createClient();
  const { data: { user } } = await userDb.auth.getUser();
  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  const admin = await requireAdminClient();
  const [{ data: billingCustomer }, { data: enrollment }] = await Promise.all([
    admin
      .from('user_billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    admin
      .from('program_enrollments')
      .select('stripe_customer_id')
      .or(`user_id.eq.${user.id},student_id.eq.${user.id}`)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const stripe = getStripeWriteClient();
  if (!stripe) return NextResponse.json({ error: 'Stripe is not configured.' }, { status: 503 });

  const name = typeof user.user_metadata?.full_name === 'string'
    ? user.user_metadata.full_name
    : undefined;
  const { customer } = await resolveStripeCustomer({
    stripe,
    email: user.email,
    name,
    candidateIds: [billingCustomer?.stripe_customer_id, enrollment?.stripe_customer_id],
    metadata: { user_id: user.id },
    createIfMissing: true,
  });
  if (!customer) {
    return NextResponse.json({ error: 'Unable to create a secure billing account.' }, { status: 502 });
  }

  const { error: mappingError } = await admin.from('user_billing_customers').upsert(
    {
      user_id: user.id,
      stripe_customer_id: customer.id,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (mappingError) {
    return NextResponse.json({ error: 'Unable to save the secure billing account.' }, { status: 502 });
  }

  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');
  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    currency: 'usd',
    customer: customer.id,
    client_reference_id: user.id,
    success_url: `${appUrl}/api/billing/payment-method/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/account/payment-methods?setup=cancelled`,
    metadata: { kind: 'universal_payment_method_setup', user_id: user.id },
  });

  return NextResponse.json({ url: session.url });
}

export const POST = withApiAudit('/api/billing/payment-method/setup', _POST, { critical: true });
