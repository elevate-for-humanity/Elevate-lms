// PUBLIC ROUTE: Stripe checkout session (payment rate limit).
/**
 * POST /api/checkout/program
 *
 * Creates a Stripe Checkout session for self-pay program enrollment.
 * Supports two modes:
 *   1. partner_courses row — looks up stripe_price_id from the DB
 *   2. ad-hoc amount — creates a one-time price on the fly
 *
 * Body:
 *   { slug: string, successUrl: string, cancelUrl: string }
 *
 * Returns:
 *   { url: string } — Stripe Checkout session URL to redirect to
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { getStripeMethodsForAmount } from '@/lib/bnpl-config';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

async function _POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Payment system not configured.' }, { status: 503 });
  }

  let body: { slug?: string; successUrl?: string; cancelUrl?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const { slug, successUrl, cancelUrl } = body;
  if (!slug || !successUrl || !cancelUrl) {
    return NextResponse.json(
      { error: 'slug, successUrl, and cancelUrl are required.' },
      { status: 400 },
    );
  }

  const supabase = await getAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service temporarily unavailable.' }, { status: 503 });
  }

  // ── 1. Look up partner_courses row by slug ──────────────────────────────
  const { data: partnerCourse } = await supabase
    .from('partner_courses')
    .select('id, title, stripe_price_id, payment_link, retail_price_cents, partner_key')
    .eq('course_key', slug)
    .maybeSingle();

  // ── 2. If a Stripe payment link exists, redirect directly ───────────────
  if (partnerCourse?.payment_link) {
    return NextResponse.json({ url: partnerCourse.payment_link });
  }

  // ── 3. Build a Checkout session ─────────────────────────────────────────
  let priceId: string | null = partnerCourse?.stripe_price_id ?? null;
  const amountCents = partnerCourse?.retail_price_cents ?? null;

  // If no price_id, create an ad-hoc price from the programs table
  if (!priceId) {
    const { data: program } = await supabase
      .from('programs')
      .select('title, description, tuition_amount')
      .eq('slug', slug)
      .maybeSingle();

    if (!program) {
      return NextResponse.json(
        { error: 'Program not found or not available for self-pay checkout.' },
        { status: 404 },
      );
    }

    const unitAmount = amountCents ?? Math.round((program.tuition_amount ?? 0) * 100);
    if (!unitAmount || unitAmount <= 0) {
      return NextResponse.json(
        { error: 'This program does not have a self-pay price configured.' },
        { status: 422 },
      );
    }

    try {
      const price = await stripe.prices.create({
        unit_amount: unitAmount,
        currency: 'usd',
        product_data: {
          name: program.title,
          metadata: { program_slug: slug },
        },
      });
      priceId = price.id;
    } catch (err) {
      logger.error('Failed to create Stripe price for program', err instanceof Error ? err : new Error(String(err)), { slug });
      return NextResponse.json({ error: 'Failed to create payment.' }, { status: 500 });
    }
  }

  // ── 4. Create Checkout session with BNPL methods ────────────────────────
  const amountDollars = (amountCents ?? 0) / 100;
  const paymentMethods = getStripeMethodsForAmount(amountDollars);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_types: paymentMethods as any,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        program_slug: slug,
        partner_key: partnerCourse?.partner_key ?? '',
        source: 'program_detail_page',
      },
      automatic_tax: { enabled: false },
    });

    if (!session.url) {
      return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    logger.error('Stripe checkout session creation failed', err instanceof Error ? err : new Error(String(err)), { slug });
    return NextResponse.json({ error: 'Payment session failed. Please try again.' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/checkout/program', _POST);
