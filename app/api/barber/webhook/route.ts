import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { BARBER_PRICING, calculateWeeklyPayment } from '@/lib/programs/pricing';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { runBarberPostPayment } from '@/lib/enrollment/barber-post-payment';

const LMS_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org') + '/lms/courses';

/**
 * Schedule weekly invoices for a customer
 * Creates invoice items for each Friday until program completion
 */
async function scheduleWeeklyInvoices(
  stripe: Stripe,
  params: {
    customerId: string;
    customerEmail: string;
    weeksRemaining: number;
    weeklyPaymentCents: number;
    hoursPerWeek: number;
    transferredHours: number;
    applicationId?: string;
  }
) {
  const { customerId, weeksRemaining, weeklyPaymentCents } = params;

  // Get next Friday
  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysUntilFriday = dayOfWeek === 5 ? 7 : (5 - dayOfWeek + 7) % 7 || 7;
  
  // Schedule invoices for each week
  for (let week = 0; week < weeksRemaining; week++) {
    const invoiceDate = new Date(now);
    invoiceDate.setDate(now.getDate() + daysUntilFriday + (week * 7));
    invoiceDate.setHours(10, 0, 0, 0); // 10 AM

    // Create invoice item scheduled for that date
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: weeklyPaymentCents,
      currency: 'usd',
      description: `Barber Apprenticeship - Week ${week + 1} of ${weeksRemaining}`,
      metadata: {
        program: 'barber-apprenticeship',
        week_number: (week + 1).toString(),
        total_weeks: weeksRemaining.toString(),
      },
    });

    // Create and finalize the invoice to be sent on that date
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 3, // 3 days to pay
      auto_advance: true,
      metadata: {
        program: 'barber-apprenticeship',
        week_number: (week + 1).toString(),
      },
    });

    // Schedule the invoice to be sent on the Friday
    // Note: Stripe will auto-send when finalized if collection_method is send_invoice
    await stripe.invoices.finalizeInvoice(invoice.id);
  }

  logger.info(`Scheduled ${weeksRemaining} weekly invoices for customer ${customerId}`);
}
function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET_BARBER || process.env.STRIPE_WEBHOOK_SECRET || '';
}

/**
 * POST /api/barber/webhook
 * 
 * Handles Stripe webhook events for Barber Apprenticeship subscriptions.
 * 
 * On checkout.session.completed (deposit paid):
 * 1. Store subscription details
 * 2. Create/upsert apprentice record
 * 3. Generate magic link for dashboard access
 * 4. Send welcome email (idempotent)
 * 5. Send LMS access email (idempotent)
 */
