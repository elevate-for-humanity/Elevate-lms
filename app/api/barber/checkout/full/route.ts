// POLICY: Tuition is fixed. Transfer hours NEVER affect price.
//         Only custom_setup_fee is user-influenced and is server-clamped.
import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { BARBER_PRICING } from '@/lib/programs/pricing';
import {
  TUITION_CENTS,
  TUITION_DOLLARS,
  PAYMENT_TERM_WEEKS,
  remainingHoursDisplay,
} from '@/lib/barber/pricing';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';

/**
 * POST /api/barber/checkout/full
 * 
 * Pay in full checkout for Barber Apprenticeship.
 * Full payment — no discount.
 */
async function _POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(request);
    if (auth.error) return auth.error;

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

    // ── Pricing authority ─────────────────────────────────────────────────────
    // Tuition is TUITION_CENTS (498000 = $4,980). Fixed. No exceptions.
    // Transfer hours do not affect this value.
    // ─────────────────────────────────────────────────────────────────────────

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
              name: 'Barber Apprenticeship - Full Payment',
              description: `Complete program tuition ($${TUITION_DOLLARS.toLocaleString()}) paid in full. No weekly payments required.`,
            },
            unit_amount: TUITION_CENTS, // fixed — never client-derived
          },
          quantity: 1,
        },
      ],
      success_url: finalSuccessUrl,
      cancel_url: finalCancelUrl,
      metadata: {
        // ── Canonical keys read by barber webhook handler ──
        kind: 'program_enrollment',
        program: 'barber-apprenticeship',
        program_slug: 'barber-apprenticeship',
        program_id: BARBER_PROGRAM_ID,
        course_id: BARBER_COURSE_ID,
        student_id: application_id || '',
        application_id: application_id || '',
        payment_type: 'pay_in_full',
        checkout_type: 'barber_pay_in_full',
        pricing_policy: 'fixed_tuition_v1',
        // ── Amounts (all from TUITION_CENTS — never client-derived) ──
        checkout_amount_cents: TUITION_CENTS.toString(),
        original_price_cents: TUITION_CENTS.toString(),
        adjusted_price_cents: TUITION_CENTS.toString(),
        weekly_payment_cents: '0',
        weeks_remaining: PAYMENT_TERM_WEEKS.toString(),
        // ── Transfer hours — display/ops only, cannot affect price ──
        transfer_hours_claimed: transferred_hours.toString(),
        remaining_hours: remainingHoursDisplay(transferred_hours).toString(),
        // ── Customer context ──
        applicationId: application_id || '',
        customerName: customer_name || '',
        customerPhone: customer_phone || '',
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
    logger.error('Barber full checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: 'Internal server error' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/barber/checkout/full', _POST);
