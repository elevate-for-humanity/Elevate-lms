import { logger } from '@/lib/logger';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

import { auditMutation } from '@/lib/api/withAudit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

async function _POST(request: NextRequest) {
  let body: string;
  let signature: string | null;

  try {
    body = await request.text();
    signature = request.headers.get('stripe-signature');
  } catch (e) {
    logger.error('[license-webhook] Failed to read request:', e);
    return NextResponse.json({ error: 'Failed to read request' }, { status: 400 });
  }

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    // Use dedicated license webhook secret, fall back to generic
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_LICENSE
      || process.env.STRIPE_WEBHOOK_SECRET
      || '';
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error('[license-webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const licenseId = session.metadata?.license_id;
    const customerId = session.customer as string | null;

    if (licenseId) {
      try {
        const supabase = createAdminClient();
        if (!supabase) {
          logger.error('[license-webhook] Supabase client not available');
          return NextResponse.json({ received: true, warning: 'db_unavailable' });
        }

        const updateData: Record<string, any> = {
          status: 'active',
          updated_at: new Date().toISOString(),
        };
        if (customerId) updateData.stripe_customer_id = customerId;

        const { error } = await supabase
          .from('licenses')
          .update(updateData)
          .eq('id', licenseId)
          .select('id, stripe_customer_id, updated_at');

        if (error) {
          logger.error('[license-webhook] DB update error:', error);
        }
      } catch (dbErr) {
        logger.error('[license-webhook] DB operation failed:', dbErr);
      }
    }
  }

  return NextResponse.json({ received: true });
}
export const POST = withRuntime(withApiAudit('/api/license/webhook', _POST, { actor_type: 'webhook', skip_body: true }));
