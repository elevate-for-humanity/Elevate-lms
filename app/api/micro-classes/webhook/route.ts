/**
 * POST /api/micro-classes/webhook
 *
 * Stripe webhook for micro-class (partner course) purchases.
 * Register this URL in Stripe Dashboard with a dedicated webhook secret.
 *
 * On checkout.session.completed where metadata.payment_type = 'micro_class':
 *   1. Records enrollment in micro_class_enrollments
 *   2. Emails student their login link + access instructions for the 3rd-party course
 *   3. Emails admin a revenue notification
 *
 * Idempotent — safe to replay (unique on stripe_session_id).
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { getCourseById } from '@/lib/partners/link-based-integration';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'info@elevateforhumanity.org';
const FROM_EMAIL = 'noreply@elevateforhumanity.org';

export async function POST(req: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_MICRO_CLASS_WEBHOOK_SECRET;

  if (!stripeKey || !webhookSecret) {
    logger.error('[micro-classes/webhook] Missing STRIPE_SECRET_KEY or STRIPE_MICRO_CLASS_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = new Stripe(stripeKey).webhooks.constructEvent(body, sig, webhookSecret);
  } catch {
    logger.warn('[micro-classes/webhook] Signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  if (session.metadata?.payment_type !== 'micro_class') {
    return NextResponse.json({ received: true });
  }

  const courseId = session.metadata?.course_id;
  if (!courseId) {
    logger.warn('[micro-classes/webhook] Missing course_id in metadata', { sessionId: session.id });
    return NextResponse.json({ received: true });
  }

  const course = getCourseById(courseId);
  if (!course) {
    logger.error('[micro-classes/webhook] Unknown course_id', { courseId, sessionId: session.id });
    return NextResponse.json({ received: true });
  }

  const db = await getAdminClient();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });

  // Idempotency — skip if already processed
  const { data: existing } = await db
    .from('micro_class_enrollments')
    .select('id')
    .eq('stripe_session_id', session.id)
    .maybeSingle();

  if (existing) {
    logger.info('[micro-classes/webhook] Already processed', { sessionId: session.id });
    return NextResponse.json({ received: true });
  }

  // Retrieve full session for customer details
  const stripe = new Stripe(stripeKey);
  const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
    expand: ['customer_details', 'line_items'],
  });

  const customerEmail = fullSession.customer_details?.email ?? '';
  const customerName  = fullSession.customer_details?.name ?? '';
  const amountPaid    = fullSession.amount_total ?? 0;
  const priceId       = fullSession.line_items?.data?.[0]?.price?.id ?? course.stripePriceId;

  if (!customerEmail) {
    logger.error('[micro-classes/webhook] No customer email', { sessionId: session.id });
    return NextResponse.json({ received: true });
  }

  // Record enrollment
  const { error: insertError } = await db.from('micro_class_enrollments').insert({
    course_id:          courseId,
    partner_id:         course.partnerId,
    student_email:      customerEmail,
    student_name:       customerName,
    stripe_session_id:  session.id,
    stripe_price_id:    priceId,
    amount_paid_cents:  amountPaid,
    vendor_cost_cents:  course.vendorCost * 100,
    enrollment_url:     course.enrollmentUrl,
    login_url:          course.loginUrl,
    access_email_sent:  false,
  });

  if (insertError) {
    logger.error('[micro-classes/webhook] Insert failed', { error: insertError, sessionId: session.id });
    return NextResponse.json({ error: 'DB insert failed' }, { status: 500 });
  }

  const firstName = customerName.split(' ')[0] || 'there';

  // Email student their access instructions
  const studentHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a">
      <div style="background:#1a1a1a;padding:24px 32px">
        <img src="${SITE_URL}/images/elevate-logo-white.png" alt="Elevate for Humanity" height="36" />
      </div>
      <div style="padding:32px">
        <h1 style="font-size:22px;font-weight:700;margin:0 0 8px">You're enrolled, ${firstName}!</h1>
        <p style="color:#444;margin:0 0 24px">Your payment for <strong>${course.title}</strong> was received. Here's how to access your course.</p>

        <div style="background:#f8f8f8;border-radius:12px;padding:24px;margin-bottom:24px">
          <p style="font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#666;margin:0 0 12px">Your Course Access</p>
          <p style="margin:0 0 8px"><strong>Course:</strong> ${course.title}</p>
          <p style="margin:0 0 8px"><strong>Provider:</strong> ${course.partnerName}</p>
          <p style="margin:0 0 8px"><strong>Duration:</strong> ${course.duration}</p>
          <p style="margin:0 0 8px"><strong>Certificate:</strong> ${course.certificationType}</p>
        </div>

        <div style="margin-bottom:24px">
          <p style="font-weight:700;margin:0 0 12px">Steps to get started:</p>
          <ol style="margin:0;padding-left:20px;color:#444;line-height:1.8">
            <li>Click the button below to go to the course enrollment page</li>
            <li>Create an account using this email address: <strong>${customerEmail}</strong></li>
            <li>Complete the course at your own pace</li>
            <li>Download your certificate when finished</li>
          </ol>
        </div>

        <a href="${course.enrollmentUrl}"
           style="display:inline-block;background:#1a1a1a;color:#fff;font-weight:700;padding:14px 28px;border-radius:8px;text-decoration:none;font-size:15px;margin-bottom:24px">
          Access ${course.title} →
        </a>

        <p style="color:#666;font-size:13px;margin:0 0 8px">
          Already have an account? <a href="${course.loginUrl}" style="color:#1a1a1a">Log in here</a>
        </p>
        <p style="color:#666;font-size:13px;margin:0">
          Need help? Contact ${course.partnerName} support at <a href="${course.supportUrl}" style="color:#1a1a1a">${course.supportUrl}</a>
          or reply to this email.
        </p>
      </div>
      <div style="background:#f0f0f0;padding:16px 32px;font-size:12px;color:#888;text-align:center">
        Elevate for Humanity · Indianapolis, IN · <a href="${SITE_URL}" style="color:#888">${SITE_URL}</a>
      </div>
    </div>
  `;

  const studentResult = await sendEmail({
    to: customerEmail,
    from: FROM_EMAIL,
    subject: `Your ${course.title} access is ready`,
    html: studentHtml,
  });

  // Email admin revenue notification
  const markup = amountPaid - course.vendorCost * 100;
  const adminHtml = `
    <div style="font-family:sans-serif;max-width:500px;margin:0 auto">
      <h2>Micro-class purchase</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr><td style="padding:6px 0;color:#666">Course</td><td><strong>${course.title}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666">Partner</td><td>${course.partnerName}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Student</td><td>${customerName} &lt;${customerEmail}&gt;</td></tr>
        <tr><td style="padding:6px 0;color:#666">Amount paid</td><td>$${(amountPaid / 100).toFixed(2)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Vendor cost</td><td>$${course.vendorCost.toFixed(2)}</td></tr>
        <tr><td style="padding:6px 0;color:#666">Elevate markup</td><td><strong>$${(markup / 100).toFixed(2)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#666">Stripe session</td><td style="font-size:12px">${session.id}</td></tr>
      </table>
    </div>
  `;

  await sendEmail({
    to: ADMIN_EMAIL,
    from: FROM_EMAIL,
    subject: `Micro-class sold: ${course.title} — $${(amountPaid / 100).toFixed(2)}`,
    html: adminHtml,
  });

  // Mark access email sent
  await db
    .from('micro_class_enrollments')
    .update({ access_email_sent: true, updated_at: new Date().toISOString() })
    .eq('stripe_session_id', session.id);

  logger.info('[micro-classes/webhook] Enrollment complete', {
    courseId,
    email: customerEmail,
    amountPaid,
    markup,
  });

  return NextResponse.json({ received: true });
}
