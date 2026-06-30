// PUBLIC ROUTE: Stripe embedded checkout for CPR / First Aid self-pay enrollment
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { CPR_PRICE_CENTS, CPR_PROGRAM_SLUG } from '@/lib/cpr/pricing';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getStripeMethodsForAmount } from '@/lib/bnpl-config';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { customer_email, customer_name, customer_phone, application_id } = body;

    if (!customer_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    const siteUrl =
      (process.env.NEXT_PUBLIC_SITE_URL || '').trim() || PLATFORM_DEFAULTS.siteUrl;
    const paymentMethods = getStripeMethodsForAmount(CPR_PRICE_CENTS / 100);

    const customers = await stripe.customers.list({ email: customer_email, limit: 1 });
    const customerId =
      customers.data[0]?.id ??
      (
        await stripe.customers.create({
          email: customer_email,
          name: customer_name,
          phone: customer_phone,
          metadata: {
            application_id: application_id || '',
            program: CPR_PROGRAM_SLUG,
          },
        })
      ).id;

    const session = await stripe.checkout.sessions.create({
      ui_mode: 'embedded',
      redirect_on_completion: 'never',
      customer: customerId,
      payment_method_types: paymentMethods,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'CPR & First Aid Certification',
              description:
                'Live remote instructor-led CPR/AED/First Aid — mannequin shipped to your door (HSI)',
            },
            unit_amount: CPR_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      metadata: {
        payment_type: 'cpr_enrollment',
        funding_source: 'self_pay',
        program_slug: CPR_PROGRAM_SLUG,
        application_id: application_id || '',
      },
      return_url: `${siteUrl}/apply?program=cpr-first-aid&payment=success&session_id={CHECKOUT_SESSION_ID}`,
    });

    if (!session.client_secret) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ clientSecret: session.client_secret, sessionId: session.id });
  } catch (error) {
    logger.error('CPR embedded checkout error', error as Error);
    return NextResponse.json({ error: 'Checkout failed. Please try again.' }, { status: 500 });
  }
}
