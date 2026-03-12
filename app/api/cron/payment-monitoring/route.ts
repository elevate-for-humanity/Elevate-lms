import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
/**
 * Payment Monitoring Cron Job
 * 
 * Runs daily to:
 * 1. Check for upcoming payments and send reminders
 * 2. Check for past-due payments and send alerts
 * 3. Update subscription statuses in database
 * 
 * Stripe handles the actual weekly charges automatically via subscriptions.
 * This job monitors and notifies.
 */

import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resend } from '@/lib/resend';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase configuration missing');
  }
  return createClient(url, key);
}

async function _GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const supabase = getSupabaseAdmin();
    
    const results = {
      upcomingReminders: 0,
      pastDueAlerts: 0,
      statusUpdates: 0,
      errors: [] as string[],
    };

    // 1. Get all active subscriptions from database
    const { data: subscriptions, error: subError } = await supabase
      .from('student_subscriptions')
      .select(`
        *,
        profiles:student_id (
          id,
          email,
          full_name
        )
      `)
      .in('status', ['active', 'past_due']);

    if (subError) {
      logger.error('Error fetching subscriptions:', subError);
      results.errors.push('Failed to fetch subscriptions');
    }

    if (subscriptions && subscriptions.length > 0) {
      for (const sub of subscriptions) {
        try {
          // Fetch current status from Stripe
          const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
          
          // Update local status if changed
          if (stripeSub.status !== sub.status) {
            await supabase
              .from('student_subscriptions')
              .update({
                status: stripeSub.status,
                current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
                current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq('id', sub.id);
            
            results.statusUpdates++;
          }

          // Check for past due
          if (stripeSub.status === 'past_due') {
            await sendPastDueAlert(sub.profiles, sub);
            results.pastDueAlerts++;
          }

          // Check for upcoming payment (2 days before)
          const nextPaymentDate = new Date(stripeSub.current_period_end * 1000);
          const twoDaysFromNow = new Date();
          twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
          
          if (nextPaymentDate <= twoDaysFromNow && stripeSub.status === 'active') {
            await sendUpcomingPaymentReminder(sub.profiles, sub, nextPaymentDate);
            results.upcomingReminders++;
          }

        } catch (stripeError) {
          logger.error(`Error processing subscription ${sub.id}:`, stripeError);
          results.errors.push(`Subscription ${sub.id}: ${stripeError}`);
        }
      }
    }

    // 2. Check for completed subscriptions
    const { data: completedSubs } = await supabase
      .from('student_subscriptions')
      .select('*')
      .eq('status', 'active')
      .not('weeks_paid', 'is', null);

    if (completedSubs) {
      for (const sub of completedSubs) {
        if (sub.weeks_paid >= sub.total_weeks) {
          // Mark as completed
          await supabase
            .from('student_subscriptions')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);
          
          // Cancel Stripe subscription
          try {
            await stripe.subscriptions.cancel(sub.stripe_subscription_id);
          } catch (e) {
            logger.error('Error canceling completed subscription:', e);
          }
          
          results.statusUpdates++;
        }
      }
    }

    logger.info('Payment monitoring completed:', results);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });

  } catch (error) {
    logger.error('Payment monitoring error:', error);
    return NextResponse.json(
      { error: 'Payment monitoring failed', details: String(error) },
      { status: 500 }
    );
  }
}

async function sendUpcomingPaymentReminder(
  student: { email: string; full_name: string } | null,
  subscription: any,
  paymentDate: Date
) {
  if (!student?.email || !process.env.RESEND_API_KEY) return;

  
  await resend.emails.send({
    from: 'Elevate for Humanity <billing@elevateforhumanity.org>',
    to: student.email,
    subject: 'Upcoming Payment Reminder',
    html: `
      <h2>Payment Reminder</h2>
      <p>Hi ${student.full_name || 'Student'},</p>
      <p>This is a friendly reminder that your weekly tuition payment of <strong>$${subscription.weekly_amount}</strong> will be automatically charged on <strong>${paymentDate.toLocaleDateString()}</strong>.</p>
      <p>Payment ${subscription.weeks_paid + 1} of ${subscription.total_weeks}</p>
      <p>Please ensure your payment method is up to date.</p>
      <p><a href="https://www.elevateforhumanity.org/account/billing">Manage Payment Method</a></p>
      <p>Thank you for your commitment to your education!</p>
      <p>- Elevate for Humanity</p>
    `,
  });
}

async function sendPastDueAlert(
  student: { email: string; full_name: string } | null,
  subscription: any
) {
  if (!student?.email || !process.env.RESEND_API_KEY) return;

  
  await resend.emails.send({
    from: 'Elevate for Humanity <billing@elevateforhumanity.org>',
    to: student.email,
    subject: 'Action Required: Payment Past Due',
    html: `
      <h2>Payment Past Due</h2>
      <p>Hi ${student.full_name || 'Student'},</p>
      <p>Your weekly tuition payment of <strong>$${subscription.weekly_amount}</strong> was not successfully processed.</p>
      <p><strong>Please update your payment method immediately to avoid interruption to your course access.</strong></p>
      <p><a href="https://www.elevateforhumanity.org/account/billing" style="background-color: #ea580c; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Payment Method</a></p>
      <p>If you're experiencing financial difficulties, please contact us at support@elevateforhumanity.org to discuss options.</p>
      <p>- Elevate for Humanity Billing Team</p>
    `,
  });

  // Also notify admin
  await resend.emails.send({
    from: 'Elevate for Humanity <billing@elevateforhumanity.org>',
    to: 'elevate4humanityedu@gmail.com',
    subject: `Past Due Alert: ${student.full_name || student.email}`,
    html: `
      <h2>Student Payment Past Due</h2>
      <p><strong>Student:</strong> ${student.full_name || 'Unknown'}</p>
      <p><strong>Email:</strong> ${student.email}</p>
      <p><strong>Weekly Amount:</strong> $${subscription.weekly_amount}</p>
      <p><strong>Payments Made:</strong> ${subscription.weeks_paid} of ${subscription.total_weeks}</p>
      <p><strong>Subscription ID:</strong> ${subscription.stripe_subscription_id}</p>
    `,
  });
}
export const GET = withApiAudit('/api/cron/payment-monitoring', _GET, { actor_type: 'cron' });
