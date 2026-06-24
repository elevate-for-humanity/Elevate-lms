export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

const stripeKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeKey
  ? new Stripe(stripeKey, {
      apiVersion: '2025-10-29.clover',
    })
  : null;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
  supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export async function POST(request: NextRequest) {
  if (!stripe || !supabase) {
    return NextResponse.json(
      { error: 'Stripe or Supabase not configured' },
      { status: 503 }
    );
  }

  try {
    const body = await parseBody<Record<string, any>>(request);
    const { priceId, userId, userEmail, userName } = body;

    if (!priceId || !userId || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields: priceId, userId, userEmail' },
        { status: 400 }
      );
    }

    // Verify price exists in database
    const { data: price, error: priceError } = await supabase
      .from('store_prices')
      .select('*, store_products(*)')
      .eq('stripe_price_id', priceId)
      .eq('is_active', true)
      .single();

    if (priceError || !price) {
      logger.error('Price not found:', priceError);
      return NextResponse.json({ error: 'Invalid price ID' }, { status: 400 });
    }

    // Get or create Stripe customer
    let stripeCustomerId: string;

    const { data: existingBilling } = await supabase
      .from('customer_billing')
      .select('stripe_customer_id')
      .eq('user_id', userId)
      .single();

    if (existingBilling?.stripe_customer_id) {
      stripeCustomerId = existingBilling.stripe_customer_id;
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: userEmail,
        name: userName || undefined,
        metadata: {
          user_id: userId,
        },
      });

      stripeCustomerId = customer.id;

      // Save to database
      await supabase.from('customer_billing').insert({
        user_id: userId,
        stripe_customer_id: stripeCustomerId,
        email: userEmail,
        name: userName,
      });

      logger.info(`Created Stripe customer: ${stripeCustomerId}`);
    }

    // Check for existing active subscription
    const { data: existingSubscription } = await supabase
      .from('store_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['trialing', 'active'])
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Create Stripe Checkout Session (subscription mode)
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/store/subscriptions?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/store/subscriptions?canceled=true`,
      metadata: {
        user_id: userId,
        price_id: priceId,
        product_id: price.store_products.id,
        subscription_type: 'store',
      },
      subscription_data: {
        metadata: {
          user_id: userId,
          product_id: price.store_products.id,
        },
      },
    });

    logger.info(`Created subscription checkout session: ${session.id}`);

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) { /* Error handled silently */ 
    logger.error(
      'Error creating subscription checkout:',
      error instanceof Error ? error : new Error(String(error))
    );
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create checkout session',
      },
      { status: 500 }
    );
  }
}
