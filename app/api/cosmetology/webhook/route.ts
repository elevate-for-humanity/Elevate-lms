import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import type Stripe from 'stripe';
import { hydrateProcessEnv } from '@/lib/secrets';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { runCosmetologyPostPayment } from '@/lib/enrollment/cosmetology-post-payment';
import {
  COSMETOLOGY_PROGRAM_ID,
  COSMETOLOGY_COURSE_ID,
  TUITION_CENTS,
  TUITION_DOLLARS,
} from '@/lib/cosmetology/pricing';
import { createWeeklySubscriptionAfterCheckout } from '@/lib/enrollment/create-weekly-subscription-after-checkout';
import { createOrUpdateEnrollment, linkOrphanedEnrollments } from '@/lib/enrollment-service';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const LMS_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl) + '/lms/courses';

function getWebhookSecrets(): string[] {
  return [
    process.env.STRIPE_WEBHOOK_SECRET_COSMETOLOGY,
    process.env.STRIPE_WEBHOOK_SECRET,
  ].filter((s): s is string => Boolean(s && s.trim()));
}

function constructStripeEventWithAnySecret(
  stripe: Stripe,
  body: string,
  signature: string,
  secrets: string[],
): Stripe.Event {
  let lastError: unknown = null;
  for (const secret of secrets) {
    try {
      return stripe.webhooks.constructEvent(body, signature, secret);
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError ?? new Error('No webhook secret available');
}

/**
 * POST /api/cosmetology/webhook
 *
 * Handles Stripe webhook events for Cosmetology Apprenticeship payments.
 * Mirrors /api/barber/webhook — same flow, cosmetology program.
 *
 * On checkout.session.completed:
 * 1. Create program_enrollment record
 * 2. Run post-payment pipeline (emails, CRM, admin notification)
 */
async function _POST(request: NextRequest) {
  // Hydrate secrets from runtime stores before reading any STRIPE_* env vars.
  try {
    await hydrateProcessEnv();
  } catch (err) {
    logger.error('[cosmetology/webhook] hydrateProcessEnv failed — continuing with process.env as-is', err as Error);
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ received: true, warning: 'no_signature' }, { status: 200 });
  }

  const stripe = getStripe();
  if (!stripe) {
    // Return 200 — misconfiguration, retrying won't help and 503 causes Stripe to disable the endpoint.
    logger.error('[cosmetology/webhook] Stripe client unavailable — STRIPE_SECRET_KEY missing or invalid');
    return NextResponse.json({ received: true, warning: 'stripe_not_configured' }, { status: 200 });
  }

  const webhookSecrets = getWebhookSecrets();
  let event: Stripe.Event;

  try {
    event = constructStripeEventWithAnySecret(stripe, body, signature, webhookSecrets);
  } catch (err) {
    logger.error("[cosmetology/webhook] Signature verification failed: " + String(err));
    return NextResponse.json({ received: true, warning: 'invalid_signature' }, { status: 200 });
  }

  const supabase = await getAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;

        // Only process cosmetology enrollments
        if (session.metadata?.program !== 'cosmetology-apprenticeship') {
          break;
        }

        const checkoutType = session.metadata?.checkout_type;
        const customerId = session.customer as string;
        const customerEmail = session.customer_details?.email || session.customer_email || '';
        const customerName = session.customer_details?.name || session.metadata?.customerName || '';
        const customerPhone = session.metadata?.customerPhone || '';
        const applicationId = session.metadata?.application_id || '';
        const amountPaidCents = session.amount_total || 0;
        const weeksRemaining = parseInt(session.metadata?.weeks_remaining || '29', 10);
        const weeklyPaymentCents = parseInt(session.metadata?.weekly_payment_cents || '0', 10);
        const adjustedPriceCents = parseInt(session.metadata?.adjusted_price_cents || String(TUITION_CENTS), 10);
        const fullyPaid = amountPaidCents >= adjustedPriceCents;
        const remainingBalanceCents = Math.max(0, adjustedPriceCents - amountPaidCents);

        if (checkoutType === 'cosmetology_enrollment') {
          const paymentType = session.metadata?.payment_type;
          const hoursPerWeek = parseInt(session.metadata?.hours_per_week || '0', 10);
          const transferredHours = parseInt(session.metadata?.transfer_hours_claimed || '0', 10);
          const fullyPaidEnrollment =
            paymentType === 'pay_in_full' || fullyPaid;

          const { error: subRecordError } = await supabase.from('cosmetology_subscriptions').insert({
            stripe_customer_id: customerId,
            customer_email: customerEmail,
            customer_name: customerName,
            customer_phone: customerPhone,
            status: 'active',
            full_tuition_amount: TUITION_DOLLARS,
            amount_paid_at_checkout: amountPaidCents / 100,
            remaining_balance: remainingBalanceCents / 100,
            payment_method: 'card',
            fully_paid: fullyPaidEnrollment,
            weekly_payment_cents: fullyPaidEnrollment ? 0 : weeklyPaymentCents,
            weeks_remaining: fullyPaidEnrollment ? 0 : weeksRemaining,
            hours_per_week: hoursPerWeek,
            transferred_hours_verified: transferredHours,
            payment_model: fullyPaidEnrollment ? 'paid_in_full' : 'invoices',
            created_at: new Date().toISOString(),
          });
          if (subRecordError) {
            logger.error("[cosmetology/webhook] cosmetology_subscriptions insert error: " + String(subRecordError));
          }

          if (!fullyPaidEnrollment && weeklyPaymentCents > 0 && weeksRemaining > 0) {
            const billing = await createWeeklySubscriptionAfterCheckout({
              stripe,
              supabase,
              session,
              customerId,
              customerEmail,
              applicationId,
              weeklyPaymentCents,
              invoiceWeeks: weeksRemaining,
              fullyPaid: fullyPaidEnrollment,
              subscriptionsTable: 'cosmetology_subscriptions',
              productName: 'Cosmetology Apprenticeship — Weekly Tuition',
              programSlug: 'cosmetology-apprenticeship',
            });
            if (billing.error) {
              try {
                const { sendEmail } = await import('@/lib/email/sendgrid');
                await sendEmail({
                  to: 'elevate4humanityedu@gmail.com',
                  subject: '⚠️ Cosmetology weekly billing setup failed — manual action required',
                  html: `<p>Student: ${customerEmail}<br>Customer ID: ${customerId}<br>Weekly: $${(weeklyPaymentCents / 100).toFixed(2)}<br>Weeks: ${weeksRemaining}</p><p>Error: ${billing.error}</p>`,
                });
              } catch {
                /* non-fatal */
              }
            }
          }

          if (applicationId) {
            await supabase
              .from('applications')
              .update({
                payment_status: 'paid',
                payment_intent_id: (session.payment_intent as string) ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', applicationId);
          }

          // Write program_enrollments row
          const normalizedEmail = customerEmail.toLowerCase().trim();
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          let resolvedProgramId = session.metadata?.program_id || '';
          if (!UUID_RE.test(resolvedProgramId)) {
            const { data: prog } = await supabase
              .from('programs')
              .select('id')
              .eq('slug', 'cosmetology-apprenticeship')
              .maybeSingle();
            resolvedProgramId = prog?.id || COSMETOLOGY_PROGRAM_ID;
          }

          const enrollResult = await createOrUpdateEnrollment(supabase, {
            userId: null as unknown as string,
            programId: resolvedProgramId,
            programSlug: 'cosmetology-apprenticeship',
            courseId: COSMETOLOGY_COURSE_ID,
            fundingSource: 'self_pay',
            amountPaidCents,
            stripeCheckoutSessionId: session.id,
            isDeposit: !fullyPaid,
            email: normalizedEmail,
            fullName: customerName,
            status: 'pending_review',
            paymentStatus: fullyPaid ? 'paid_in_full' : 'setup_fee_paid',
          });

          if (enrollResult.error) {
            logger.error("[cosmetology/webhook] program_enrollments write failed: " + String(enrollResult.error));
          } else {
            logger.info(`[cosmetology/webhook] program_enrollments ${enrollResult.action}: ${enrollResult.id}`);
          }

          // Link to account if one exists
          await linkOrphanedEnrollments(supabase, normalizedEmail).then(()=>{}, ()=>{});

          // Send confirmation email
          try {
            const { sendEmail } = await import('@/lib/email/sendgrid');
            const paymentSummary = fullyPaid
              ? `Paid in full: $${(amountPaidCents / 100).toLocaleString()}`
              : `Setup fee paid: $${(amountPaidCents / 100).toFixed(2)} — $${(weeklyPaymentCents / 100).toFixed(2)}/week for ~${weeksRemaining} weeks`;

            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
            await sendEmail({
              to: customerEmail,
              subject: 'Payment Received — Complete Your Cosmetology Apprenticeship Application',
              html: `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a">
<p>Hi ${customerName || 'there'},</p>
<p>Your payment for the <strong>Cosmetology Apprenticeship</strong> program has been received. Your spot is reserved.</p>
<p><strong>Payment:</strong> ${paymentSummary}</p>
<p style="font-size:16px;font-weight:bold;margin:24px 0 8px">Your next steps — complete in order:</p>
<ol style="line-height:2;margin:0 0 20px;padding-left:20px">
  <li><strong>Create your account</strong> — use the same email address you used at checkout.<br>
  <a href="${siteUrl}/signup?role=apprentice&redirect=/programs/cosmetology-apprenticeship/apply" style="color:#1d4ed8">Create Account →</a></li>
  <li><strong>Complete your application</strong> — submit your apprentice application so we can verify eligibility and match you with a host shop.</li>
  <li><strong>Complete orientation</strong> — a short online module covering program expectations, hour logging, and your host shop assignment.</li>
  <li><strong>Access your dashboard</strong> — log hours, track progress, and access your coursework in the Elevate LMS once orientation is complete.</li>
</ol>
<p>Questions? Call <a href="tel:${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a> or reply to this email.</p>
<p>— ${PLATFORM_DEFAULTS.orgName}</p>
</div>`,
            });

            await sendEmail({
              to: 'elevate4humanityedu@gmail.com',
              subject: `New Cosmetology Apprentice — ${customerName || customerEmail}`,
              html: `<p>New enrollment via public checkout:</p>
<p>Name: ${customerName}<br>Email: ${customerEmail}<br>Phone: ${customerPhone}<br>
Payment: ${fullyPaid ? 'Paid in full' : 'Setup fee'}<br>
Amount paid: $${(amountPaidCents / 100).toFixed(2)}</p>
<p><a href="${process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl}/admin/enrollments">View in Admin →</a></p>`,
            });
          } catch (emailErr) {
            logger.error('[cosmetology/webhook] Enrollment email error:', emailErr);
          }

          // Run post-payment pipeline if application_id present
          if (applicationId) {
            await runCosmetologyPostPayment({
              db: supabase,
              applicationId,
              stripeSessionId: session.id,
              stripePaymentIntentId: session.payment_intent as string ?? null,
              amountPaidCents,
            }).catch((err: unknown) =>
              logger.error('[cosmetology/webhook] runCosmetologyPostPayment failed (non-fatal)', err),
            );
          } else {
            // No application — send LMS access email
            try {
              const { sendEmail } = await import('@/lib/email/sendgrid');
              await sendEmail({
                to: customerEmail,
                subject: 'Your Coursework Access — Cosmetology Apprenticeship',
                html: `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a">
<p>Hi ${customerName || 'there'},</p>
<p>Your related instruction is available in the <strong>Elevate LMS</strong>. Log in to your student portal to access your courses.</p>
<p style="text-align:center;margin:24px 0;">
  <a href="${LMS_URL}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Go to My Courses →</a>
</p>
<p>Questions? Call <a href="tel:${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a>.</p>
<p>— ${PLATFORM_DEFAULTS.orgName}</p>
</div>`,
              });
            } catch { /* non-fatal */ }
          }

          logger.info(`[cosmetology/webhook] Enrollment complete: ${customerId}, fullyPaid: ${fullyPaid}`);
          break;
        }

        logger.warn('[cosmetology/webhook] Unknown checkout_type — skipping', { checkoutType });
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.metadata?.program !== 'cosmetology-apprenticeship') break;
        await supabase
          .from('cosmetology_subscriptions')
          .update({
            status: subscription.status,
            current_period_start: new Date((subscription as any).current_period_start * 1000).toISOString(),
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        logger.info(`[cosmetology/webhook] Subscription updated: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        if (subscription.metadata?.program !== 'cosmetology-apprenticeship') break;
        await supabase
          .from('cosmetology_subscriptions')
          .update({
            status: 'canceled',
            payment_status: 'cancelled',
            canceled_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);
        logger.info(`[cosmetology/webhook] Subscription canceled: ${subscription.id}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        // Stripe SDK v19+ returns subscription as object or string
        const subscriptionId = typeof invoice.subscription === 'object'
          ? (invoice.subscription as { id?: string })?.id
          : invoice.subscription;
        if (!subscriptionId) break;
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.metadata?.program !== 'cosmetology-apprenticeship') break;

        const { data: subRecord } = await supabase
          .from('cosmetology_subscriptions')
          .select('id, user_id, customer_email, customer_name, weeks_remaining, payment_status')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle();

        if (subRecord) {
          const newWeeksRemaining = Math.max(0, (subRecord.weeks_remaining ?? 1) - 1);
          const fullyPaid = newWeeksRemaining === 0;
          await supabase
            .from('cosmetology_subscriptions')
            .update({
              weeks_remaining: newWeeksRemaining,
              fully_paid: fullyPaid,
              payment_status: fullyPaid ? 'paid_in_full' : 'active',
              status: fullyPaid ? 'completed' : 'active',
              last_payment_date: new Date().toISOString(),
              next_payment_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
              failed_payment_at: null,
              suspension_deadline: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subRecord.id);

          // Log to billing_events
          await supabase.from('billing_events').insert({
            event_type: 'invoice_paid',
            stripe_invoice_id: invoice.id,
            metadata: {
              user_id: subRecord.user_id,
              program: 'cosmetology-apprenticeship',
              amount_paid: invoice.amount_paid,
              weeks_remaining: newWeeksRemaining,
            },
          }).then(()=>{}, ()=>{});
        }

        logger.info(`[cosmetology/webhook] Invoice paid: ${invoice.id}`);
        break;
      }

      case 'invoice.payment_failed':
      case 'payment_intent.payment_failed': {
        const failedObj = event.data.object as Stripe.Invoice | Stripe.PaymentIntent;
        const failedCustomerId = 'customer' in failedObj
          ? (typeof failedObj.customer === 'string' ? failedObj.customer : (failedObj.customer as any)?.id)
          : undefined;
        if (!failedCustomerId) break;

        const { data: sub } = await supabase
          .from('cosmetology_subscriptions')
          .select('id, customer_email, payment_status, failed_payment_at')
          .eq('stripe_customer_id', failedCustomerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!sub) break;

        const isFirstFailure = !sub.failed_payment_at &&
          !['past_due', 'suspended', 'cancelled'].includes(sub.payment_status ?? '');

        if (isFirstFailure) {
          await supabase
            .from('cosmetology_subscriptions')
            .update({
              payment_status: 'past_due',
              failed_payment_at: new Date().toISOString(),
              suspension_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);

          try {
            const { sendEmail } = await import('@/lib/email/sendgrid');
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
            await sendEmail({
              to: sub.customer_email!,
              subject: '⚠️ Payment Failed — Action Required to Keep Your Enrollment',
              html: `<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif"><p style="font-size:18px;font-weight:bold;color:#dc2626">Your weekly tuition payment failed.</p><p>We were unable to charge your card for your Cosmetology Apprenticeship weekly payment.</p><p><strong>Update your payment method immediately:</strong></p><p style="margin:24px 0"><a href="${siteUrl}/learner/dashboard" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">Update Payment Method →</a></p><p style="color:#dc2626;font-weight:bold">If not resolved within 7 days, your account will be suspended from logging hours.</p><p>Call <a href="tel:${PLATFORM_DEFAULTS.supportPhone}">${PLATFORM_DEFAULTS.supportPhone}</a> if you need help.</p><p>— ${PLATFORM_DEFAULTS.orgName}</p></div>`,
            });
          } catch { /* non-fatal */ }
        }

        logger.warn('[cosmetology/webhook] Payment failed', { failedCustomerId, isFirstFailure });
        break;
      }

      default:
        logger.info(`[cosmetology/webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    // Return 200 so Stripe does not disable the endpoint. Event is logged and
    // can be replayed from the Stripe dashboard once the bug is fixed.
    logger.error('[cosmetology/webhook] Handler error:', err);
    return NextResponse.json({ received: true, warning: 'handler_error' }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}

export const POST = withRuntime(withApiAudit('/api/cosmetology/webhook', _POST, { actor_type: 'webhook' }));
