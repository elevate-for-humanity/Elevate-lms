// Creates a Stripe Checkout Session for program enrollment.
// Called by ProgramEnrollment.tsx for paid programs.
// Returns { sessionId } which the client passes to stripe.redirectToCheckout().
import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { createClient } from '@/lib/supabase/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;

async function _POST(req: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(req, 'payment');
    if (rateLimited) return rateLimited;

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured' }, { status: 503 });
    }

    const body = await req.json();
    const { programId, programName, paymentPlan, amount, installments } = body;

    if (!programId || !amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json({ error: 'programId and a positive amount are required' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

    // Build line items — single payment or first installment
    const unitAmount = Math.round(amount * 100); // caller sends dollars

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: unitAmount,
            product_data: {
              name: programName || 'Program Enrollment',
              description:
                paymentPlan === 'installments' && installments > 1
                  ? `Installment 1 of ${installments}`
                  : 'Full payment',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        programId,
        userId: user.id,
        paymentPlan: paymentPlan || 'full',
        installments: String(installments || 1),
      },
      customer_email: user.email ?? undefined,
      success_url: `${origin}/lms/programs/${programId}?enrolled=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/lms/programs/${programId}?checkout=cancelled`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    logger.error('create-session error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/checkout/create-session', _POST);
