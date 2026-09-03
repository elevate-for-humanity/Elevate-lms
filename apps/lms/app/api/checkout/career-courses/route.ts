import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { apiAuthGuard } from '@/lib/admin/guards';
import { hydrateProcessEnv } from '@/lib/secrets';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

type CheckoutBody = {
  courseIds?: unknown;
};

async function _POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'payment');
  if (rateLimited) return rateLimited;

  const auth = await apiAuthGuard(req);
  if (auth.error) return auth.error;

  try {
    const body = (await req.json()) as CheckoutBody;
    const courseIds = Array.isArray(body.courseIds)
      ? Array.from(
          new Set(
            body.courseIds
              .filter((value): value is string => typeof value === 'string')
              .map((value) => value.trim())
              .filter(Boolean),
          ),
        )
      : [];

    if (courseIds.length === 0 || courseIds.length > 10) {
      return NextResponse.json({ error: 'Select between 1 and 10 courses.' }, { status: 400 });
    }

    const supabase = await requireAdminClient();
    const [{ data: courses, error: courseError }, { data: commerce, error: commerceError }] =
      await Promise.all([
        supabase
          .from('courses')
          .select(
            'id, slug, title, short_description, governing_body, status, is_active, review_status',
          )
          .in('id', courseIds),
        supabase
          .from('course_commerce')
          .select(
            'course_id, currency, exam_voucher_cost_cents, retail_price_cents, exam_voucher_included, self_pay_enabled, bnpl_enabled',
          )
          .in('course_id', courseIds),
      ]);

    if (courseError || commerceError) {
      throw courseError || commerceError;
    }

    const courseById = new Map((courses || []).map((course) => [course.id, course]));
    const commerceByCourseId = new Map(
      (commerce || []).map((record) => [record.course_id, record]),
    );

    const selected = courseIds.map((courseId) => ({
      course: courseById.get(courseId),
      commerce: commerceByCourseId.get(courseId),
    }));

    const unavailable = selected.some(
      ({ course, commerce: price }) =>
        !course ||
        !price ||
        course.status !== 'published' ||
        course.is_active !== true ||
        course.review_status !== 'approved' ||
        price.self_pay_enabled !== true ||
        !Number.isSafeInteger(Number(price.retail_price_cents)) ||
        Number(price.retail_price_cents) <= 0,
    );

    if (unavailable) {
      return NextResponse.json(
        { error: 'One or more selected courses are not available for self-pay enrollment.' },
        { status: 409 },
      );
    }

    await hydrateProcessEnv();
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json({ error: 'Payment processing not configured.' }, { status: 503 });
    }

    const lineItems = selected.map(({ course, commerce: price }) => ({
      price_data: {
        currency: String(price!.currency || 'usd').toLowerCase(),
        product_data: {
          name: course!.title,
          description:
            course!.short_description ||
            `Professional certification preparation from ${course!.governing_body || PLATFORM_DEFAULTS.orgName}`,
          metadata: {
            course_id: course!.id,
            course_slug: course!.slug,
            exam_voucher_included: String(price!.exam_voucher_included),
          },
        },
        unit_amount: Number(price!.retail_price_cents),
      },
      quantity: 1,
    }));

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      new URL(req.url).origin ||
      PLATFORM_DEFAULTS.siteUrl;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: lineItems,
      success_url: `${baseUrl}/career-services/courses/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/career-services/courses`,
      client_reference_id: auth.userId,
      customer_email: auth.email || undefined,
      customer_creation: 'always',
      billing_address_collection: 'required',
      metadata: {
        type: 'career_course',
        payment_type: 'course_purchase',
        funding_source: 'self_pay',
        user_id: auth.userId,
        course_id: courseIds[0],
        course_ids: courseIds.join(','),
      },
      allow_promotion_codes: true,
    });

    if (!session.url) {
      throw new Error('Stripe did not return a Checkout URL.');
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    logger.error(
      'Career-course checkout error',
      normalizeError(error, 'Career-course checkout failed'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Unable to start checkout.' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/checkout/career-courses', _POST);
