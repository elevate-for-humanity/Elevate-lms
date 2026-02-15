export const runtime = 'nodejs';
export const maxDuration = 60;

import Stripe from 'stripe';
import { NextRequest, NextResponse } from 'next/server';
import { parseBody } from '@/lib/api-helpers';
import { apiAuthGuard } from '@/lib/authGuards';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import {
  createCoursePaymentIntent,
  createSubscriptionPaymentIntent,
  confirmPayment,
  processRefund,
  getPaymentHistory,
  getPaymentMethods,
  attachPaymentMethod,
  detachPaymentMethod,
  setDefaultPaymentMethod,
  createSubscription,
  cancelSubscription,
  verifyWebhookSignature,
  handleStripeWebhook,
} from '@/lib/payments';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * Verify that the Stripe customer ID belongs to the authenticated user.
 * Prevents IDOR attacks on payment method operations.
 */
async function verifyCustomerOwnership(userId: string, customerId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();
  
  return profile?.stripe_customer_id === customerId;
}

/**
 * Verify that the payment belongs to the authenticated user.
 * Prevents unauthorized refund operations.
 */
async function verifyPaymentOwnership(userId: string, paymentId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: payment } = await supabase
    .from('payments')
    .select('user_id')
    .eq('id', paymentId)
    .single();
  
  return payment?.user_id === userId;
}

/**
 * Verify that the subscription belongs to the authenticated user.
 * Prevents unauthorized subscription cancellation.
 */
async function verifySubscriptionOwnership(userId: string, subscriptionId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .single();
  
  return subscription?.user_id === userId;
}

/**
 * Get the user's Stripe customer ID.
 * Returns null if user has no associated Stripe customer.
 */
async function getUserStripeCustomerId(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();
  
  return profile?.stripe_customer_id || null;
}

