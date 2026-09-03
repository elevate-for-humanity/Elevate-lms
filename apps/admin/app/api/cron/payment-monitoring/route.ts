import { logger } from '@/lib/logger';
import { getStripe } from '@/lib/stripe/client';
import { NextResponse } from 'next/server';
import { requireAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { hydrateProcessEnv } from '@/lib/secrets';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { withRuntime } from '@/lib/api/withRuntime';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

async function _GET(request: Request) {
  await hydrateProcessEnv();
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stripe = getStripe();
    const supabase = await requireAdminClient();
    const results = { upcomingReminders: 0, pastDueAlerts: 0, statusUpdates: 0, errors: [] as string[] };

    const { data: subscriptions, error: subError } = await supabase
      .from('student_subscriptions')
      .select('*, profiles:student_id (id, email, full_name)')
      .in('status', ['active', 'past_due']);

    if (subError) {
      logger.error('Error fetching subscriptions:', subError);
      results.errors.push('Failed to fetch subscriptions');
    }

    for (const sub of subscriptions ?? []) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
        const period = stripeSub.items.data[0];
        const periodStart = period?.current_period_start;
        const periodEnd = period?.current_period_end;

        if (stripeSub.status !== sub.status) {
          await supabase
            .from('student_subscriptions')
            .update({
              status: stripeSub.status,
              current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
              current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', sub.id);
          results.statusUpdates++;
        }

        if (stripeSub.status === 'past_due') {
          await sendPastDueAlert(sub.profiles, sub);
          results.pastDueAlerts++;
        }

        if (periodEnd) {
          const nextPaymentDate = new Date(periodEnd * 1000);
          const twoDaysFromNow = new Date();
          twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2);
          if (nextPaymentDate <= twoDaysFromNow && stripeSub.status === 'active') {
            await sendUpcomingPaymentReminder(sub.profiles, sub, nextPaymentDate);
            results.upcomingReminders++;
          }
        }
      } catch (stripeError) {
        logger.error(`Error processing subscription ${sub.id}:`, stripeError);
        results.errors.push(`Subscription ${sub.id}: ${String(stripeError)}`);
      }
    }

    const { data: completedSubs } = await supabase
      .from('student_subscriptions')
      .select('*')
      .eq('status', 'active')
      .not('weeks_paid', 'is', null);

    for (const sub of completedSubs ?? []) {
      if (sub.weeks_paid >= sub.total_weeks) {
        await supabase.from('student_subscriptions').update({ status: 'completed', updated_at: new Date().toISOString() }).eq('id', sub.id);
        try {
          await stripe.subscriptions.cancel(sub.stripe_subscription_id);
        } catch (error) {
          logger.error('Error canceling completed subscription:', error);
        }
        results.statusUpdates++;
      }
    }

    logger.info('Payment monitoring completed:', results);
    return NextResponse.json({ success: true, timestamp: new Date().toISOString(), results });
  } catch (error) {
    logger.error('Payment monitoring error:', error);
    return NextResponse.json({ error: 'Payment monitoring failed', details: String(error) }, { status: 500 });
  }
}

async function sendUpcomingPaymentReminder(
  student: { email: string; full_name: string } | null,
  subscription: any,
  paymentDate: Date,
) {
  if (!student?.email || !process.env.SENDGRID_API_KEY) return;
  await resend.emails.send({
    from: `${PLATFORM_DEFAULTS.orgName} <billing@${PLATFORM_DEFAULTS.canonicalDomain}>`,
    to: student.email,
    subject: 'Upcoming Payment Reminder',
    html: `<h2>Payment Reminder</h2><p>Hi ${student.full_name || 'Student'},</p><p>Your weekly tuition payment of <strong>$${subscription.weekly_amount}</strong> will be charged on <strong>${paymentDate.toLocaleDateString()}</strong>.</p><p>Payment ${subscription.weeks_paid + 1} of ${subscription.total_weeks}</p><p><a href="${PLATFORM_DEFAULTS.siteUrl}/account/billing">Manage Payment Method</a></p>`,
  });
}

async function sendPastDueAlert(
  student: { email: string; full_name: string } | null,
  subscription: any,
) {
  if (!student?.email || !process.env.SENDGRID_API_KEY) return;
  await resend.emails.send({
    from: `${PLATFORM_DEFAULTS.orgName} <billing@${PLATFORM_DEFAULTS.canonicalDomain}>`,
    to: student.email,
    subject: 'Action Required: Payment Past Due',
    html: `<h2>Payment Past Due</h2><p>Hi ${student.full_name || 'Student'},</p><p>Your weekly tuition payment of <strong>$${subscription.weekly_amount}</strong> was not successfully processed.</p><p><a href="${PLATFORM_DEFAULTS.siteUrl}/account/billing">Update Payment Method</a></p>`,
  });
  await resend.emails.send({
    from: `${PLATFORM_DEFAULTS.orgName} <billing@${PLATFORM_DEFAULTS.canonicalDomain}>`,
    to: 'elevate4humanityedu@gmail.com',
    subject: `Past Due Alert: ${student.full_name || student.email}`,
    html: `<p><strong>Student:</strong> ${student.full_name || 'Unknown'}</p><p><strong>Email:</strong> ${student.email}</p><p><strong>Weekly Amount:</strong> $${subscription.weekly_amount}</p><p><strong>Payments Made:</strong> ${subscription.weeks_paid} of ${subscription.total_weeks}</p>`,
  });
}

export const GET = withRuntime(withApiAudit('/api/cron/payment-monitoring', _GET, { actor_type: 'cron' }));
