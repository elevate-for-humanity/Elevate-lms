/**
 * Affirm Webhook Handler
 * 
 * Handles webhook events from Affirm for charge status updates.
 * Configure webhook URL in Affirm merchant dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
    const payload = await request.text();
    
    // TODO: Verify webhook signature if Affirm provides one
    // const signature = request.headers.get('affirm-signature');
    
    const event: AffirmWebhookEvent = JSON.parse(payload);

    logger.info('Affirm webhook received', {
      type: event.type,
      chargeId: event.data?.id,
      orderId: event.data?.order_id,
    });

    const supabase = await createClient();

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
    await supabase
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
    await supabase
      .from('applications')
      .update({
        payment_status: 'completed',
        payment_amount: amount / 100,
        payment_completed_at: new Date().toISOString(),
      })
      .eq('affirm_order_id', order_id);

    // Also update barber_subscriptions if this is a barber enrollment
    // The record should already exist from the capture route
    await supabase
      .from('barber_subscriptions')
      .update({
        status: 'active',
        amount_paid_at_checkout: amount / 100,
      })
      .eq('payment_method', 'affirm')
      .like('created_at', `${new Date().toISOString().split('T')[0]}%`);
  }
}

async function handleChargeVoided(event: AffirmWebhookEvent, supabase: any) {
  const { id, order_id } = event.data;
  
  logger.info('Affirm charge voided via webhook', {
    chargeId: id,
    orderId: order_id,
  });

  if (order_id) {
    await supabase
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
    await supabase
      .from('applications')
      .update({
        payment_status: 'refunded',
        refund_amount: amount / 100,
        refunded_at: new Date().toISOString(),
      })
      .eq('affirm_order_id', order_id);
  }
}
