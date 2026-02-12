export const runtime = 'nodejs';
export const maxDuration = 60;

import { getStripe, stripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { parseBody, getErrorMessage } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { getRAPIDSMetadata, isRAPIDSProgram } from '@/lib/compliance/rapids-config';



export async function POST(request: NextRequest) {
  // Log for debugging (remove in production)

  if (!stripe) {
    return NextResponse.json(
      {
        error:
          'Payment system not configured. Please contact support at 317-314-3757',
        debug:
          process.env.NODE_ENV === 'development'
            ? 'STRIPE_SECRET_KEY not set'
            : undefined,
      },
      { status: 503 }
    );
  }

  try {
    const {
      programName,
      programSlug,
      price,
      paymentType = 'full',
      applicationId,
    } = await request.json();

    // Enable payment methods (Klarna/Afterpay/Zip for BNPL)
    const paymentMethods = [
      'card', // Credit/debit cards
      'klarna', // Klarna (4 payments, up to $1,000)
      'afterpay_clearpay', // Afterpay (4 payments, up to $1,000)
      'zip', // Zip (pay in 4)
      'us_bank_account', // ACH Direct Debit (lowest fees)
      'cashapp', // Cash App Pay (up to $7,500)
      'link', // Stripe Link (one-click)
      'paypal', // PayPal
      'venmo', // Venmo (up to $5,000)
    ];

    // Get RAPIDS metadata for registered apprenticeship programs
    const rapidsMetadata = isRAPIDSProgram(programSlug) 
      ? getRAPIDSMetadata(programSlug) 
      : null;

    let sessionConfig: any = {
      payment_method_types: paymentMethods,
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/enroll/success?session_id={CHECKOUT_SESSION_ID}&program=${programSlug}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/micro-classes`,
      metadata: {
        programName,
        programSlug,
        paymentType,
        applicationId: applicationId || '',
        // Include RAPIDS metadata for registered apprenticeships
        ...(rapidsMetadata || {}),
      },
    };

    if (paymentType === 'plan' && price > 500) {
      // Payment plan - 4 monthly installments
      const monthlyAmount = Math.ceil(price / 4);

      sessionConfig = {
        ...sessionConfig,
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${programName} - Payment Plan`,
                description: `4-month payment plan for ${programName}`,
              },
              unit_amount: monthlyAmount * 100,
              recurring: {
                interval: 'month',
                interval_count: 1,
              },
            },
            quantity: 1,
          },
        ],
        subscription_data: {
          metadata: {
            programName,
            programSlug,
            totalAmount: price,
            installments: 4,
          },
        },
      };
    } else {
      // One-time payment
      // Use proper naming for barber program
      const displayName = programSlug === 'barber-apprenticeship' 
        ? 'Barber Training Program (Indiana)'
        : programName;
      const displayDescription = programSlug === 'barber-apprenticeship'
        ? 'Fee-based apprenticeship-aligned training program'
        : `Enrollment in ${programName} training program`;

      sessionConfig = {
        ...sessionConfig,
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: displayName,
                description: displayDescription,
              },
              unit_amount: price * 100,
            },
            quantity: 1,
          },
        ],
      };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ url: session.url });
  } catch (error) { /* Error handled silently */ 
    logger.error('Stripe error:', error);
    return NextResponse.json(
      { error: 'Error creating checkout session' },
      { status: 500 }
    );
  }
}
