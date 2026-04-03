/**
 * POST /api/testing/enforcement/checkout
 *
 * Creates a Stripe Checkout session to pay a no-show, retake, or
 * reschedule fee. On success, Stripe fires checkout.session.completed →
 * /api/testing/webhook clears the enforcement hold.
 *
 * Body: { enforcementId: string, email: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError, safeInternalError } from '@/lib/api/safe-error';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

const FEE_LABELS: Record<string, string> = {
  no_show:    'No-Show Rescheduling Fee',
  retake:     'Exam Retake Fee',
  reschedule: 'Late Reschedule Fee',
};

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return safeError('Stripe not configured', 500);

  const rateLimited = await applyRateLimit(req, 'payment');
  if (rateLimited) return rateLimited;

  let body: { enforcementId: string; email: string };
  try { body = await req.json(); } catch { return safeError('Invalid JSON', 400); }

  const { enforcementId, email } = body;
  if (!enforcementId || !email) return safeError('enforcementId and email are required', 400);

  const db = createAdminClient();
  if (!db) return safeError('Database unavailable', 500);

  const { data: hold, error } = await db
    .from('testing_enforcement')
    .select('id, enforcement_type, fee_cents, fee_paid')
    .eq('id', enforcementId)
    .eq('email', email.toLowerCase().trim())
    .single();

  if (error || !hold) return safeError('Enforcement hold not found', 404);
  if (hold.fee_paid) return safeError('This fee has already been paid', 400);

  const label = FEE_LABELS[hold.enforcement_type] ?? 'Testing Fee';

  try {
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: hold.fee_cents,
            product_data: {
              name: label,
              description: 'Elevate for Humanity Testing Center — Indianapolis, IN',
            },
          },
          quantity: 1,
        },
      ],
      metadata: {
        payment_type: 'testing_enforcement',
        enforcement_id: hold.id,
        enforcement_type: hold.enforcement_type,
        email,
      },
      success_url: `${SITE_URL}/testing/book?fee_paid=1`,
      cancel_url:  `${SITE_URL}/testing/book?fee_cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return safeInternalError(err, 'Failed to create fee checkout session');
  }
}
