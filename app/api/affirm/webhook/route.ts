/**
 * Affirm Webhook Handler
 * 
 * Handles webhook events from Affirm for charge status updates.
 * Configure webhook URL in Affirm merchant dashboard.
 */

export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

interface AffirmWebhookEvent {
  type: string;
  data: {
    id: string;
    order_id: string;
    amount: number;
    currency: string;
    status: string;
    created: string;
    [key: string]: any;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook authenticity via shared secret header
    const webhookSecret = process.env.AFFIRM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const providedSecret = request.headers.get('x-affirm-webhook-secret') 
        || request.headers.get('authorization')?.replace('Bearer ', '');
      if (providedSecret !== webhookSecret) {
        logger.warn('Affirm webhook: invalid secret');
        return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
      }
    }

    const payload = await request.text();
    const event: AffirmWebhookEvent = JSON.parse(payload);

    // Reject if missing required fields
    if (!event.type || !event.data?.order_id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    logger.info('Affirm webhook received', {
      type: event.type,
      chargeId: event.data?.id,
      orderId: event.data?.order_id,
    });

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Validate the order_id exists in our system before processing
    const { data: existingApp } = await db
      .from('applications')
      .select('id, affirm_order_id')
      .eq('affirm_order_id', event.data.order_id)
      .single();

    if (!existingApp) {
      logger.warn('Affirm webhook: unknown order_id', { orderId: event.data.order_id });
      return NextResponse.json({ error: 'Unknown order' }, { status: 404 });
    }

    switch (event.type) {
      case 'charge.authorized':
        await handleChargeAuthorized(event, supabase);
        break;
      case 'charge.captured':
        await handleChargeCaptured(event, supabase);
        break;
      case 'charge.voided':
        await handleChargeVoided(event, supabase);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event, supabase);
        break;
      default:
        logger.info('Unhandled Affirm webhook event', { type: event.type });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Affirm webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleChargeAuthorized(event: AffirmWebhookEvent, supabase: any) {
  const { id, order_id, amount } = event.data;
  
  logger.info('Affirm charge authorized via webhook', {
    chargeId: id,
    orderId: order_id,
    amount,
  });

  // Update application status
  if (order_id) {
    await db
      .from('applications')
      .update({
        affirm_charge_id: id,
        payment_status: 'authorized',
      })
      .eq('affirm_order_id', order_id);
  }
}

async function handleChargeCaptured(event: AffirmWebhookEvent, supabase: any) {
  const { id, order_id, amount } = event.data;
  
  logger.info('Affirm charge captured via webhook', {
    chargeId: id,
    orderId: order_id,
    amount,
  });

  // Update application status
  if (order_id) {
    await db
      .from('applications')
      .update({
        payment_status: 'completed',
        payment_amount: amount / 100,
        payment_completed_at: new Date().toISOString(),
      })
      .eq('affirm_order_id', order_id);

    // Also update barber_subscriptions if this is a barber enrollment
    // Match by customer_email from the application record for reliable lookup
    const { data: app } = await db
      .from('applications')
      .select('customer_email')
      .eq('affirm_order_id', order_id)
      .single();

    if (app?.customer_email) {
      await db
        .from('barber_subscriptions')
        .update({
          status: 'active',
          amount_paid_at_checkout: amount / 100,
        })
        .eq('payment_method', 'affirm')
        .eq('customer_email', app.customer_email);
    }
  }
}

async function handleChargeVoided(event: AffirmWebhookEvent, supabase: any) {
  const { id, order_id } = event.data;
  
  logger.info('Affirm charge voided via webhook', {
    chargeId: id,
    orderId: order_id,
  });

  if (order_id) {
    await db
      .from('applications')
      .update({
        payment_status: 'voided',
      })
      .eq('affirm_order_id', order_id);
  }
}

async function handleChargeRefunded(event: AffirmWebhookEvent, supabase: any) {
  const { id, order_id, amount } = event.data;
  
  logger.info('Affirm charge refunded via webhook', {
    chargeId: id,
    orderId: order_id,
    amount,
  });

  if (order_id) {
    await db
      .from('applications')
      .update({
        payment_status: 'refunded',
        refund_amount: amount / 100,
        refunded_at: new Date().toISOString(),
      })
      .eq('affirm_order_id', order_id);
  }
}
