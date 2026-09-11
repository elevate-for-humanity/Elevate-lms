import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { hydrateProcessEnv } from '@/lib/secrets';
import { getStripeWriteClient } from '@/lib/stripe/client';
import { resolveStripeCustomer } from '@/lib/stripe/customer-resolver';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function _POST(request: NextRequest) {
  const limited = await applyRateLimit(request, 'payment');
  if (limited) return limited;
  await hydrateProcessEnv();

  const userDb = await createClient();
  const {
    data: { user },
  } = await userDb.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const stripe = getStripeWriteClient();
  if (!stripe) return NextResponse.json({ error: 'Payment setup is unavailable' }, { status: 503 });

  const admin = await requireAdminClient();
  const [{ data: billing }, { data: profile }] = await Promise.all([
    admin
      .from('user_billing_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle(),
    admin.from('profiles').select('stripe_customer_id,full_name').eq('id', user.id).maybeSingle(),
  ]);
  const { customer } = await resolveStripeCustomer({
    stripe,
    email: user.email,
    name: profile?.full_name || undefined,
    candidateIds: [billing?.stripe_customer_id, profile?.stripe_customer_id],
    createIfMissing: true,
    metadata: { elevate_user_id: user.id },
  });
  if (!customer)
    return NextResponse.json({ error: 'Billing profile could not be created' }, { status: 502 });

  await admin
    .from('user_billing_customers')
    .upsert(
      { user_id: user.id, stripe_customer_id: customer.id, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' },
    );

  const appUrl = (
    process.env.NEXT_PUBLIC_LMS_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'https://app.elevateforhumanity.org'
  ).replace(/\/$/, '');
  const session = await stripe.checkout.sessions.create({
    mode: 'setup',
    customer: customer.id,
    client_reference_id: user.id,
    payment_method_types: ['card'],
    metadata: { kind: 'universal_payment_method_setup', user_id: user.id },
    success_url: `${appUrl}/api/billing/payment-method/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/account/payment-methods?setup=cancelled`,
  });
  if (!session.url)
    return NextResponse.json({ error: 'Payment setup URL was not returned' }, { status: 502 });
  return NextResponse.json({ url: session.url });
}

export const POST = withApiAudit('/api/billing/setup', _POST);
