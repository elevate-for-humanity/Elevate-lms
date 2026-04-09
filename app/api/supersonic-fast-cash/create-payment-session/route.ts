import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { stripe } from '@/lib/stripe/client';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Deposit amount in cents — $49 intake deposit
const DEPOSIT_AMOUNT = 4900;
const DEPOSIT_LABEL = '$49 Tax Preparation Deposit — SupersonicFastCash';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  // Require authenticated session
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return safeError('Authentication required', 401);

  // Require consent on file before payment
  const admin = await getAdminClient();
  if (!admin) return safeInternalError(new Error('Admin client unavailable'), 'Service unavailable');

  const { data: consent } = await admin
    .from('client_consents')
    .select('id')
    .eq('client_id', user.id)
    .limit(1)
    .maybeSingle();

  if (!consent) return safeError('Consent agreement must be signed before payment', 403);

  // Check if already paid — don't create duplicate sessions
  const { data: existingPayment } = await admin
    .from('tax_payments')
    .select('id, status, stripe_checkout_session_id')
    .eq('client_id', user.id)
    .eq('status', 'paid')
    .limit(1)
    .maybeSingle();

  if (existingPayment) {
    return NextResponse.json({ already_paid: true });
  }

  if (!stripe) return safeError('Payment system not configured', 503);

  const origin = request.headers.get('origin') || 'https://www.supersonicfastermoney.com';

  try {
    // Create or retrieve Stripe customer
    let stripeCustomerId: string | undefined;
    const existing = await stripe.customers.list({ email: user.email!, limit: 1 });
    if (existing.data.length > 0) {
      stripeCustomerId = existing.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email!,
        metadata: { supabase_user_id: user.id },
      });
      stripeCustomerId = customer.id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: DEPOSIT_AMOUNT,
            product_data: {
              name: DEPOSIT_LABEL,
              description: 'Deposit applied toward your total tax preparation fee. Remainder due upon return completion.',
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/supersonic-fast-cash/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/supersonic-fast-cash/payment/cancel`,
      metadata: {
        supabase_user_id: user.id,
        payment_type: 'deposit',
      },
    });

    // Insert pending payment record — status updated to 'paid' only by webhook
    await admin.from('tax_payments').insert({
      client_id: user.id,
      stripe_customer_id: stripeCustomerId,
      stripe_checkout_session_id: session.id,
      amount: DEPOSIT_AMOUNT,
      currency: 'usd',
      payment_type: 'deposit',
      status: 'pending',
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return safeInternalError(err as Error, 'Failed to create payment session');
  }
}
