

import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { randomBytes } from 'node:crypto';
import { logAuditEvent, AuditActions } from '@/lib/audit';
import { toErrorMessage } from '@/lib/safe';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const maxDuration = 60;

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err: any) {
    // Error logged
    return NextResponse.json({ error: 'Webhook processing failed.' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only process marketplace purchases
    if (session.metadata?.type !== 'marketplace') {
      return NextResponse.json({ received: true });
    }

    const productId = session.metadata.product_id;
    const creatorId = session.metadata.creator_id;
    const amountTotal = session.amount_total || 0;

    // Fetch creator to get revenue split
    const { data: creator } = await supabase
      .from('marketplace_creators')
      .select('revenue_split')
      .eq('id', creatorId)
      .single();

    const revenueSplit = creator?.revenue_split || 0.7;
    const creatorEarnings = Math.floor(amountTotal * revenueSplit);
    const platformEarnings = amountTotal - creatorEarnings;

    // Generate download token
    const downloadToken = randomBytes(32).toString('hex');
    const downloadExpiresAt = new Date();
    downloadExpiresAt.setDate(downloadExpiresAt.getDate() + 30); // 30 days

    // Record sale
    const { error } = await supabase.from('marketplace_sales').insert({
      product_id: productId,
      creator_id: creatorId,
      buyer_email: session.customer_details?.email || '',
      amount_cents: amountTotal,
      creator_earnings_cents: creatorEarnings,
      platform_earnings_cents: platformEarnings,
      stripe_session_id: session.id,
      stripe_payment_intent_id: session.payment_intent as string,
      download_token: downloadToken,
      download_expires_at: downloadExpiresAt.toISOString(),
    });

    if (error) {
      // Error: $1
      return NextResponse.json(
        { error: toErrorMessage(error) },
        { status: 500 }
      );
    }

    // Audit log
    await logAuditEvent({
      action: AuditActions.MARKETPLACE_SALE_COMPLETED,
      resourceType: 'marketplace_sale',
      resourceId: session.id,
      metadata: {
        product_id: productId,
        creator_id: creatorId,
        amount_cents: amountTotal,
        creator_earnings_cents: creatorEarnings,
        platform_earnings_cents: platformEarnings,
      },
    });

    logger.info('Marketplace sale recorded:', {
      productId,
      creatorId,
      amountTotal,
      creatorEarnings,
      platformEarnings,
    });
  }

  return NextResponse.json({ received: true });
}
