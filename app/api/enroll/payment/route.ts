import { z } from 'zod';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getStripeMethodsForAmount } from '@/lib/bnpl-config';
import { createClient } from '@/lib/supabase/server';
import { toErrorMessage } from '@/lib/safe';
import { paymentRateLimit } from '@/lib/rate-limit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

const enrollPaymentSchema = z.object({
  amount: z.number().positive(),
  program: z.string().min(1).max(100),
  paymentType: z.enum(['full', 'deposit', 'payment-plan']).optional(),
  description: z.string().max(500).optional(),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// Prices from INTraining / ETPL official listing (2Exclusive LLC-S / Elevate for Humanity Training Center)
const PROGRAM_DETAILS: Record<string, { name: string; totalPrice: number }> = {
  cna: { name: 'Certified Nursing Assistant (CNA)', totalPrice: 1850 },
  barber: { name: 'Barber Apprenticeship', totalPrice: 4890 },
  hvac: { name: 'HVAC Technician', totalPrice: 5000 },
  'medical-assistant': { name: 'Medical Assistant', totalPrice: 5000 },
  cdl: { name: 'CDL Training', totalPrice: 5000 },
  bookkeeping: { name: 'Bookkeeping / Accounting Clerk', totalPrice: 4925 },
  'business-management': { name: 'Business Management', totalPrice: 4900 },
  esthetician: { name: 'Professional Esthetician & Client Services', totalPrice: 4575 },
  'emergency-health': { name: 'Emergency Health & Safety Technician', totalPrice: 4950 },
  'home-health-aide': { name: 'Home Health Aide', totalPrice: 4700 },
  'reentry-specialist': { name: 'Public Safety Reentry Specialist', totalPrice: 4750 },
  'cpr-aed': { name: 'CPR / AED / First Aid', totalPrice: 130 },
  'cpr-first-aid': { name: 'CPR & First Aid Certification', totalPrice: 130 },
};

async function _POST(req: Request) {
  try {

    // Rate limiting
    if (paymentRateLimit) {
      const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
      const rateLimiter = paymentRateLimit.get();
      if (rateLimiter) {
        const { success } = await rateLimiter.limit(ip);
        if (!success) {
          return NextResponse.json(
            { error: 'Too many payment requests. Please try again later.' },
            { status: 429 },
          );
        }
      }
    }

    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment system not configured. Please contact support.' },
        { status: 503 },
      );
    }

    const rawBody = await req.json();
    const parsed = enrollPaymentSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', fields: parsed.error.issues.map((i) => i.path.join('.')) },
        { status: 400 },
      );
    }
    const { amount, program, paymentType, description, successUrl, cancelUrl } = parsed.data;

    if (!amount || !program || !successUrl || !cancelUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const programInfo = PROGRAM_DETAILS[program] || {
      name: program.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
      totalPrice: amount,
    };

    const amountDollars = amount;
    const paymentMethodTypes = getStripeMethodsForAmount(amountDollars);

    // Create Stripe Checkout session (includes BNPL methods from bnpl-config)
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: paymentMethodTypes,
      customer_email: user?.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: programInfo.name,
              description:
                description ||
                `${paymentType === 'down-payment' ? 'Down Payment' : 'Full Payment'} for ${programInfo.name}`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        payment_type: 'enrollment',
        funding_source: 'self_pay',
        program_slug: program,
        program_name: programInfo.name,
        enrollment_payment_type: paymentType,
        amount_paid: amount.toString(),
        total_program_cost: programInfo.totalPrice.toString(),
        user_id: user?.id || '',
      },
      automatic_tax: {
        enabled: true,
      },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error('Enrollment payment error:', error);
    return NextResponse.json(
      { error: toErrorMessage(error) || 'Payment processing failed' },
      { status: 500 },
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/enroll/payment', _POST));