async function _POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: Stripe.Event;
  const stripe = getStripe();
  const webhookSecret = getWebhookSecret();

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Webhook handlers must use the admin (service role) client — there is no user session.
  // createAdminClient() throws if env vars are missing, which is the correct behaviour.
  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Only process barber enrollments
        if (session.metadata?.program !== 'barber-apprenticeship') {
          break;
        }

        const customerId = session.customer as string;
        const customerEmail = session.customer_details?.email || session.customer_email || '';
        const customerName = session.customer_details?.name || session.metadata?.customer_name || '';
        // Public checkout stores as customerPhone; auth checkout as customer_phone
        const customerPhone = session.metadata?.customerPhone || session.metadata?.customer_phone || '';
        const applicationId = session.metadata?.application_id || session.metadata?.applicationId;
        const checkoutType = session.metadata?.checkout_type;

        // Handle full tuition payment (with BNPL support)
        if (checkoutType === 'barber_full_tuition') {
          const fullTuitionCents = parseInt(session.metadata?.full_tuition_cents || '498000');
          const amountPaidCents = session.amount_total || 0;
          const weeksRemaining = parseInt(session.metadata?.weeks_remaining || '50');
          const hoursPerWeek = parseInt(session.metadata?.hours_per_week || '40');
          const transferredHours = parseInt(session.metadata?.transferHours || '0');
          
          // Check payment method used
          const paymentIntent = session.payment_intent as string;
          let paymentMethodType = 'card';
          let bnplProvider = null;
          
          if (paymentIntent) {
            try {
              const pi = await stripe.paymentIntents.retrieve(paymentIntent);
              paymentMethodType = pi.payment_method_types?.[0] || 'card';
              if (['affirm', 'klarna', 'afterpay_clearpay'].includes(paymentMethodType)) {
                bnplProvider = paymentMethodType;
              }
            } catch (e) {
              logger.error('Failed to retrieve payment intent:', e);
            }
          }

          // Calculate remaining balance (if any)
          const remainingBalanceCents = fullTuitionCents - amountPaidCents;
          const fullyPaid = remainingBalanceCents <= 0;

          // If BNPL fully approved or paid in full with card: no weekly invoices needed
          // If partial payment or remaining balance: schedule weekly invoices
          let weeklyPaymentCents = 0;
          let invoiceWeeks = 0;

          if (!fullyPaid && remainingBalanceCents > 0) {
            // Calculate weekly payments for remaining balance
            invoiceWeeks = weeksRemaining;
            weeklyPaymentCents = Math.ceil(remainingBalanceCents / invoiceWeeks);

            // NOTE: Weekly invoices are NOT pre-created here.
            // Pre-creating all 29 invoices at once sends 29 emails to the student immediately.
            // Weekly billing is handled by the Stripe subscription created at checkout
            // (barber/checkout route, subscription mode) or by a cron job.
            // The weeklyPaymentCents value is stored on barber_subscriptions for reference.
            logger.info(`[barber/webhook] Payment plan: $${(weeklyPaymentCents / 100).toFixed(2)}/week for ${invoiceWeeks} weeks — billing handled by subscription`);
          }

          // Create enrollment record
          await supabase.from('barber_subscriptions').insert({
            stripe_customer_id: customerId,
            customer_email: customerEmail,
            customer_name: customerName,
            status: 'active',
            full_tuition_amount: BARBER_PRICING.fullPrice,
            amount_paid_at_checkout: amountPaidCents / 100,
            remaining_balance: remainingBalanceCents / 100,
            payment_method: paymentMethodType,
            bnpl_provider: bnplProvider,
            fully_paid: fullyPaid,
            weekly_payment_cents: weeklyPaymentCents,
            weeks_remaining: fullyPaid ? 0 : invoiceWeeks,
            hours_per_week: hoursPerWeek,
            transferred_hours_verified: transferredHours,
            payment_model: fullyPaid ? 'paid_in_full' : 'invoices',
            created_at: new Date().toISOString(),
          });

          // Update applications.payment_status so the admin approval gate passes
          if (applicationId) {
            const appUpdateResult = await supabase
              .from('applications')
              .update({
                payment_status: 'paid',
                payment_intent_id: session.payment_intent as string ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', applicationId);
            if (appUpdateResult?.error) {
              logger.error('[barber/webhook] applications payment_status update (full_tuition) failed (non-fatal):', appUpdateResult.error);
            }
          }


          // ── Wire weekly billing via Stripe subscription ──────────────────
          // Only for card payments on a payment plan (BNPL providers manage
          // their own schedules; fully-paid students have no recurring balance).
          if (!fullyPaid && !bnplProvider && weeklyPaymentCents > 0) {
            try {
              // Retrieve the payment method saved during checkout
              const checkoutSession = await stripe.checkout.sessions.retrieve(
                session.id,
                { expand: ['payment_intent.payment_method'] }
              );
              const pi = checkoutSession.payment_intent as Stripe.PaymentIntent | null;
              const pmId = typeof pi?.payment_method === 'string'
                ? pi.payment_method
                : (pi?.payment_method as Stripe.PaymentMethod | null)?.id;

              if (pmId) {
                // Attach payment method to customer and set as default
                await stripe.paymentMethods.attach(pmId, { customer: customerId }).catch(() => {});
                await stripe.customers.update(customerId, {
                  invoice_settings: { default_payment_method: pmId },
                });

                // Create a one-time price for the weekly amount
                const weeklyPrice = await stripe.prices.create({
                  currency: 'usd',
                  unit_amount: weeklyPaymentCents,
                  recurring: { interval: 'week', interval_count: 1 },
                  product_data: { name: 'Barber Apprenticeship — Weekly Tuition' },
                });

                // Billing anchor: next Friday at 10 AM ET
                const billingAnchor = Math.floor(getBillingCycleAnchor().getTime() / 1000);

                const subscription = await stripe.subscriptions.create({
                  customer: customerId,
                  items: [{ price: weeklyPrice.id }],
                  billing_cycle_anchor: billingAnchor,
                  proration_behavior: 'none',
                  cancel_at_period_end: false,
                  metadata: {
                    program: 'barber-apprenticeship',
                    weeks_remaining: invoiceWeeks.toString(),
                    application_id: applicationId || '',
                  },
                  // Cancel automatically after all weeks are billed
                  cancel_at: Math.floor(
                    (getBillingCycleAnchor().getTime() + invoiceWeeks * 7 * 24 * 60 * 60 * 1000) / 1000
                  ),
                });

                // Store subscription ID on the enrollment record
                await supabase
                  .from('barber_subscriptions')
                  .update({ stripe_subscription_id: subscription.id })
                  .eq('stripe_customer_id', customerId)
                  .order('created_at', { ascending: false })
                  .limit(1);

                logger.info('[Barber Webhook] Weekly subscription created', {
                  customerId,
                  subscriptionId: subscription.id,
                  weeklyPaymentCents,
                  weeks: invoiceWeeks,
                });
              } else {
                logger.warn('[Barber Webhook] No payment method found — weekly billing not scheduled', { customerId });
              }
            } catch (billingErr) {
              // Non-fatal — log and alert admin but do not block enrollment
              logger.error('[Barber Webhook] Failed to create weekly subscription', { customerId, billingErr });
              try {
                const { sendEmail } = await import('@/lib/email/sendgrid');
                await sendEmail({
                  to: 'elevate4humanityedu@gmail.com',
                  subject: '⚠️ Weekly billing setup failed — manual action required',
                  html: `<p>Student: ${customerEmail}<br>Customer ID: ${customerId}<br>Weekly amount: $${(weeklyPaymentCents / 100).toFixed(2)}<br>Weeks: ${invoiceWeeks}</p><p>Stripe subscription was not created. Set up manually in Stripe dashboard.</p>`,
                });
              } catch { /* non-fatal */ }
            }
          }

          // Run post-payment pipeline (enrollment, emails)
          if (applicationId) {
            const adminDb = createAdminClient();
            if (adminDb) {
              await runBarberPostPayment({
                db: adminDb,
                applicationId,
                stripeSessionId: session.id,
                stripePaymentIntentId: session.payment_intent as string ?? null,
                amountPaidCents,
              }).catch((err: unknown) => logger.error('[barber/webhook] runBarberPostPayment failed (non-fatal)', err));
            }
          } else {
            // No application_id — send legacy welcome email
            try {
            const { sendEmail } = await import('@/lib/email/sendgrid');
            let paymentSummary = '';
            if (fullyPaid) {
              if (bnplProvider) {
                paymentSummary = `• Paid via ${bnplProvider.charAt(0).toUpperCase() + bnplProvider.slice(1)}: $${BARBER_PRICING.fullPrice.toLocaleString()}<br>
• ${bnplProvider === 'affirm' ? 'Affirm will handle your payment schedule' : 'Your payments are managed by ' + bnplProvider}`;
              } else {
                paymentSummary = `• Paid in full: $${BARBER_PRICING.fullPrice.toLocaleString()}<br>
• No additional payments required!`;
              }
            } else {
              paymentSummary = `• Amount paid today: $${(amountPaidCents / 100).toFixed(2)}<br>
• Remaining balance: $${(remainingBalanceCents / 100).toFixed(2)}<br>
• Weekly payment: $${(weeklyPaymentCents / 100).toFixed(2)} for ~${invoiceWeeks} weeks`;
            }

            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
            await sendEmail({
              to: customerEmail,
              subject: 'Payment Received — Complete Your Barber Apprenticeship Application',
              html: `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a">
<p>Hi ${customerName || 'there'},</p>

<p>Your payment for the <strong>Barber Apprenticeship</strong> program has been received. Your spot is reserved.</p>

<p><strong>Payment:</strong> ${paymentSummary}</p>

<p style="font-size:16px;font-weight:bold;margin:24px 0 8px">Your next steps — complete in order:</p>
<ol style="line-height:2;margin:0 0 20px;padding-left:20px">
  <li><strong>Complete your application</strong> — submit your apprentice application so we can verify eligibility and match you with a host shop.<br>
  <a href="${siteUrl}/programs/barber-apprenticeship/apply?type=apprentice" style="color:#1d4ed8">Complete Application →</a></li>
  <li><strong>Complete orientation</strong> — a short online module covering program expectations, hour logging, and your host shop assignment. Available after your application is submitted.</li>
  <li><strong>Access your dashboard</strong> — log hours, track progress, and access your coursework in the Elevate LMS once orientation is complete.</li>
</ol>

${!fullyPaid ? `<p><strong>Payment plan:</strong> Weekly invoices will arrive every Friday starting next week.</p>` : ''}

<p>Questions? Call <a href="tel:3173143757">(317) 314-3757</a> or reply to this email.</p>
<p>— Elevate for Humanity</p>
</div>
              `,
            });
          } catch (emailErr) {
            logger.error('Failed to send welcome email:', emailErr);
          }

          // Admin notification
          try {
            const { sendEmail } = await import('@/lib/email/sendgrid');
            await sendEmail({
              to: 'elevate4humanityedu@gmail.com',
              subject: `New Barber Apprentice - ${customerName || customerEmail}`,
              html: `
<p>New barber apprentice enrolled:</p>
<p>• Name: ${customerName}<br>
• Email: ${customerEmail}<br>
• Phone: ${customerPhone}<br>
• Transfer Hours: ${transferredHours}<br>
• Payment: ${fullyPaid ? 'Paid in full' : 'Payment plan'}</p>
              `,
            });
          } catch (emailErr) {
            logger.error('Failed to send admin notification:', emailErr);
          }
          } // end else (no applicationId — legacy email path)

          logger.info(`Barber enrollment complete: ${customerId}, fullyPaid: ${fullyPaid}, bnpl: ${bnplProvider}`);
          break;
        }

        // Public (unauthenticated) enrollment — payment_plan or pay_in_full
        if (checkoutType === 'barber_enrollment') {
          const paymentType = session.metadata?.payment_type || 'payment_plan';
          const amountPaidCents = session.amount_total || 0;
          const weeksRemaining = parseInt(session.metadata?.weeks_remaining || '50');
          const hoursPerWeek = parseInt(session.metadata?.hours_per_week || '40');
          const transferredHours = parseInt(session.metadata?.transferHours || session.metadata?.transferredHours || '0');
          const weeklyPaymentCents = parseInt(session.metadata?.weekly_payment_cents || '0');
          const adjustedPriceCents = parseInt(session.metadata?.adjusted_price_cents || '498000');
          const fullyPaid = paymentType === 'pay_in_full' || amountPaidCents >= adjustedPriceCents;
          const remainingBalanceCents = Math.max(0, adjustedPriceCents - amountPaidCents);

          // NOTE: Weekly invoices are NOT pre-created here.
          // Pre-creating all 29 invoices at once sends 29 emails to the student immediately.
          // Weekly billing is handled by the Stripe subscription or a cron job.
          if (!fullyPaid && weeklyPaymentCents > 0 && weeksRemaining > 0) {
            logger.info(`[barber/webhook] Payment plan: $${(weeklyPaymentCents / 100).toFixed(2)}/week for ${weeksRemaining} weeks — billing handled by subscription`);
          }

          const { data: subRecord } = await supabase.from('barber_subscriptions').insert({
            stripe_customer_id: customerId,
            customer_email: customerEmail,
            customer_name: customerName,
            customer_phone: customerPhone,
            status: 'active',
            full_tuition_amount: BARBER_PRICING.fullPrice,
            amount_paid_at_checkout: amountPaidCents / 100,
            remaining_balance: remainingBalanceCents / 100,
            payment_method: 'card',
            fully_paid: fullyPaid,
            weekly_payment_cents: fullyPaid ? 0 : weeklyPaymentCents,
            weeks_remaining: fullyPaid ? 0 : weeksRemaining,
            hours_per_week: hoursPerWeek,
            transferred_hours_verified: transferredHours,
            payment_model: fullyPaid ? 'paid_in_full' : 'invoices',
            created_at: new Date().toISOString(),
          }).select('id').single();
          if (subRecord?.error) {
            logger.error('barber_subscriptions insert error:', subRecord.error);
          }

          // Update applications.payment_status so the admin approval gate passes
          if (applicationId) {
            const enrollAppUpdate = await supabase
              .from('applications')
              .update({
                payment_status: 'paid',
                payment_intent_id: session.payment_intent as string ?? null,
                updated_at: new Date().toISOString(),
              })
              .eq('id', applicationId);
            if (enrollAppUpdate?.error) {
              logger.error('[barber/webhook] applications payment_status update failed (non-fatal):', enrollAppUpdate.error);
            }
          }

          // Normalize email so the account-linking query in auth/confirm matches
          // regardless of how Stripe or the user cased it at checkout.
          const normalizedEmail = customerEmail.toLowerCase().trim();

          // Create program_enrollments row via canonical service.
          // user_id is null — public checkout has no Supabase account yet.
          // linkOrphanedEnrollments() in auth/confirm links it by email on first login.
          const { createOrUpdateEnrollment, linkOrphanedEnrollments } = await import('@/lib/enrollment-service');
          // Resolve program UUID — metadata.program_id is set by checkout/public.
          // Fall back to DB lookup by slug if missing (legacy sessions).
          const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          let resolvedProgramId = session.metadata?.program_id || '';
          if (!UUID_RE.test(resolvedProgramId)) {
            const { data: prog } = await supabase
              .from('programs')
              .select('id')
              .eq('slug', 'barber-apprenticeship')
              .single();
            resolvedProgramId = prog?.id || '5ff21fcb-1968-41fd-99d3-37d69a31bd5c';
          }
          const enrollResult = await createOrUpdateEnrollment(supabase, {
            userId: null as unknown as string, // linked by email post-signup
            programId: resolvedProgramId,
            programSlug: 'barber-apprenticeship',
            fundingSource: 'self_pay',
            amountPaidCents,
            stripeCheckoutSessionId: session.id,
            isDeposit: !fullyPaid,
            email: normalizedEmail,
            fullName: customerName,
            status: fullyPaid ? 'active' : 'deposit_paid',
            paymentStatus: fullyPaid ? 'paid_in_full' : 'setup_fee_paid',
          });
          if (enrollResult.error) {
            logger.error('[barber/webhook] program_enrollments write failed:', enrollResult.error);
          } else {
            logger.info(`[barber/webhook] program_enrollments ${enrollResult.action}: ${enrollResult.id}`);
          }
          // Link to account if one already exists for this email
          await linkOrphanedEnrollments(supabase, normalizedEmail).catch(() => {});

          // Send enrollment confirmation email
          try {
            const { sendEmail } = await import('@/lib/email/sendgrid');
            const paymentSummary = fullyPaid
              ? `Paid in full: $${(amountPaidCents / 100).toLocaleString()}`
              : `Setup fee paid: $${(amountPaidCents / 100).toFixed(2)} — $${(weeklyPaymentCents / 100).toFixed(2)}/week for ~${weeksRemaining} weeks`;

            const siteUrl2 = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
            await sendEmail({
              to: customerEmail,
              subject: 'Payment Received — Complete Your Barber Apprenticeship Application',
              html: `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a">
<p>Hi ${customerName || 'there'},</p>

<p>Your payment for the <strong>Barber Apprenticeship</strong> program has been received. Your spot is reserved.</p>

<p><strong>Payment:</strong> ${paymentSummary}</p>

<p style="font-size:16px;font-weight:bold;margin:24px 0 8px">Your next steps — complete in order:</p>
<ol style="line-height:2;margin:0 0 20px;padding-left:20px">
  <li><strong>Create your account</strong> — use the same email address you used at checkout.<br>
  <a href="${siteUrl2}/signup?role=apprentice&redirect=/programs/barber-apprenticeship/apply?type=apprentice" style="color:#1d4ed8">Create Account →</a></li>
  <li><strong>Complete your application</strong> — submit your apprentice application so we can verify eligibility and match you with a host shop.</li>
  <li><strong>Complete orientation</strong> — a short online module covering program expectations, hour logging, and your host shop assignment.</li>
  <li><strong>Access your dashboard</strong> — log hours, track progress, and access your coursework in the Elevate LMS once orientation is complete.</li>
</ol>

${!fullyPaid ? `<p><strong>Payment plan:</strong> Weekly invoices will arrive every Friday starting next week.</p>` : ''}

<p>Questions? Call <a href="tel:3173143757">(317) 314-3757</a> or reply to this email.</p>
<p>— Elevate for Humanity</p>
</div>
              `,
            });

            // Admin notification
            await sendEmail({
              to: 'elevate4humanityedu@gmail.com',
              subject: `New Barber Apprentice — ${customerName || customerEmail}`,
              html: `<p>New enrollment via public checkout:</p>
<p>Name: ${customerName}<br>Email: ${customerEmail}<br>Phone: ${customerPhone}<br>
Transfer Hours: ${transferredHours}<br>Payment: ${paymentType}<br>
Amount paid: $${(amountPaidCents / 100).toFixed(2)}</p>`,
            });
          } catch (emailErr) {
            logger.error('Enrollment email error:', emailErr);
          }

          // Run post-payment pipeline (enrollment, onboarding + admin emails)
          if (applicationId) {
            const adminDb = createAdminClient();
            if (adminDb) {
              await runBarberPostPayment({
                db: adminDb,
                applicationId,
                stripeSessionId: session.id,
                stripePaymentIntentId: session.payment_intent as string ?? null,
                amountPaidCents,
              }).catch((err: unknown) => logger.error('[barber/webhook] runBarberPostPayment (enrollment) failed (non-fatal)', err));
            }
          }

          // No application_id — send LMS access email (legacy public checkout path)
          if (!applicationId) { try {
            const { sendEmail } = await import('@/lib/email/sendgrid');
            const siteUrl3 = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
            await sendEmail({
              to: customerEmail,
              subject: 'Your Coursework Access — Barber Apprenticeship',
              html: `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a">
<p>Hi ${customerName || 'there'},</p>
<p>Your related instruction is available in the <strong>Elevate LMS</strong>. Log in to your student portal to access your courses.</p>
<p style="text-align:center;margin:24px 0;">
  <a href="${LMS_URL}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Go to My Courses →</a>
</p>
<p>Questions? Call <a href="tel:3173143757">(317) 314-3757</a>.</p>
<p>— Elevate for Humanity</p>
</div>
              `,
            });
          } catch (lmsEmailErr) {
            logger.error('[barber/webhook] LMS access email failed (non-fatal):', lmsEmailErr);
          }
          } // end if (!applicationId) — legacy path

          logger.info(`Barber public enrollment complete: ${customerEmail}, fullyPaid: ${fullyPaid}`);
          break;
        }

        // Legacy subscription-based flow (for existing enrollments)
        const subscriptionId = session.subscription as string;
        const userId = session.metadata?.user_id;
        const enrollmentId = session.metadata?.enrollment_id;

        if (!subscriptionId || !userId) {
          logger.error('Missing subscription or user ID for legacy flow');
          break;
        }

        // Get subscription details
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Store subscription in database with email tracking fields
        const { data: subscriptionRecord } = await supabase.from('barber_subscriptions').upsert({
          user_id: userId,
          enrollment_id: enrollmentId || null,
          stripe_subscription_id: subscriptionId,
          stripe_customer_id: session.customer as string,
          customer_email: customerEmail,
          customer_name: customerName,
          status: subscription.status,
          setup_fee_paid: true,
          setup_fee_amount: BARBER_PRICING.setupFee,
          weekly_payment_cents: parseInt(subscription.metadata?.weekly_payment_cents || '0'),
          weeks_remaining: parseInt(subscription.metadata?.weeks_remaining || '0'),
          hours_per_week: parseInt(subscription.metadata?.hours_per_week || '40'),
          transferred_hours_verified: parseInt(subscription.metadata?.transferred_hours_verified || '0'),
          billing_cycle_anchor: new Date((subscription.billing_cycle_anchor || 0) * 1000).toISOString(),
          current_period_start: new Date((subscription.current_period_start || 0) * 1000).toISOString(),
          current_period_end: new Date((subscription.current_period_end || 0) * 1000).toISOString(),
          created_at: new Date().toISOString(),
        }, {
          onConflict: 'stripe_subscription_id',
        }).select().single();

        // Update enrollment status if enrollment_id provided
        if (enrollmentId) {
          await supabase
            .from('program_enrollments')
            .update({ 
              payment_status: 'active',
              stripe_subscription_id: subscriptionId,
            })
            .eq('id', enrollmentId);
        }

        // === NEW: Create/upsert apprentice record ===
        const { data: existingApprentice } = await supabase
          .from('apprentices')
          .select('id, start_date')
          .eq('user_id', userId)
          .single();

        let apprenticeId: string;
        if (existingApprentice) {
          // Update existing - only set start_date if null
          apprenticeId = existingApprentice.id;
          await supabase
            .from('apprentices')
            .update({
              status: 'active',
              barber_subscription_id: subscriptionRecord?.id,
              ...(existingApprentice.start_date ? {} : { start_date: new Date().toISOString() }),
            })
            .eq('id', apprenticeId);
        } else {
          // Create new apprentice record
          const { data: newApprentice } = await supabase
            .from('apprentices')
            .insert({
              user_id: userId,
              status: 'active',
              start_date: new Date().toISOString(),
              barber_subscription_id: subscriptionRecord?.id,
            })
            .select()
            .single();
          apprenticeId = newApprentice?.id;
        }

        // Link apprentice to subscription
        if (apprenticeId && subscriptionRecord?.id) {
          await supabase
            .from('barber_subscriptions')
            .update({ apprentice_id: apprenticeId })
            .eq('id', subscriptionRecord.id);
        }

        // === NEW: Send emails (idempotent - check if already sent) ===
        const { data: subRecord } = await supabase
          .from('barber_subscriptions')
          .select('welcome_email_sent_at')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        // Generate magic link for dashboard access
        let magicLink = `${process.env.NEXT_PUBLIC_SITE_URL}/apprentice`;
        
        if (customerEmail) {
          try {
            const { data: linkData } = await supabase.auth.admin.generateLink({
              type: 'magiclink',
              email: customerEmail,
              options: {
                redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/apprentice`,
              },
            });
            if (linkData?.properties?.action_link) {
              magicLink = linkData.properties.action_link;
            }
          } catch (linkErr) {
            logger.error('Magic link generation failed:', linkErr);
          }
        }

        // Send Welcome Email with Magic Link (if not already sent)
        if (!subRecord?.welcome_email_sent_at && customerEmail) {
          try {
            const { sendEmail } = await import('@/lib/email/sendgrid');
            const weeklyPayment = (parseInt(subscription.metadata?.weekly_payment_cents || '0') / 100).toFixed(2);
            const firstBillingDate = subscription.metadata?.first_billing_date || 'the following Friday';
            
            await sendEmail({
              to: customerEmail,
              subject: 'Welcome to Barber Apprenticeship - Dashboard Access',
              html: `
<p>Hello,</p>

<p>Welcome to the Barber Apprenticeship Program. Your enrollment payment has been successfully processed.</p>

<p>You now have access to your student dashboard. This is where you will manage your apprenticeship from start to finish.</p>

<p><strong>What you can do in your dashboard:</strong></p>
<p>• Complete onboarding and sign your apprenticeship agreement (MOU)<br>
• Clock in and out for training hours<br>
• Track progress toward required hours<br>
• Submit progress reports and required documentation</p>

<p>Access your dashboard using the secure link below:</p>

<p><a href="${magicLink}" style="display:inline-block;padding:12px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Access Your Student Dashboard</a></p>

<p><strong>Important notes:</strong></p>
<p>• This link is secure and time-limited. If it expires, you can request a new one from the login page.<br>
• You may be required to complete onboarding steps before accessing all features.</p>

<p>Your related instruction is available in the <a href="${LMS_URL}">Elevate LMS</a> — log in to your student portal to access your courses.</p>

<p>If you have questions or need assistance, contact support at (317) 314-3757.</p>

<p>— Elevate for Humanity</p>
              `,
            });
            
            // Also send internal notification
            try {
              await sendEmail({
                to: process.env.REPLY_TO_EMAIL || 'elevate4humanityedu@gmail.com',
                subject: `New Barber Enrollment: ${customerName || customerEmail}`,
                html: `
                  <h2>New Barber Apprenticeship Enrollment</h2>
                  <p><strong>Student:</strong> ${customerName || 'N/A'}</p>
                  <p><strong>Email:</strong> ${customerEmail}</p>
                  <p><strong>Setup Fee Paid:</strong> $${BARBER_PRICING.setupFee.toLocaleString()}</p>
                  <p><strong>Weekly Payment:</strong> $${weeklyPayment}</p>
                  <p><strong>First Billing:</strong> ${firstBillingDate}</p>
                  <p><strong>Subscription ID:</strong> ${subscriptionId}</p>
                  <p><strong>Apprentice ID:</strong> ${apprenticeId || 'N/A'}</p>
                `,
              });
            } catch (internalErr) {
              logger.error('Internal notification failed:', internalErr);
            }
            
            // Mark welcome email as sent
            await supabase
              .from('barber_subscriptions')
              .update({ 
                welcome_email_sent_at: new Date().toISOString(),
                dashboard_invite_sent_at: new Date().toISOString(),
              })
              .eq('stripe_subscription_id', subscriptionId);
              
            logger.info(`Welcome email sent to ${customerEmail}`);
          } catch (emailErr) {
            logger.error('Welcome email failed:', emailErr);
            // Don't fail webhook - email can be retried
          }
        }

        // LMS access is included in the welcome email above — no separate email needed.

        // Admin SMS alert via email-to-SMS gateway (non-blocking)
        const adminSmsGateway = process.env.ADMIN_SMS_GATEWAY;
        if (adminSmsGateway) {
          const { sendEmail } = await import('@/lib/email/sendgrid');
          sendEmail({
            to: adminSmsGateway,
            subject: 'New Barber Enrollment',
            html: `${customerName || customerEmail} enrolled. Sub: ${subscriptionId}`,
          }).catch((err: unknown) => logger.error('Admin enrollment SMS failed (non-fatal):', err));
        }

        logger.info(`Barber subscription created: ${subscriptionId} for user ${userId}, apprentice ${apprenticeId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        
        // Only process barber subscriptions
        if (subscription.metadata?.program !== 'barber-apprenticeship') {
          break;
        }

        await supabase
          .from('barber_subscriptions')
          .update({
            status: subscription.status,
            weekly_payment_cents: parseInt(subscription.metadata?.weekly_payment_cents || '0'),
            weeks_remaining: parseInt(subscription.metadata?.weeks_remaining || '0'),
            current_period_start: new Date((subscription.current_period_start || 0) * 1000).toISOString(),
            current_period_end: new Date((subscription.current_period_end || 0) * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        logger.info(`Barber subscription updated: ${subscription.id}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        
        if (subscription.metadata?.program !== 'barber-apprenticeship') {
          break;
        }

        await supabase
          .from('barber_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        logger.info(`Barber subscription canceled: ${subscription.id}`);
        break;
      }

      // ── Failed payment — immediate notice + grace-period suspension ──────
      case 'invoice.payment_failed':
      case 'payment_intent.payment_failed': {
        const failedObj = event.data.object as Stripe.Invoice | Stripe.PaymentIntent;
        const failedCustomerId = 'customer' in failedObj
          ? (typeof failedObj.customer === 'string' ? failedObj.customer : failedObj.customer?.id)
          : undefined;
        const failedEmail = 'customer_email' in failedObj
          ? failedObj.customer_email
          : undefined;

        if (!failedCustomerId) break;

        const db = createAdminClient();

        // 1. Mark enrollment as past_due and record failure timestamp
        const { data: sub } = await db
          .from('barber_subscriptions')
          .select('id, customer_email, payment_status, failed_payment_at')
          .eq('stripe_customer_id', failedCustomerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!sub) {
          logger.warn('[Barber Webhook] payment_failed: no subscription found', { failedCustomerId });
          break;
        }

        // Idempotent — only update if not already past_due or suspended
        if (!['past_due', 'suspended', 'cancelled'].includes(sub.payment_status ?? '')) {
          await db
            .from('barber_subscriptions')
            .update({
              payment_status: 'past_due',
              failed_payment_at: new Date().toISOString(),
              suspension_deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            })
            .eq('id', sub.id);
        }

        // 2. Send immediate email with update-card link
        const studentEmail = failedEmail || sub.customer_email;
        if (studentEmail) {
          try {
            const { sendEmail } = await import('@/lib/email/sendgrid');
            const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
            await sendEmail({
              to: studentEmail,
              subject: '⚠️ Payment Failed — Action Required to Keep Your Enrollment',
              html: `
<div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1a1a1a">
<p style="font-size:18px;font-weight:bold;color:#dc2626">Your weekly tuition payment failed.</p>
<p>We were unable to charge your card on file for your Barber Apprenticeship weekly payment.</p>
<p><strong>What you need to do:</strong></p>
<ol style="line-height:2">
  <li>Update your payment method immediately using the link below.</li>
  <li>Stripe will automatically retry the charge once your card is updated.</li>
</ol>
<p style="margin:24px 0">
  <a href="${siteUrl}/apprentice/billing" style="background:#1d4ed8;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block">
    Update Payment Method →
  </a>
</p>
<p style="color:#dc2626;font-weight:bold">Important: If this is not resolved within 7 days, your program access will be suspended.</p>
<p>Suspended students cannot log hours or access coursework. Suspended hours do not count toward your apprenticeship total.</p>
<p>Call us at <a href="tel:3173143757">(317) 314-3757</a> if you need help — we can work with you before suspension occurs.</p>
<p>— Elevate for Humanity</p>
</div>`,
            });
          } catch (emailErr) {
            logger.error('[Barber Webhook] Failed to send payment-failed email', { studentEmail, emailErr });
          }
        }

        // 3. Alert admin
        try {
          const { sendEmail } = await import('@/lib/email/sendgrid');
          await sendEmail({
            to: 'elevate4humanityedu@gmail.com',
            subject: `Payment failed — ${studentEmail}`,
            html: `<p>Student: ${studentEmail}<br>Customer ID: ${failedCustomerId}<br>Subscription ID: ${sub.id}<br>Suspension deadline: 7 days from now.</p>`,
          });
        } catch { /* non-fatal */ }

        logger.info('[Barber Webhook] Payment failed — marked past_due', { failedCustomerId, studentEmail });
        break;
      }

      // ── Payment succeeded after failure — restore access ──────────────
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) break;

        // Get subscription to check if it's a barber subscription
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (subscription.metadata?.program !== 'barber-apprenticeship') {
          break;
        }

        // Record payment
        await supabase.from('barber_payments').insert({
          user_id: subscription.metadata?.user_id,
          stripe_subscription_id: subscriptionId,
          stripe_invoice_id: invoice.id,
          amount_paid: (invoice.amount_paid || 0) / 100,
          payment_date: new Date().toISOString(),
          invoice_url: invoice.hosted_invoice_url,
        }).catch(() => {
          // Table may not exist
        });

        // Reinstate if previously suspended or past_due
        const { data: subRecord } = await supabase
          .from('barber_subscriptions')
          .select('id, user_id, payment_status, customer_email, customer_name')
          .eq('stripe_subscription_id', subscriptionId)
          .maybeSingle();

        if (subRecord && ['past_due', 'suspended'].includes(subRecord.payment_status ?? '')) {
          await supabase
            .from('barber_subscriptions')
            .update({
              payment_status: 'active',
              failed_payment_at: null,
              suspension_deadline: null,
              suspended_at: null,
              suspension_reason: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', subRecord.id);

          await supabase.from('billing_events').insert({
            barber_subscription_id: subRecord.id,
            user_id: subRecord.user_id,
            event_type: 'reinstated',
            stripe_invoice_id: invoice.id,
            amount_cents: invoice.amount_paid,
            metadata: { source: 'invoice.paid_webhook' },
          }).catch(() => {});

          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
          if (subRecord.customer_email) {
            const { sendEmail } = await import('@/lib/email/sendgrid');
            await sendEmail({
              to: subRecord.customer_email,
              subject: 'Your Barber Apprenticeship access has been restored',
              html: `<p>Hi ${subRecord.customer_name || 'Apprentice'},</p><p>Your payment was processed and your access has been fully restored.</p><p><a href="${siteUrl}/learner/dashboard">Go to Dashboard</a></p><p>— Elevate for Humanity</p>`,
            }).catch(() => {});
          }

          logger.info(`[Barber Webhook] Reinstated subscription: ${subscriptionId}`);
        }

        // Decrement weeks remaining
        const currentWeeks = parseInt(subscription.metadata?.weeks_remaining || '0');
        if (currentWeeks > 0) {
          const newWeeksRemaining = currentWeeks - 1;
          
          await supabase
            .from('barber_subscriptions')
            .update({
              weeks_remaining: newWeeksRemaining,
              last_payment_date: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId);

          // Auto-cancel subscription when fully paid
          if (newWeeksRemaining <= 0) {
            try {
              await stripe.subscriptions.cancel(subscriptionId);
              logger.info(`Barber subscription auto-canceled (fully paid): ${subscriptionId}`);
              
              // Send completion email
              const customerEmail = subscription.metadata?.customer_email;
              if (customerEmail) {
                const { sendEmail } = await import('@/lib/email/sendgrid');
                await sendEmail({
                  to: customerEmail,
                  subject: 'Congratulations! Your Barber Apprenticeship Tuition is Paid in Full',
                  html: `
<p>Congratulations!</p>

<p>You have successfully completed all tuition payments for your Barber Apprenticeship program.</p>

<p><strong>What's next:</strong></p>
<p>• Continue logging your apprenticeship hours<br>
• Complete your coursework in the Elevate LMS<br>
• Prepare for your state board exam</p>

<p>Your dashboard remains active for hour tracking and progress monitoring.</p>

<p>Thank you for choosing Elevate for Humanity!</p>

<p>— Elevate for Humanity Team</p>
                  `,
                });
              }
            } catch (cancelErr) {
              logger.error('Failed to auto-cancel subscription:', cancelErr);
            }
          }
        }

        logger.info(`Barber payment recorded: ${invoice.id}`);
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * PUT /api/barber/webhook
 * 
 * Update subscription when transfer hours are verified
 * Called internally when admin verifies transfer hours
 */
async function _PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { 
      subscription_id,
      transferred_hours_verified,
      hours_per_week,
    } = body;

    if (!subscription_id) {
      return NextResponse.json({ error: 'Subscription ID required' }, { status: 400 });
    }

    // Get current subscription
    const subscription = await stripe.subscriptions.retrieve(subscription_id);
    
    if (subscription.metadata?.program !== 'barber-apprenticeship') {
      return NextResponse.json({ error: 'Not a barber subscription' }, { status: 400 });
    }

    // Recalculate weekly payment with new transfer hours
    const hpw = hours_per_week || parseInt(subscription.metadata?.hours_per_week || '40');
    const calculation = calculateWeeklyPayment(hpw, transferred_hours_verified);

    // Update subscription item quantity (weekly payment amount)
    const subscriptionItem = subscription.items.data[0];
    
    await stripe.subscriptionItems.update(subscriptionItem.id, {
      quantity: calculation.weeklyPaymentCents,
      proration_behavior: 'none', // No mid-cycle adjustments
    });

    // Update subscription metadata
    await stripe.subscriptions.update(subscription_id, {
      metadata: {
        ...subscription.metadata,
        transferred_hours_verified: transferred_hours_verified.toString(),
        hours_remaining: calculation.hoursRemaining.toString(),
        weeks_remaining: calculation.weeksRemaining.toString(),
        weekly_payment_cents: calculation.weeklyPaymentCents.toString(),
        weekly_payment_dollars: calculation.weeklyPaymentDollars.toFixed(2),
      },
    });

    // Update database
    await supabase
      .from('barber_subscriptions')
      .update({
        transferred_hours_verified,
        hours_remaining: calculation.hoursRemaining,
        weeks_remaining: calculation.weeksRemaining,
        weekly_payment_cents: calculation.weeklyPaymentCents,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription_id);

    return NextResponse.json({
      success: true,
      updated: {
        transferredHours: transferred_hours_verified,
        hoursRemaining: calculation.hoursRemaining,
        weeksRemaining: calculation.weeksRemaining,
        newWeeklyPayment: calculation.weeklyPaymentDollars,
      },
      message: `Weekly payment updated to $${calculation.weeklyPaymentDollars.toFixed(2)} for ${calculation.weeksRemaining} weeks`,
    });
  } catch (error) {
    logger.error('Transfer hours update error:', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/barber/webhook', _POST, { actor_type: 'webhook', skip_body: true });
export const PUT = withApiAudit('/api/barber/webhook', _PUT, { actor_type: 'webhook', skip_body: true });
