// PUBLIC ROUTE: Affirm payment capture — called by Affirm redirect
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
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

async function _GET(request: NextRequest) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
// Lazy config: re-read env vars if missed at module load
  affirm.tryLateConfig();

  const searchParams = request.nextUrl.searchParams;
  const checkoutToken = searchParams.get('checkout_token');
  const orderId = searchParams.get('order_id');

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
  const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

  // DIAGNOSTIC: Log all params received
  logger.info('Affirm capture called', {
    hasCheckoutToken: !!checkoutToken,
    hasOrderId: !!orderId,
    allParams: Object.fromEntries(searchParams.entries()),
  });

  // Fallback redirect path when we don't have context yet
  const fallbackPath = '/programs';

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
    return NextResponse.redirect(`${siteUrl}${fallbackPath}?canceled=true&provider=affirm`);
  }

  if (!orderId) {
    logger.error('Affirm capture missing order_id');
    return NextResponse.redirect(`${siteUrl}${fallbackPath}?error=missing_order`);
  }

  if (!checkoutToken) {
    logger.info('Affirm checkout canceled or no token', { orderId });
    return NextResponse.redirect(`${siteUrl}${fallbackPath}?canceled=true&provider=affirm`);
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
    return NextResponse.redirect(`${siteUrl}${fallbackPath}?error=invalid_session`);
  }

  // Use context's program slug for redirects from here on
  const programSlug = context.program_slug || 'barber-apprenticeship';
  const programPath = `/programs/${programSlug}`;

  // Check expiration
  if (new Date(context.expires_at) < new Date()) {
    logger.error('Checkout context expired', { orderId, expiresAt: context.expires_at });
    await supabase
      .from('checkout_contexts')
      .update({ status: 'expired' })
      .eq('id', context.id);
    return NextResponse.redirect(`${siteUrl}${programPath}?error=session_expired`);
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

    // Mark context as authorized — enrollment happens on webhook charge.captured
    await supabase
      .from('checkout_contexts')
      .update({
        status: 'authorized',
        completed_at: new Date().toISOString(),
        provider_charge_id: result.id,
        provider_response: result,
      })
      .eq('id', context.id);

    // Redirect to public success page (no auth required)
    const successUrl = new URL(`${siteUrl}${programPath}/apply/success`);
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
    
    const errorUrl = new URL(`${siteUrl}${programPath}`);
    errorUrl.searchParams.set('error', 'affirm_failed');
    errorUrl.searchParams.set('message', 'Authorization failed');
    
    return NextResponse.redirect(errorUrl.toString());
  }
}
export const GET = withApiAudit('/api/affirm/capture', _GET);
