/**
 * POST /api/credentials/exam-checkout
 *
 * Creates a Stripe Checkout session for an exam fee payment.
 * Only called when funding_source = self_pay or unresolved.
 * Writes stripe_checkout_session_id to exam_funding_authorizations.
 *
 * Body: { attemptId: string }
 *
 * Returns: { url: string } — Stripe hosted checkout URL
 */

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { apiAuthGuard } from '@/lib/authGuards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolvePaymentResponsibility } from '@/lib/services/credential-pipeline';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  const stripe = new Stripe(stripeKey);

  const rateLimited = await applyRateLimit(req, 'payment');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard({ requireAuth: true });
  if (!auth.authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { user } = auth;

  const body = await req.json();
  const { attemptId } = body;

  if (!attemptId) {
    return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'Database unavailable' }, { status: 500 });

  // Load attempt — verify ownership
  const { data: attempt } = await db
    .from('credential_attempts')
    .select('id, learner_id, credential_id, program_id')
    .eq('id', attemptId)
    .eq('learner_id', user.id)
    .maybeSingle();

  if (!attempt) {
    return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
  }

  // Re-check funding decision — hard guard before creating session
  const decision = await resolvePaymentResponsibility(
    attempt.learner_id,
    attempt.credential_id,
    attempt.program_id ?? null,
    attempt.id
  );

  if (!decision.requiresCheckout) {
    return NextResponse.json(
      { error: 'Checkout not required — funding is already approved' },
      { status: 400 }
    );
  }

  // Load credential for display name, fee, and stored Stripe price
  const { data: credential } = await db
    .from('credentials')
    .select('name, abbreviation, stripe_price_id, exam_fee_cents')
    .eq('id', attempt.credential_id)
    .single();

  if (!credential) {
    return NextResponse.json({ error: 'Credential not found' }, { status: 404 });
  }

  // Load profile for prefill
  const { data: profile } = await db
    .from('profiles')
    .select('email, full_name')
    .eq('id', user.id)
    .single();

  // Determine amount — authorization record takes precedence, then credential row, else 0
  const amountCents = decision.amountCents ?? credential.exam_fee_cents ?? 0;
  if (amountCents <= 0) {
    return NextResponse.json(
      { error: 'Exam fee amount not configured for this credential. Contact (317) 314-3757.' },
      { status: 400 }
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';

  // Use stored Stripe price ID when available — avoids creating duplicate products
  const lineItem = credential.stripe_price_id
    ? { price: credential.stripe_price_id, quantity: 1 }
    : {
        price_data: {
          currency: 'usd',
          unit_amount: amountCents,
          product_data: {
            name: `${credential.name} Exam Fee`,
            description: `Credential exam fee for ${credential.abbreviation ?? credential.name}`,
          },
        },
        quantity: 1,
      };

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: profile?.email ?? undefined,
    line_items: [lineItem],
    metadata: {
      payment_type: 'exam_fee',
      attempt_id: attempt.id,
      learner_id: attempt.learner_id,
      credential_id: attempt.credential_id,
    },
    success_url: `${siteUrl}/lms/certification?payment=success&attemptId=${attempt.id}`,
    cancel_url: `${siteUrl}/lms/payments/checkout?attemptId=${attempt.id}`,
  });

  // Write session ID to funding authorization so webhook can match it
  await db
    .from('exam_funding_authorizations')
    .update({
      stripe_checkout_session_id: session.id,
      funding_status: 'pending',
      updated_at: new Date().toISOString(),
    })
    .eq('learner_id', attempt.learner_id)
    .eq('credential_id', attempt.credential_id)
    .eq('credential_attempt_id', attempt.id);

  return NextResponse.json({ url: session.url });
}
