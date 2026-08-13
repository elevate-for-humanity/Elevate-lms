import { NextRequest, NextResponse } from 'next/server';
import { getStripe, stripeCall } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'contact');
  if (rateLimited) return rateLimited;

  const body = await req.json().catch(() => ({}));
  const { studentEmail, studentName, vendorId, vendorStripeAccountId } = body;
  if (!studentEmail) {
    return NextResponse.json({ error: 'Student email is required.' }, { status: 400 });
  }

  const priceCents = 149900;
  const vendorAmountCents = 21300;
  const elevateAmountCents = priceCents - vendorAmountCents;

  await hydrateProcessEnv().catch(() => undefined);
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Checkout is temporarily unavailable.' }, { status: 503 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.elevateforhumanity.org';

  try {
    const session = await stripeCall(() => stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: studentEmail,
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Online Certified Phlebotomy Technician Program',
            description: '100% online self-pay healthcare training program.',
            metadata: { program_slug: 'phlebotomy-online', product_type: 'course' },
          },
          unit_amount: priceCents,
        },
        quantity: 1,
      }],
      payment_intent_data: vendorStripeAccountId
        ? { application_fee_amount: elevateAmountCents, transfer_data: { destination: vendorStripeAccountId } }
        : undefined,
      metadata: {
        program_slug: 'phlebotomy-online',
        product_type: 'course',
        funding_type: 'self_pay',
        delivery: 'online_self_paced',
        student_email: studentEmail,
        student_name: studentName || '',
        vendor_id: vendorId || '',
        vendor_amount_cents: String(vendorAmountCents),
        elevate_amount_cents: String(elevateAmountCents),
        course_access: 'immediate',
        payout_mode: vendorStripeAccountId ? 'stripe_connect' : 'manual',
      },
      success_url: `${appUrl}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/programs/phlebotomy-online?checkout=cancelled`,
    }));

    return NextResponse.json({ url: session.url });
  } catch {
    return NextResponse.json({ error: 'Could not create checkout.' }, { status: 502 });
  }
}
