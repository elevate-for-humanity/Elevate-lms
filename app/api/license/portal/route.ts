import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { applyRateLimit } from '@/lib/api/withRateLimit';

/**
 * POST /api/license/portal
 * 
 * Creates a Stripe Customer Portal session for billing management.
 * Customers can:
 * - Update payment method
 * - Switch between monthly/annual
 * - Cancel subscription
 * - View invoices
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    const body = await request.json();
    const { customerId } = body;

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      );
    }

    const origin = request.nextUrl.origin;
    const stripe = getStripe();

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin}/account/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error('Portal session error:', error);
    return NextResponse.json(
      { error: 'Failed to create portal session' },
      { status: 500 }
    );
  }
}
