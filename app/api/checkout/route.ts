import Stripe from 'stripe';
import { z } from 'zod';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';

import { billingConfigs } from '../../../lms-data/billingConfig';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAuth } from '@/lib/api/requireAuth';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';
export const maxDuration = 60;

const checkoutSchema = z.object({
  programId: z.string().min(1),
  planType: z.enum(['full', 'payment-plan']).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
  customerEmail: z.string().email().optional(),
  metadata: z.record(z.string(), z.string()).optional(),
});

const stripe = getStripe();

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'contact');
    if (rateLimited) return rateLimited;

    const auth = await requireAuth(req);
    if (auth.error) return auth.error;

    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured on the server.' },
        { status: 500 }
      );
    }

    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', fields: parsed.error.issues.map(i => i.path.join('.')) },
        { status: 400 }
      );
    }
    const { programId, planType, successUrl, cancelUrl, customerEmail, metadata } = parsed.data;

    const config = billingConfigs.find((c) => c.programId === programId);
    if (!config) {
      return NextResponse.json(
        { error: `No billing config found for programId=${programId}` },
        { status: 404 }
      );
    }

    const chosenPlan = planType ?? config.defaultPlan;

    const priceId =
      chosenPlan === 'payment-plan'
        ? config.stripePricePlan
        : config.stripePriceFull;

    if (!priceId) {
      return NextResponse.json(
        {
          error: `No Stripe price configured for ${chosenPlan} on program ${config.label}.`,
        },
        { status: 400 }
      );
    }

    const origin =
      successUrl && typeof successUrl === 'string'
        ? new URL(successUrl).origin
        : (req.headers.get('origin') ??
          process.env.NEXT_PUBLIC_SITE_URL ??
          (process.env.URL
            ? `https://${process.env.URL}`
            : 'http://localhost:3000'));

    // Build session options
    const sessionOptions: Stripe.Checkout.SessionCreateParams = {
      mode: 'payment',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url:
        successUrl ??
        `${origin}/enroll/thank-you?programId=${encodeURIComponent(programId)}`,
      cancel_url:
        cancelUrl ??
        `${origin}/enroll/${encodeURIComponent(programId)}?checkout=cancelled`,
      metadata: {
        programId,
        planType: chosenPlan,
        programSlug: programId === 'prog-barber' ? 'barber-apprenticeship' : programId,
        ...metadata,
      },
      // Let Stripe dynamically show eligible payment methods based on customer location and cart
      automatic_payment_methods: { enabled: true },
    };

    // Add customer email if provided
    if (customerEmail) {
      sessionOptions.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionOptions);

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (err: any) {
    logger.error(
      '[Elevate] Error in /api/checkout:',
      err instanceof Error ? err : new Error(String(err))
    );
    return NextResponse.json(
      { error: 'Unable to create checkout session.' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/checkout', _POST);
