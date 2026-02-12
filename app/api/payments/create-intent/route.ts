import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency = 'usd', description } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      logger.error('[Payment Intent] Stripe not configured');
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    // Import Stripe dynamically
    const Stripe = (await import('stripe')).default;
    const stripe = getStripe();

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      description: description || 'Course payment',
      metadata: {
        userId: user.id,
        userEmail: user.email || '',
      },
    });

    logger.info('[Payment Intent] Created:', {
      userId: user.id,
      amount,
      intentId: paymentIntent.id,
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      intentId: paymentIntent.id,
    });
  } catch (error: any) {
    logger.error('[Payment Intent] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
