/**
 * Affirm Capture/Authorize API
 * 
 * Called after customer completes Affirm checkout.
 * Affirm redirects here with checkout_token and order_id.
 * 
 * Security: All metadata is loaded from checkout_contexts table by order_id.
 * URL params (except checkout_token and order_id) are ignored to prevent tampering.
 */

import { NextRequest, NextResponse } from 'next/server';
import { affirm } from '@/lib/affirm/client';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { BARBER_PRICING } from '@/lib/programs/pricing';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const checkoutToken = searchParams.get('checkout_token');
  const orderId = searchParams.get('order_id');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const supabase = createAdminClient();

  // DIAGNOSTIC: Log all params received
  logger.info('Affirm capture called', {
    hasCheckoutToken: !!checkoutToken,
    hasOrderId: !!orderId,
    allParams: Object.fromEntries(searchParams.entries()),
  });

  // DIAGNOSTIC: Mark context with error if params missing (proves capture was hit)
  if (orderId && !checkoutToken) {
    await supabase
      .from('checkout_contexts')
      .update({
        status: 'failed',
        provider_response: { error: 'missing_checkout_token', received_params: Object.fromEntries(searchParams.entries()) },
      })
      .eq('order_id', orderId)
      .eq('provider', 'affirm');
    
    logger.error('Affirm capture missing checkout_token', { orderId });
    return NextResponse.redirect(
      `${siteUrl}/programs/barber-apprenticeship/apply?canceled=true&provider=affirm`
    );
  }

  if (!orderId) {
    logger.error('Affirm capture missing order_id');
    return NextResponse.redirect(
      `${siteUrl}/programs/barber-apprenticeship/apply?error=missing_order`
    );
  }

  if (!checkoutToken) {
    logger.info('Affirm checkout canceled or no token', { orderId });
    return NextResponse.redirect(
      `${siteUrl}/programs/barber-apprenticeship/apply?canceled=true&provider=affirm`
    );
  }

  // Load checkout context from DB (server-side, tamper-proof)
  const { data: context, error: contextError } = await supabase
    .from('checkout_contexts')
    .select('*')
    .eq('provider', 'affirm')
    .eq('order_id', orderId)
    .eq('status', 'pending')
    .single();

  if (contextError || !context) {
    logger.error('Checkout context not found or already used', { orderId, error: contextError });
    return NextResponse.redirect(
      `${siteUrl}/programs/barber-apprenticeship/apply?error=invalid_session`
    );
  }

  // Check expiration
  if (new Date(context.expires_at) < new Date()) {
    logger.error('Checkout context expired', { orderId, expiresAt: context.expires_at });
    await supabase
      .from('checkout_contexts')
      .update({ status: 'expired' })
      .eq('id', context.id);
    return NextResponse.redirect(
      `${siteUrl}/programs/barber-apprenticeship/apply?error=session_expired`
    );
  }

  try {
    // Authorize the charge with Affirm
    const result = await affirm.authorizeCharge(checkoutToken, orderId);

    logger.info('Affirm charge authorized', {
      chargeId: result.id,
      orderId,
      contextId: context.id,
      amount: result.amount,
      program: context.program_slug,
    });

    // Mark context as completed and store provider response
    await supabase
      .from('checkout_contexts')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        provider_charge_id: result.id,
        provider_response: result,
      })
      .eq('id', context.id);

    // Create barber_subscriptions record using DB context (not URL params)
    if (context.program_slug === 'barber-apprenticeship' && context.customer_email) {
      try {
        const amountPaidCents = result.amount || 0;
        const totalHoursRequired = BARBER_PRICING.totalHoursRequired || 2000;
        const hoursRemaining = Math.max(0, totalHoursRequired - (context.transfer_hours || 0));
        const weeksRemaining = Math.ceil(hoursRemaining / (context.hours_per_week || 40));
        
        const { data: subscription, error: subError } = await supabase
          .from('barber_subscriptions')
          .insert({
            customer_email: context.customer_email,
            customer_name: context.customer_name || '',
            status: 'active',
            full_tuition_amount: BARBER_PRICING.fullPrice,
            amount_paid_at_checkout: amountPaidCents / 100,
            remaining_balance: Math.max(0, (BARBER_PRICING.fullPrice * 100 - amountPaidCents) / 100),
            payment_method: 'affirm',
            bnpl_provider: 'affirm',
            fully_paid: amountPaidCents >= BARBER_PRICING.fullPrice * 100,
            weekly_payment_cents: 0,
            weeks_remaining: weeksRemaining,
            hours_per_week: context.hours_per_week || 40,
            transferred_hours_verified: context.transfer_hours || 0,
            payment_model: 'bnpl_affirm',
            created_at: new Date().toISOString(),
          })
          .select('id')
          .single();

        if (subError) {
          logger.error('Failed to create barber_subscriptions:', subError);
        } else {
          logger.info('Barber subscription created for Affirm payment', {
            subscriptionId: subscription?.id,
            contextId: context.id,
            chargeId: result.id,
            customerEmail: context.customer_email,
            amountPaidCents,
            transferHours: context.transfer_hours,
            hoursPerWeek: context.hours_per_week,
          });
        }
      } catch (dbError) {
        logger.error('Failed to create barber_subscriptions record:', dbError);
      }
    }

    // Redirect to success page (minimal params - no sensitive data)
    const successUrl = new URL(`${siteUrl}/programs/barber-apprenticeship/apply/success`);
    successUrl.searchParams.set('provider', 'affirm');
    successUrl.searchParams.set('ref', context.id);

    return NextResponse.redirect(successUrl.toString());
  } catch (error) {
    logger.error('Affirm authorization failed:', error);
    
    // Mark context as failed
    await supabase
      .from('checkout_contexts')
      .update({ status: 'failed' })
      .eq('id', context.id);
    
    const errorUrl = new URL(`${siteUrl}/programs/barber-apprenticeship/apply`);
    errorUrl.searchParams.set('error', 'affirm_failed');
    errorUrl.searchParams.set('message', error instanceof Error ? error.message : 'Authorization failed');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}