export async function GET(request: NextRequest) {
  try {
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'history':
        const limit = parseInt(searchParams.get('limit') || '50', 10);
        const history = await getPaymentHistory(user.id, limit);
        return NextResponse.json({ payments: history });

      case 'methods':
        const customerId = searchParams.get('customerId');
        if (!customerId) {
          return NextResponse.json(
            { error: 'customerId required' },
            { status: 400 }
          );
        }
        // Verify the customer belongs to the authenticated user
        if (!(await verifyCustomerOwnership(user.id, customerId))) {
          return NextResponse.json(
            { error: 'Access denied: customer does not belong to you' },
            { status: 403 }
          );
        }
        const methods = await getPaymentMethods(customerId);
        return NextResponse.json({ methods });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) { /* Error handled silently */ 
    logger.error('Payments GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await parseBody<Record<string, any>>(request);
    const { action } = body;

    // Webhook handling (no auth required)
    if (action === 'webhook') {
      const signature = request.headers.get('stripe-signature');
      if (!signature) {
        return NextResponse.json(
          { error: 'Missing signature' },
          { status: 400 }
        );
      }

      const payload = await request.text();
      const event = verifyWebhookSignature(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      await handleStripeWebhook(event);
      return NextResponse.json({ received: true });
    }

    // All other actions require auth
    const authResult = await apiAuthGuard({ requireAuth: true });
    if (!authResult.authorized) {
      return NextResponse.json({ error: authResult.error }, { status: 401 });
    }

    const { user } = authResult;

    switch (action) {
      case 'create-intent':
        const { courseId, amount, currency, referralCode } = body;
        if (!courseId || !amount) {
          return NextResponse.json(
            { error: 'courseId and amount required' },
            { status: 400 }
          );
        }
        const intent = await createCoursePaymentIntent(
          user.id,
          courseId,
          amount,
          currency,
          referralCode
        );
        return NextResponse.json({ intent });

      case 'create-subscription-intent':
        const { planId, subscriptionAmount, subscriptionCurrency } = body;
        if (!planId || !subscriptionAmount) {
          return NextResponse.json(
            { error: 'planId and amount required' },
            { status: 400 }
          );
        }
        const subIntent = await createSubscriptionPaymentIntent(
          user.id,
          planId,
          subscriptionAmount,
          subscriptionCurrency
        );
        return NextResponse.json({ intent: subIntent });

      case 'confirm':
        const { paymentIntentId } = body;
        if (!paymentIntentId) {
          return NextResponse.json(
            { error: 'paymentIntentId required' },
            { status: 400 }
          );
        }
        const result = await confirmPayment(paymentIntentId);
        return NextResponse.json({ result });

      case 'refund':
        const { paymentId, refundAmount, reason } = body;
        if (!paymentId) {
          return NextResponse.json(
            { error: 'paymentId required' },
            { status: 400 }
          );
        }
        // Verify the payment belongs to the authenticated user
        if (!(await verifyPaymentOwnership(user.id, paymentId))) {
          return NextResponse.json(
            { error: 'Access denied: payment does not belong to you' },
            { status: 403 }
          );
        }
        const refund = await processRefund(paymentId, refundAmount, reason);
        return NextResponse.json({ refund });

      case 'attach-method':
        const { paymentMethodId, customerId: attachCustomerId } = body;
        if (!paymentMethodId || !attachCustomerId) {
          return NextResponse.json(
            { error: 'paymentMethodId and customerId required' },
            { status: 400 }
          );
        }
        // Verify the customer belongs to the authenticated user
        if (!(await verifyCustomerOwnership(user.id, attachCustomerId))) {
          return NextResponse.json(
            { error: 'Access denied: customer does not belong to you' },
            { status: 403 }
          );
        }
        await attachPaymentMethod(paymentMethodId, attachCustomerId);
        return NextResponse.json({ success: true });

      case 'detach-method':
        const { methodId } = body;
        if (!methodId) {
          return NextResponse.json(
            { error: 'methodId required' },
            { status: 400 }
          );
        }
        // Verify the payment method belongs to the authenticated user's customer
        if (!stripe) {
          return NextResponse.json(
            { error: 'Payment service not configured' },
            { status: 503 }
          );
        }
        const userCustomerId = await getUserStripeCustomerId(user.id);
        if (!userCustomerId) {
          return NextResponse.json(
            { error: 'No payment profile found' },
            { status: 400 }
          );
        }
        const paymentMethodDetails = await stripe.paymentMethods.retrieve(methodId);
        if (paymentMethodDetails.customer !== userCustomerId) {
          return NextResponse.json(
            { error: 'Access denied: payment method does not belong to you' },
            { status: 403 }
          );
        }
        await detachPaymentMethod(methodId);
        return NextResponse.json({ success: true });

      case 'set-default':
        const { defaultCustomerId, defaultMethodId } = body;
        if (!defaultCustomerId || !defaultMethodId) {
          return NextResponse.json(
            { error: 'customerId and methodId required' },
            { status: 400 }
          );
        }
        // Verify the customer belongs to the authenticated user
        if (!(await verifyCustomerOwnership(user.id, defaultCustomerId))) {
          return NextResponse.json(
            { error: 'Access denied: customer does not belong to you' },
            { status: 403 }
          );
        }
        await setDefaultPaymentMethod(defaultCustomerId, defaultMethodId);
        return NextResponse.json({ success: true });

      case 'create-subscription':
        const { priceId, paymentMethod } = body;
        if (!priceId) {
          return NextResponse.json(
            { error: 'priceId required' },
            { status: 400 }
          );
        }
        const subscription = await createSubscription(
          user.id,
          priceId,
          paymentMethod
        );
        return NextResponse.json({ subscription });

      case 'cancel-subscription':
        const { subscriptionId, immediately } = body;
        if (!subscriptionId) {
          return NextResponse.json(
            { error: 'subscriptionId required' },
            { status: 400 }
          );
        }
        // Verify the subscription belongs to the authenticated user
        if (!(await verifySubscriptionOwnership(user.id, subscriptionId))) {
          return NextResponse.json(
            { error: 'Access denied: subscription does not belong to you' },
            { status: 403 }
          );
        }
        await cancelSubscription(subscriptionId, immediately);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) { /* Error handled silently */ 
    logger.error('Payments POST error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to process payment',
      },
      { status: 500 }
    );
  }
}
