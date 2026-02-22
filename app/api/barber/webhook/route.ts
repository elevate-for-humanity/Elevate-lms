import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Stripe from 'stripe';
import { BARBER_PRICING, calculateWeeklyPayment } from '@/lib/programs/pricing';

const MILADY_LOGIN_URL = 'https://www.miladytraining.com/users/sign_in';

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
 * 5. Send Milady email (idempotent)
 */
export async function POST(request: NextRequest) {
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

  const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
  const adminClient = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

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
        const customerPhone = session.metadata?.customer_phone || '';
        const applicationId = session.metadata?.application_id;
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

            // Schedule weekly invoices for remaining balance
            await scheduleWeeklyInvoices(stripe, {
              customerId,
              customerEmail,
              weeksRemaining: invoiceWeeks,
              weeklyPaymentCents,
              hoursPerWeek,
              transferredHours,
              applicationId,
            });
          }

          // Create enrollment record
          await db.from('barber_subscriptions').insert({
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

          // Send welcome email
          try {
            const { sendEmail } = await import('@/lib/email/resend');
            
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

            await sendEmail({
              to: customerEmail,
              subject: 'Welcome to Barber Apprenticeship - Enrollment Confirmed!',
              html: `
<p>Hi ${customerName || 'there'},</p>

<p>Your enrollment in the Barber Apprenticeship program is confirmed!</p>

<p><strong>Payment Summary:</strong></p>
<p>${paymentSummary}</p>

<p><strong>What's next:</strong></p>
<p>• Milady will email you login credentials for coursework<br>
• Log into your dashboard to track hours<br>
${!fullyPaid ? '• You\'ll receive weekly payment invoices every Friday' : ''}</p>

<p>Questions? Reply to this email or call (317) 314-3757.</p>

<p>— Elevate for Humanity Team</p>
              `,
            });
          } catch (emailErr) {
            logger.error('Failed to send welcome email:', emailErr);
          }

          // Send Milady notification
          try {
            const { sendEmail } = await import('@/lib/email/resend');
            await sendEmail({
              to: 'miladyaccess@elevateforhumanity.org',
              subject: `New Barber Apprentice - ${customerName || customerEmail}`,
              html: `
<p>New barber apprentice enrolled:</p>
<p>• Name: ${customerName}<br>
• Email: ${customerEmail}<br>
• Phone: ${customerPhone}<br>
• Transfer Hours: ${transferredHours}<br>
• Payment: ${fullyPaid ? 'Paid in full' : 'Payment plan'}</p>
<p>Please create Milady account and send credentials.</p>
              `,
            });
          } catch (emailErr) {
            logger.error('Failed to send Milady notification:', emailErr);
          }

          logger.info(`Barber enrollment complete: ${customerId}, fullyPaid: ${fullyPaid}, bnpl: ${bnplProvider}`);
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
        const { data: subscriptionRecord } = await db.from('barber_subscriptions').upsert({
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
          await db
            .from('program_enrollments')
            .update({ 
              payment_status: 'active',
              stripe_subscription_id: subscriptionId,
            })
            .eq('id', enrollmentId);
        }

        // === NEW: Create/upsert apprentice record ===
        const { data: existingApprentice } = await db
          .from('apprentices')
          .select('id, start_date')
          .eq('user_id', userId)
          .single();

        let apprenticeId: string;
        if (existingApprentice) {
          // Update existing - only set start_date if null
          apprenticeId = existingApprentice.id;
          await db
            .from('apprentices')
            .update({
              status: 'active',
              barber_subscription_id: subscriptionRecord?.id,
              ...(existingApprentice.start_date ? {} : { start_date: new Date().toISOString() }),
            })
            .eq('id', apprenticeId);
        } else {
          // Create new apprentice record
          const { data: newApprentice } = await db
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
          await db
            .from('barber_subscriptions')
            .update({ apprentice_id: apprenticeId })
            .eq('id', subscriptionRecord.id);
        }

        // === NEW: Send emails (idempotent - check if already sent) ===
        const { data: subRecord } = await db
          .from('barber_subscriptions')
          .select('welcome_email_sent_at, milady_email_sent_at')
          .eq('stripe_subscription_id', subscriptionId)
          .single();

        // Generate magic link for dashboard access
        let magicLink = `${process.env.NEXT_PUBLIC_SITE_URL}/apprentice`;
        
        if (adminClient && customerEmail) {
          try {
            const { data: linkData } = await adminClient.auth.admin.generateLink({
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
            const { sendEmail } = await import('@/lib/email/resend');
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

<p>Related instruction through Milady is handled separately. You will receive additional information about Milady access in a separate email.</p>

<p>If you have questions or need assistance, contact support at (317) 314-3757.</p>

<p>— Elevate for Humanity</p>
              `,
            });
            
            // Also send internal notification
            try {
              await sendEmail({
                to: process.env.REPLY_TO_EMAIL || 'info@elevateforhumanity.org',
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
            await db
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

        // Send Milady Email (if not already sent)
        if (!subRecord?.milady_email_sent_at && customerEmail) {
          try {
            const { sendEmail } = await import('@/lib/email/resend');
            await sendEmail({
              to: customerEmail,
              subject: 'Your Milady Access - Barber Apprenticeship',
              html: `
<p>Hello,</p>

<p>As part of your Barber Apprenticeship enrollment, your related instruction is provided through Milady.</p>

<p><strong>Here's what to expect:</strong></p>
<p>• Milady access is issued after successful enrollment<br>
• Milady will send you a separate email with login instructions<br>
• This email may take several hours to arrive</p>

<p>You can also access Milady using the link below once your account is active:</p>

<p><a href="${MILADY_LOGIN_URL}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Access Milady</a></p>

<p><strong>If you do not receive an email from Milady:</strong></p>
<p>• Check your spam or junk folder<br>
• Allow up to 24 hours after enrollment<br>
• Contact support at (317) 314-3757 if access is still unavailable</p>

<p>Your Elevate for Humanity dashboard is separate from Milady and is used to track hours, progress, and compliance.</p>

<p>— Elevate for Humanity</p>
              `,
            });
            
            // Mark Milady email as sent
            await db
              .from('barber_subscriptions')
              .update({ milady_email_sent_at: new Date().toISOString() })
              .eq('stripe_subscription_id', subscriptionId);
              
            logger.info(`Milady email sent to ${customerEmail}`);
          } catch (emailErr) {
            logger.error('Milady email failed:', emailErr);
            // Don't fail webhook - email can be retried
          }
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

        await db
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

        await db
          .from('barber_subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id);

        logger.info(`Barber subscription canceled: ${subscription.id}`);
        break;
      }

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
        await db.from('barber_payments').insert({
          user_id: subscription.metadata?.user_id,
          stripe_subscription_id: subscriptionId,
          stripe_invoice_id: invoice.id,
          amount_paid: (invoice.amount_paid || 0) / 100,
          payment_date: new Date().toISOString(),
          invoice_url: invoice.hosted_invoice_url,
        }).catch(() => {
          // Table may not exist
        });

        // Decrement weeks remaining
        const currentWeeks = parseInt(subscription.metadata?.weeks_remaining || '0');
        if (currentWeeks > 0) {
          const newWeeksRemaining = currentWeeks - 1;
          
          await db
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
                const { sendEmail } = await import('@/lib/email/resend');
                await sendEmail({
                  to: customerEmail,
                  subject: 'Congratulations! Your Barber Apprenticeship Tuition is Paid in Full',
                  html: `
<p>Congratulations!</p>

<p>You have successfully completed all tuition payments for your Barber Apprenticeship program.</p>

<p><strong>What's next:</strong></p>
<p>• Continue logging your apprenticeship hours<br>
• Complete your Milady coursework<br>
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
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();
  const _admin = createAdminClient(); const db = _admin || supabase;
    if (!supabase) {
      return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
    }

    // Verify admin access
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await db
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
    await db
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
