import { logger } from '@/lib/logger';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { getStripe } from '@/lib/stripe/client';
import { hydrateProcessEnv } from '@/lib/secrets';
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { requireAdminClient } from '@/lib/supabase/admin';
import type Stripe from 'stripe';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import * as Sentry from '@sentry/nextjs';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const dynamic = 'force-dynamic';

function getWebhookSecret() {
  return (
    process.env.STRIPE_WEBHOOK_SECRET_CAREER_COURSES ||
    process.env.STRIPE_WEBHOOK_SECRET ||
    ''
  );
}

async function recordCompletedCheckout(event: Stripe.Event, session: Stripe.Checkout.Session) {
  const supabase = await requireAdminClient();

  const { data: alreadyProcessed } = await supabase
    .from('processed_stripe_events')
    .select('id')
    .eq('stripe_event_id', event.id)
    .maybeSingle();

  if (alreadyProcessed) {
    return { duplicate: true };
  }

  const courseIds = Array.from(
    new Set(
      (session.metadata?.course_ids || session.metadata?.course_id || '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
    ),
  );

  if (courseIds.length === 0) {
    throw new Error('Career-course checkout is missing course metadata.');
  }

  const customerEmail = (
    session.customer_details?.email ||
    session.customer_email ||
    ''
  )
    .trim()
    .toLowerCase();

  let userId = session.metadata?.user_id?.trim() || '';

  if (userId) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    userId = profile?.id || '';
  }

  if (!userId && customerEmail) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle();
    userId = profile?.id || '';
  }

  if (!userId || !customerEmail) {
    throw new Error('Career-course checkout could not resolve the learner account.');
  }

  const amountTotalCents = session.amount_total || 0;
  const amountPerCourse = Number((amountTotalCents / courseIds.length / 100).toFixed(2));
  const now = new Date().toISOString();

  for (const courseId of courseIds) {
    const { error: purchaseError } = await supabase.from('career_course_purchases').upsert(
      {
        user_id: userId,
        course_id: courseId,
        email: customerEmail,
        amount_paid: amountPerCourse,
        stripe_payment_id:
          typeof session.payment_intent === 'string' ? session.payment_intent : null,
        stripe_session_id: session.id,
        status: 'completed',
        purchased_at: now,
      },
      { onConflict: 'user_id,course_id' },
    );

    if (purchaseError) {
      throw purchaseError;
    }

    const { error: enrollmentError } = await supabase.from('course_enrollments').upsert(
      {
        student_id: userId,
        course_id: courseId,
        status: 'active',
        progress: '0',
        updated_at: now,
      },
      { onConflict: 'student_id,course_id' },
    );

    if (enrollmentError) {
      throw enrollmentError;
    }
  }

  const { error: eventError } = await supabase.from('processed_stripe_events').insert({
    stripe_event_id: event.id,
    payment_intent_id:
      typeof session.payment_intent === 'string' ? session.payment_intent : null,
    event_type: event.type,
    metadata: {
      checkout_session_id: session.id,
      user_id: userId,
      course_ids: courseIds,
    },
  });

  if (eventError && eventError.code !== '23505') {
    throw eventError;
  }

  if (customerEmail) {
    const appUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.NEXT_PUBLIC_SITE_URL ||
      PLATFORM_DEFAULTS.siteUrl;

    try {
      await fetch(`${appUrl}/api/email/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerEmail,
          subject: `Your Career Course Purchase - ${PLATFORM_DEFAULTS.orgName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #7c3aed;">Thank You for Your Purchase!</h2>
              <p>Your career course purchase has been confirmed and your learner access is active.</p>
              <p><strong>Order ID:</strong> ${session.id}</p>
              <p><strong>Amount:</strong> $${(amountTotalCents / 100).toFixed(2)}</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Start Learning Now</h3>
                <p>Open your learner dashboard to begin.</p>
                <a href="${appUrl}/lms/dashboard"
                   style="display: inline-block; background: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                  Go to My Courses
                </a>
              </div>
              <p>Questions? Reply to this email or call ${PLATFORM_DEFAULTS.supportPhone}.</p>
              <p>Best regards,<br><strong>${PLATFORM_DEFAULTS.orgName} Team</strong></p>
            </div>
          `,
        }),
      });
    } catch (emailError) {
      logger.error('Error sending course purchase confirmation email', emailError);
    }
  }

  return { duplicate: false };
}

async function _POST(req: Request) {
  await hydrateProcessEnv();

  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: 'Payment processing not configured' }, { status: 503 });
  }

  const webhookSecret = getWebhookSecret();
  if (!webhookSecret) {
    logger.error('Career-course Stripe webhook secret is not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    Sentry.captureException(error, { tags: { subsystem: 'webhook' } });
    logger.error(
      'Webhook signature verification failed',
      normalizeError(error, 'Webhook signature verification failed'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
      case 'checkout.session.async_payment_succeeded': {
        const session = event.data.object as Stripe.Checkout.Session;

        if (session.metadata?.type !== 'career_course') {
          return NextResponse.json({ received: true, skipped: true });
        }

        if (session.payment_status !== 'paid') {
          return NextResponse.json({ received: true, pending: true });
        }

        const result = await recordCompletedCheckout(event, session);
        return NextResponse.json({ received: true, ...result });
      }

      case 'checkout.session.async_payment_failed': {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.metadata?.type === 'career_course') {
          logger.info('Career-course asynchronous payment failed', {
            checkoutSessionId: session.id,
          });
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        logger.info('Payment failed', { paymentIntentId: paymentIntent.id });
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    Sentry.captureException(error, { tags: { subsystem: 'career_course_webhook' } });
    logger.error(
      'Career-course webhook processing failed',
      normalizeError(error, 'Career-course webhook processing failed'),
      getErrorContext(error),
    );
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/webhooks/stripe/career-courses', _POST, {
  actor_type: 'webhook',
  skip_body: true,
  critical: true,
});
