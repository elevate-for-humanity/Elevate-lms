import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe/client';
import { apiAuthGuard } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type CheckoutBody = {
  courseId?: unknown;
};

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'payment');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(request);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as CheckoutBody;
    const courseId = typeof body.courseId === 'string' ? body.courseId.trim() : '';

    if (!courseId) {
      return NextResponse.json({ error: 'A course is required.' }, { status: 400 });
    }

    const supabase = await requireAdminClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Course catalog is temporarily unavailable.' }, { status: 503 });
    }

    const [{ data: course, error: courseError }, { data: commerce, error: commerceError }] =
      await Promise.all([
        supabase
          .from('courses')
          .select(
            'id, slug, title, short_description, governing_body, status, is_active, review_status',
          )
          .eq('id', courseId)
          .maybeSingle(),
        supabase
          .from('course_commerce')
          .select(
            'course_id, currency, exam_voucher_cost_cents, delivery_cost_cents, processing_reserve_cents, retail_price_cents, gross_margin_cents, exam_voucher_included, self_pay_enabled, bnpl_enabled',
          )
          .eq('course_id', courseId)
          .maybeSingle(),
      ]);

    if (courseError || commerceError) {
      logger.error(
        'Course checkout catalog lookup failed',
        normalizeError(courseError || commerceError, 'Course checkout catalog lookup failed'),
        getErrorContext(courseError || commerceError),
      );
      return NextResponse.json({ error: 'Course catalog is temporarily unavailable.' }, { status: 503 });
    }

    const isApprovedForSale =
      course?.status === 'published' &&
      course.is_active === true &&
      course.review_status === 'approved' &&
      commerce?.self_pay_enabled === true;

    if (!course || !commerce || !isApprovedForSale) {
      return NextResponse.json({ error: 'This course is not available for self-pay enrollment.' }, { status: 409 });
    }

    const priceInCents = Number(commerce.retail_price_cents);
    const currency = String(commerce.currency || 'usd').toLowerCase();

    if (!Number.isSafeInteger(priceInCents) || priceInCents <= 0 || !/^[a-z]{3}$/.test(currency)) {
      logger.error('Course checkout rejected invalid server pricing', undefined, {
        courseId,
        priceInCents,
        currency,
      });
      return NextResponse.json({ error: 'This course has an invalid price configuration.' }, { status: 503 });
    }

    await hydrateProcessEnv();
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Payment system not configured.' }, { status: 503 });
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      request.nextUrl.origin ||
      PLATFORM_DEFAULTS.siteUrl;
    const provider = course.governing_body || PLATFORM_DEFAULTS.orgName;
    const safeSlug = encodeURIComponent(course.slug);

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: course.title,
              description:
                course.short_description ||
                `Professional certification preparation from ${provider}`,
              metadata: {
                course_id: course.id,
                course_slug: course.slug,
                provider,
                exam_voucher_included: String(commerce.exam_voucher_included),
              },
            },
            unit_amount: priceInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${baseUrl}/courses/${safeSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/courses/${safeSlug}`,
      client_reference_id: auth.userId,
      customer_email: auth.email || undefined,
      customer_creation: 'always',
      billing_address_collection: 'required',
      metadata: {
        type: 'career_course',
        payment_type: 'course_purchase',
        funding_source: 'self_pay',
        user_id: auth.userId,
        course_id: course.id,
        course_ids: course.id,
        course_slug: course.slug,
        course_name: course.title,
        provider,
        exam_voucher_included: String(commerce.exam_voucher_included),
        exam_voucher_cost_cents: String(commerce.exam_voucher_cost_cents),
        delivery_cost_cents: String(commerce.delivery_cost_cents),
        processing_reserve_cents: String(commerce.processing_reserve_cents),
        retail_price_cents: String(priceInCents),
        gross_margin_cents: String(commerce.gross_margin_cents),
        bnpl_enabled: String(commerce.bnpl_enabled),
      },
    });

    if (!session.url) {
      throw new Error('Stripe did not return a Checkout URL.');
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    logger.error(
      'Course checkout error',
      normalizeError(error, 'Course checkout error'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Failed to create checkout session.' }, { status: 500 });
  }
}
