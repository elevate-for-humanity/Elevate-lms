import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { BARBER_PRICING } from '@/lib/programs/pricing';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key);
}

/**
 * POST /api/barber/checkout/full
 * 
 * Pay in full checkout for Barber Apprenticeship.
 * Applies 5% discount for full payment.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transferred_hours = 0,
      customer_email,
      customer_name,
      customer_phone,
      application_id,
      has_host_shop,
      host_shop_name,
      success_url,
      cancel_url,
    } = body;

    if (!customer_email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const stripe = getStripe();

    // Create or retrieve Stripe customer
    const customers = await stripe.customers.list({
      email: customer_email,
      limit: 1,
    });

    let customerId: string;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: customer_email,
        name: customer_name || undefined,
        phone: customer_phone || undefined,
        metadata: {
          program: 'barber-apprenticeship',
          applicationId: application_id || '',
        },
      });
      customerId = customer.id;
    }

    // Calculate adjusted price based on transfer hours
    const totalHoursRequired = BARBER_PRICING.totalHoursRequired || 2000;
    const hoursRemaining = Math.max(0, totalHoursRequired - transferred_hours);
    const priceRatio = hoursRemaining / totalHoursRequired;
    const adjustedFullPrice = Math.round(BARBER_PRICING.fullPrice * priceRatio);
    
    // 5% discount for paying in full
    const discountedPrice = Math.round(adjustedFullPrice * 0.95);

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const finalSuccessUrl = success_url || `${baseUrl}/programs/barber-apprenticeship/enrollment-success?session_id={CHECKOUT_SESSION_ID}`;
    const finalCancelUrl = cancel_url || `${baseUrl}/programs/barber-apprenticeship/apply?canceled=true`;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      // Use the BARBER APPRENTICESHIP payment method configuration
      // This has Klarna, Afterpay, Cash App, Apple Pay, Google Pay enabled
      payment_method_configuration: 'pmc_1SczlEIRNf5vPH3Ai841igCB',
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Barber Apprenticeship - Full Payment (5% Discount)',
              description: transferred_hours > 0
                ? `Adjusted tuition with ${transferred_hours} transfer hours credit. No weekly payments.`
                : 'Complete program tuition paid in full. No weekly payments required.',
            },
            unit_amount: discountedPrice * 100,
          },
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        program: 'barber-apprenticeship',
        programSlug: 'barber-apprenticeship',
        checkout_type: 'barber_pay_in_full',
        payment_type: 'pay_in_full',
        original_price_cents: (BARBER_PRICING.fullPrice * 100).toString(),
        adjusted_price_cents: (adjustedFullPrice * 100).toString(),
        discounted_price_cents: (discountedPrice * 100).toString(),
        applicationId: application_id || '',
        customerName: customer_name || '',
        customerPhone: customer_phone || '',
        transferHours: transferred_hours.toString(),
        hasHostShop: has_host_shop || '',
        hostShopName: host_shop_name || '',
      },
      allow_promotion_codes: true,
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
      pricing: {
        originalPrice: BARBER_PRICING.fullPrice,
        adjustedPrice: adjustedFullPrice,
        discountedPrice: discountedPrice,
        savings: adjustedFullPrice - discountedPrice,
      },
    });
  } catch (error) {
    console.error('Barber full checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
