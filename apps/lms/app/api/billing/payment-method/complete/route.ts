import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { getStripeWriteClient } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';

export async function GET(req: NextRequest) {
  await hydrateProcessEnv();
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '');
  const userDb = await createClient();
  const { data: { user } } = await userDb.auth.getUser();
  if (!user) return NextResponse.redirect(`${appUrl}/login?redirect=/account/payment-methods`);

  const sessionId = req.nextUrl.searchParams.get('session_id');
  const stripe = getStripeWriteClient();
  if (!sessionId || !stripe) {
    return NextResponse.redirect(`${appUrl}/account/payment-methods?setup=unavailable`);
  }

  const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['setup_intent'] });
  if (
    session.status !== 'complete' ||
    session.mode !== 'setup' ||
    session.client_reference_id !== user.id ||
    session.metadata?.user_id !== user.id ||
    session.metadata?.kind !== 'universal_payment_method_setup'
  ) {
    return NextResponse.redirect(`${appUrl}/account/payment-methods?setup=invalid`);
  }

  const setupIntent = session.setup_intent;
  const paymentMethodId = typeof setupIntent === 'object' && setupIntent &&
    typeof setupIntent.payment_method === 'string' ? setupIntent.payment_method : null;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
  if (!paymentMethodId || !customerId) {
    return NextResponse.redirect(`${appUrl}/account/payment-methods?setup=incomplete`);
  }

  await stripe.customers.update(customerId, {
    invoice_settings: { default_payment_method: paymentMethodId },
  });
  const admin = await requireAdminClient();
  const { error } = await admin.from('user_billing_customers').upsert(
    {
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_default_payment_method_id: paymentMethodId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) return NextResponse.redirect(`${appUrl}/account/payment-methods?setup=save-failed`);

  return NextResponse.redirect(`${appUrl}/account/payment-methods?setup=success`);
}
