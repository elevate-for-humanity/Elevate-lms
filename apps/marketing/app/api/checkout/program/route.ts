// PUBLIC ROUTE: Stripe checkout for self-pay program enrollment.
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { getStaticProgram } from '@/data/programs/index';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function moneyToCents(value?: string | null): number {
  if (!value) return 0;
  const dollars = Number(value.replace(/[^0-9.]/g, ''));
  return Number.isFinite(dollars) && dollars > 0 ? Math.round(dollars * 100) : 0;
}

async function resolvePricing(slug: string) {
  const admin = await getAdminClient();
  if (admin) {
    const { data } = await admin
      .from('program_pricing')
      .select('program_name, tuition_cents, deposit_min_cents, active')
      .eq('program_slug', slug)
      .eq('active', true)
      .maybeSingle();
    if (data?.tuition_cents) {
      return {
        name: data.program_name,
        tuitionCents: Number(data.tuition_cents),
        depositMinCents: Number(data.deposit_min_cents || 0),
      };
    }
  }

  const program = getStaticProgram(slug);
  if (!program) return null;
  const tuitionCents = moneyToCents(program.selfPayCost);
  if (!tuitionCents) return null;
  const configuredDeposit = moneyToCents(program.depositAmount);
  return {
    name: program.title,
    tuitionCents,
    depositMinCents:
      configuredDeposit || Math.min(tuitionCents, Math.max(10000, Math.round(tuitionCents * 0.1))),
  };
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Payment system not configured.' }, { status: 503 });

  let body: {
    slug?: string;
    checkoutMode?: 'deposit' | 'full';
    amountCents?: number;
    successUrl?: string;
    cancelUrl?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const slug = body.slug?.trim();
  if (!slug) return NextResponse.json({ error: 'Program slug is required.' }, { status: 400 });

  const pricing = await resolvePricing(slug);
  if (!pricing) {
    return NextResponse.json({ error: 'This program does not have a self-pay price configured.' }, { status: 422 });
  }

  const checkoutMode = body.checkoutMode === 'deposit' ? 'deposit' : 'full';
  const requested = Math.round(Number(body.amountCents || 0));
  let chargeCents = pricing.tuitionCents;

  if (checkoutMode === 'deposit') {
    chargeCents = requested || pricing.depositMinCents;
    if (chargeCents < pricing.depositMinCents || chargeCents > pricing.tuitionCents) {
      return NextResponse.json(
        { error: 'Deposit amount is outside the allowed range.' },
        { status: 400 },
      );
    }
  }

  const origin = request.nextUrl.origin;
  const successUrl = body.successUrl?.startsWith(origin)
    ? body.successUrl
    : `${origin}/programs/${encodeURIComponent(slug)}/enrollment-success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = body.cancelUrl?.startsWith(origin)
    ? body.cancelUrl
    : `${origin}/programs/${encodeURIComponent(slug)}`;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'usd',
            unit_amount: chargeCents,
            product_data: {
              name:
                checkoutMode === 'deposit'
                  ? `${pricing.name} — Enrollment Deposit`
                  : `${pricing.name} — Tuition`,
              metadata: { program_slug: slug, checkout_mode: checkoutMode },
            },
          },
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      client_reference_id: slug,
      metadata: {
        kind: 'program_enrollment',
        program_slug: slug,
        checkout_mode: checkoutMode,
        tuition_cents: String(pricing.tuitionCents),
        amount_charged_cents: String(chargeCents),
        source: 'marketing_program_page',
      },
    });

    if (!session.url) return NextResponse.json({ error: 'Checkout session did not return a URL.' }, { status: 500 });
    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    logger.error(
      '[program-checkout] Stripe checkout session creation failed',
      error instanceof Error ? error : new Error(String(error)),
      { slug, checkoutMode, chargeCents },
    );
    return NextResponse.json({ error: 'Unable to start checkout. Please try again.' }, { status: 500 });
  }
}
