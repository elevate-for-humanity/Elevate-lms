/**
 * Affirm Checkout API
 * 
 * Returns configuration for client-side Affirm checkout.
 * Affirm checkout is initiated client-side via their JS SDK.
 * 
 * Flow:
 * 1. Client calls this API to get checkout config
 * 2. Server stores metadata in checkout_contexts table (not URL params)
 * 3. Client loads Affirm JS SDK and calls affirm.checkout(config)
 * 4. Customer completes checkout on Affirm
 * 5. Affirm redirects to /api/affirm/capture with checkout_token + order_id
 * 6. Capture route loads metadata from DB by order_id
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { getAffirmCheckoutConfig, affirm } from '@/lib/affirm/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Check if Affirm is configured
    if (!affirm.isConfigured()) {
      logger.error('[Affirm] Checkout attempted but client not configured', {
        hasPubKey: !!process.env.AFFIRM_PUBLIC_KEY,
        hasNextPubKey: !!process.env.NEXT_PUBLIC_AFFIRM_PUBLIC_KEY,
        hasPrivKey: !!process.env.AFFIRM_PRIVATE_KEY,
      });
      return NextResponse.json(
        { error: 'Affirm is temporarily unavailable. Please select Card, Payment Plan, or another option above.' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      programId,
      programSlug,
      programName,
      amount, // in dollars
      applicationId,
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

    // Affirm minimum is $50
    if (amount < 50) {
      return NextResponse.json(
        { error: 'Affirm requires a minimum purchase of $50' },
        { status: 400 }
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
    const orderId = `EFH-AFFIRM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store checkout context in DB (server-side, not URL params)
    const supabase = createAdminClient();
    const { data: context, error: contextError } = await supabase
      .from('checkout_contexts')
      .insert({
        provider: 'affirm',
        order_id: orderId,
        customer_email: email,
        customer_name: `${firstName} ${lastName}`,
        customer_phone: phone || null,
        program_slug: programSlug || 'barber-apprenticeship',
        application_id: applicationId || null,
        transfer_hours: transferHours || 0,
        hours_per_week: hoursPerWeek || 40,
        has_host_shop: hasHostShop || null,
        host_shop_name: hostShopName || null,
        amount_cents: Math.round(amount * 100),
        payment_type: 'bnpl',
        status: 'pending',
      })
      .select('id')
      .single();

    if (contextError) {
      logger.error('Failed to create checkout context:', contextError);
      return NextResponse.json(
        { error: 'Failed to initialize checkout' },
        { status: 500 }
      );
    }

    // Only pass order_id in URL - all metadata loaded from DB in capture
    const checkoutConfig = getAffirmCheckoutConfig({
      amount: Math.round(amount * 100),
      orderId,
      programName: programName || 'Barber Apprenticeship Program',
      customerEmail: email,
      customerName: `${firstName} ${lastName}`,
      customerPhone: phone,
      successUrl: `${siteUrl}/api/affirm/capture?order_id=${orderId}`,
      cancelUrl: `${siteUrl}/programs/barber-apprenticeship/apply?canceled=true&provider=affirm`,
    });

    logger.info('Affirm checkout context created', {
      contextId: context.id,
      orderId,
      amount,
      email,
      programSlug,
    });

    return NextResponse.json({
      ok: true,
      publicKey: affirm.getPublicKey(),
      checkoutConfig,
      orderId,
      contextId: context.id,
      affirmJsUrl: 'https://cdn1.affirm.com/js/v2/affirm.js',
    });
  } catch (error) {
    logger.error('Affirm checkout config error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create Affirm checkout config';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
