/**
 * Sezzle Checkout API - V2
 * 
 * Creates a Sezzle checkout session for BNPL payments.
 * Sezzle splits the purchase into 4 interest-free payments over 6 weeks.
 * 
 * Flow:
 * 1. Create session with order details
 * 2. Return checkout_url to redirect customer
 * 3. Customer completes checkout on Sezzle
 * 4. Customer redirected back to complete_url
 * 5. Webhook notifies of order completion
 */

import { NextRequest, NextResponse } from 'next/server';
import { sezzle, SezzleSessionRequest } from '@/lib/sezzle/client';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { resolvePaymentAmount } from '@/lib/payments/resolve-amount';

export async function POST(request: NextRequest) {
  try {
    // Lazy config: if singleton missed env vars at module load (cold start),
    // try again now — handles key rotation and delayed env injection
    if (!sezzle.isConfigured() && process.env.SEZZLE_PUBLIC_KEY && process.env.SEZZLE_PRIVATE_KEY) {
      sezzle.configure({
        publicKey: process.env.SEZZLE_PUBLIC_KEY,
        privateKey: process.env.SEZZLE_PRIVATE_KEY,
        environment: (process.env.SEZZLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      });
      logger.info('[Sezzle] Late-configured from env vars (missed at module load)');
    }

    if (!sezzle.isConfigured()) {
      logger.error('[Sezzle] Checkout attempted but client not configured', {
        hasPubKey: !!process.env.SEZZLE_PUBLIC_KEY,
        hasPrivKey: !!process.env.SEZZLE_PRIVATE_KEY,
        env: process.env.SEZZLE_ENVIRONMENT || 'not set',
      });
      return NextResponse.json(
        { error: 'Sezzle is temporarily unavailable. Please select Card, Payment Plan, or another option above.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      // Customer info
      firstName,
      lastName,
      email,
      phone,
      dob, // YYYY-MM-DD format
      // Billing address
      billingAddress,
      billingCity,
      billingState,
      billingZip,
      // Shipping address (optional)
      shippingAddress,
      shippingCity,
      shippingState,
      shippingZip,
      // Order info
      programId,
      programSlug,
      programName,
      amount, // in dollars
      description,
      // Optional
      taxAmount,
      discountAmount,
      discountName,
      // Reference
      applicationId,
      enrollmentId,
      studentId,
      // Intent: AUTH (capture later) or CAPTURE (capture immediately)
      intent = 'CAPTURE',
      // Custom URLs
      cancelUrl,
      successUrl,
      // Barber-specific metadata
      transferHours,
      hoursPerWeek,
      hasHostShop,
      hostShopName,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, lastName, email, amount' },
        { status: 400 }
      );
    }

    // Server-side price resolution: required_amount from (program_slug, payment_option).
    // Client amount is treated as paid_amount, never as entitlement.
    const resolution = resolvePaymentAmount(
      programSlug,
      body.paymentOption, // 'deposit' | 'full' — client sends this
      amount,
      35,    // Sezzle platform minimum
      2500,  // Sezzle platform maximum
    );

    if (!resolution.ok) {
      return NextResponse.json({ error: resolution.error }, { status: resolution.status });
    }

    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    // Generate a unique reference ID
    const referenceId = `EFH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Determine redirect URLs - use custom if provided, otherwise default based on programSlug
    const defaultCancelUrl = programSlug === 'barber-apprenticeship' 
      ? `${siteUrl}/programs/barber-apprenticeship/apply?canceled=true&provider=sezzle`
      : `${siteUrl}/enroll/payment?canceled=true&provider=sezzle&ref=${referenceId}`;
    
    const defaultSuccessUrl = programSlug === 'barber-apprenticeship'
      ? `${siteUrl}/programs/barber-apprenticeship/apply/success?provider=sezzle&ref=${referenceId}`
      : `${siteUrl}/enroll/success?provider=sezzle&ref=${referenceId}`;

    // Build session request
    const sessionRequest: SezzleSessionRequest = {
      cancel_url: {
        href: cancelUrl || defaultCancelUrl,
        method: 'GET',
      },
      complete_url: {
        href: successUrl || defaultSuccessUrl,
        method: 'GET',
      },
      customer: {
        first_name: firstName,
        last_name: lastName,
        email,
        phone: phone || undefined,
        dob: dob || undefined,
        billing_address: billingAddress ? {
          street: billingAddress,
          city: billingCity || '',
          state: billingState || '',
          postal_code: billingZip || '',
          country_code: 'US',
        } : undefined,
        shipping_address: shippingAddress ? {
          street: shippingAddress,
          city: shippingCity || '',
          state: shippingState || '',
          postal_code: shippingZip || '',
          country_code: 'US',
        } : undefined,
      },
      order: {
        intent: intent as 'AUTH' | 'CAPTURE',
        reference_id: referenceId,
        description: description || `${programName || 'Program'} Enrollment`,
        order_amount: {
          amount_in_cents: Math.round(amount * 100),
          currency: 'USD',
        },
        items: programName ? [
          {
            name: programName,
            sku: programSlug || 'PROGRAM',
            quantity: 1,
            price: {
              amount_in_cents: Math.round(amount * 100),
              currency: 'USD',
            },
          },
        ] : undefined,
        tax_amount: taxAmount ? {
          amount_in_cents: Math.round(taxAmount * 100),
          currency: 'USD',
        } : undefined,
        discounts: discountAmount ? [
          {
            name: discountName || 'Discount',
            amount: {
              amount_in_cents: Math.round(discountAmount * 100),
              currency: 'USD',
            },
          },
        ] : undefined,
        metadata: {
          program_id: programId || '',
          program_slug: programSlug || '',
          application_id: applicationId || '',
          enrollment_id: enrollmentId || '',
          student_id: studentId || '',
          // Price resolution (server-authoritative)
          payment_option: resolution.paymentOption,
          required_amount_cents: String(Math.round(resolution.requiredAmount * 100)),
          paid_amount_cents: String(Math.round(resolution.paidAmount * 100)),
          overpay_amount_cents: String(Math.round(resolution.overpayAmount * 100)),
          // Barber-specific metadata
          transfer_hours: String(transferHours || 0),
          hours_per_week: String(hoursPerWeek || 40),
          has_host_shop: String(hasHostShop || ''),
          host_shop_name: hostShopName || '',
          customer_name: `${firstName} ${lastName}`,
          customer_email: email,
          customer_phone: phone || '',
        },
      },
    };

    // Create Sezzle session
    const session = await sezzle.createSession(sessionRequest);

    // Get checkout URL from response
    const checkoutUrl = session.order?.checkout_url || 
      session.links?.find(l => l.rel === 'checkout')?.href;

    if (!checkoutUrl) {
      throw new Error('No checkout URL returned from Sezzle');
    }

    // Store the Sezzle order reference in database
    if (supabase && applicationId) {
      await supabase
        .from('applications')
        .update({
          sezzle_session_uuid: session.uuid,
          sezzle_order_uuid: session.order?.uuid,
          sezzle_reference_id: referenceId,
          payment_provider: 'sezzle',
          payment_status: 'pending',
        })
        .eq('id', applicationId);
    }

    logger.info('[Sezzle] Checkout session created', {
      sessionUuid: session.uuid,
      orderUuid: session.order?.uuid,
      referenceId,
      paidAmount: resolution.paidAmount,
      requiredAmount: resolution.requiredAmount,
      overpayAmount: resolution.overpayAmount,
      paymentOption: resolution.paymentOption,
      email,
      programSlug,
      intent,
    });

    return NextResponse.json({
      ok: true,
      checkoutUrl,
      sessionUuid: session.uuid,
      orderUuid: session.order?.uuid,
      referenceId,
    });
  } catch (error) {
    const technicalMessage = error instanceof Error ? error.message : 'Unknown error';
    logger.error('[Sezzle] Checkout session creation failed:', { technicalMessage });
    return NextResponse.json(
      { error: 'Sezzle checkout could not be created. Please select Card, Payment Plan, or another option above.' },
      { status: 500 }
    );
  }
}

/**
 * GET - Check session/order status
 */
export async function GET(request: NextRequest) {
  try {
    // Lazy config re-check
    if (!sezzle.isConfigured() && process.env.SEZZLE_PUBLIC_KEY && process.env.SEZZLE_PRIVATE_KEY) {
      sezzle.configure({
        publicKey: process.env.SEZZLE_PUBLIC_KEY,
        privateKey: process.env.SEZZLE_PRIVATE_KEY,
        environment: (process.env.SEZZLE_ENVIRONMENT as 'sandbox' | 'production') || 'sandbox',
      });
    }

    if (!sezzle.isConfigured()) {
      logger.error('[Sezzle] Status check attempted but client not configured');
      return NextResponse.json(
        { error: 'Sezzle is not configured' },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const orderUuid = searchParams.get('order_uuid');
    const sessionUuid = searchParams.get('session_uuid');

    if (orderUuid) {
      const order = await sezzle.getOrder(orderUuid);
      return NextResponse.json({ ok: true, order });
    }

    if (sessionUuid) {
      const session = await sezzle.getSession(sessionUuid);
      return NextResponse.json({ ok: true, session });
    }

    return NextResponse.json(
      { error: 'Provide order_uuid or session_uuid' },
      { status: 400 }
    );
  } catch (error) {
    logger.error('Sezzle status check error:', error);
    const message = error instanceof Error ? error.message : 'Failed to check status';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
