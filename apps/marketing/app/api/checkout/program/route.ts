// PUBLIC ROUTE: Stripe checkout for self-pay program enrollment.
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { getAdminClient } from '@/lib/supabase/admin';
import { getStaticProgram } from '@/data/programs/index';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { getMinimumDepositCents } from '@/lib/programs/deposit-policy';

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
      const tuitionCents = Number(data.tuition_cents);
      return {
        name: data.program_name,
        tuitionCents,
        depositMinCents: getMinimumDepositCents({
          slug,
          tuitionCents,
          configuredDepositCents: Number(data.deposit_min_cents || 0),
        }),
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
    depositMinCents: getMinimumDepositCents({
      slug: program.slug,
      tuitionCents,
      configuredDepositCents: configuredDeposit,
    }),
  };
}

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  const stripe = getStripe();
  if (!stripe) return NextResponse.json({ error: 'Payment system not configured.' }, { status: 503 });

  const admin = await getAdminClient();
  if (!admin) return NextResponse.json({ error: 'Enrollment system temporarily unavailable.' }, { status: 503 });

  let body: {
    slug?: string;
    checkoutMode?: 'deposit' | 'full';
    amountCents?: number;
    successUrl?: string;
    cancelUrl?: string;
    couponCode?: string;
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

  const { data: programRow, error: programError } = await admin
    .from('programs')
    .select('id, slug, title')
    .eq('slug', slug)
    .maybeSingle();

  if (programError || !programRow?.id) {
    return NextResponse.json(
      { error: 'Program enrollment record is not configured. Contact admissions before paying.' },
      { status: 422 },
    );
  }

  const checkoutMode = body.checkoutMode === 'deposit' ? 'deposit' : 'full';
  const requested = Math.round(Number(body.amountCents || 0));
  let chargeCents = pricing.tuitionCents;

  if (checkoutMode === 'deposit') {
    chargeCents = requested || pricing.depositMinCents;
    if (chargeCents < pricing.depositMinCents || chargeCents > pricing.tuitionCents) {
      return NextResponse.json(
        {
          error: `Deposit must be between $${Math.round(pricing.depositMinCents / 100).toLocaleString('en-US')} and $${Math.round(pricing.tuitionCents / 100).toLocaleString('en-US')}.`,
        },
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

  // Create an orphan-safe pending enrollment before Stripe checkout. The canonical
  // webhook updates this exact row after payment, then account onboarding can link
  // it to a user by email.
  const { data: pendingEnrollment, error: pendingError } = await admin
    .from('program_enrollments')
    .insert({
      program_id: programRow.id,
      program_slug: slug,
      user_id: null,
      funding_source: 'self_pay',
      status: 'checkout_pending',
      payment_status: 'pending',
      enrollment_state: 'payment_pending',
      next_required_action: 'PAYMENT',
      amount_paid_cents: 0,
    })
    .select('id')
    .single();

  if (pendingError || !pendingEnrollment?.id) {
    logger.error('[program-checkout] Pending enrollment insert failed', pendingError?.message ?? 'unknown', { slug });
    return NextResponse.json({ error: 'Unable to prepare enrollment checkout.' }, { status: 500 });
  }

  const couponCode = body.couponCode?.trim();
  let promotionCodeId: string | null = null;
  if (couponCode) {
    try {
      const promotionCodes = await stripe.promotionCodes.list({
        code: couponCode,
        active: true,
        limit: 1,
      });
      promotionCodeId = promotionCodes.data[0]?.id ?? null;
    } catch (error) {
      logger.warn('[program-checkout] Promotion-code lookup failed', {
        slug,
        message: error instanceof Error ? error.message : String(error),
      });
    }

    if (!promotionCodeId) {
      await admin
        .from('program_enrollments')
        .delete()
        .eq('id', pendingEnrollment.id)
        .eq('status', 'checkout_pending');
      return NextResponse.json(
        { error: 'That coupon code is invalid or inactive.' },
        { status: 400 },
      );
    }
  }

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
      ...(promotionCodeId
        ? { discounts: [{ promotion_code: promotionCodeId }] }
        : { allow_promotion_codes: true }),
      billing_address_collection: 'auto',
      client_reference_id: pendingEnrollment.id,
      metadata: {
        kind: 'program_enrollment',
        program_id: programRow.id,
        program_slug: slug,
        existing_enrollment_id: pendingEnrollment.id,
        funding_source: 'self_pay',
        checkout_mode: checkoutMode,
        tuition_cents: String(pricing.tuitionCents),
        amount_charged_cents: String(chargeCents),
        coupon_code: couponCode || '',
        source: 'marketing_program_page',
      },
    });

    if (!session.url) throw new Error('Checkout session did not return a URL.');

    await admin
      .from('program_enrollments')
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq('id', pendingEnrollment.id);

    return NextResponse.json({ url: session.url, sessionId: session.id, enrollmentId: pendingEnrollment.id });
  } catch (error) {
    await admin.from('program_enrollments').delete().eq('id', pendingEnrollment.id).eq('status', 'checkout_pending');
    logger.error(
      '[program-checkout] Stripe checkout session creation failed',
      error instanceof Error ? error : new Error(String(error)),
      { slug, checkoutMode, chargeCents },
    );
    return NextResponse.json({ error: 'Unable to start checkout. Please try again.' }, { status: 500 });
  }
}
