/**
 * GET /api/cron/barber-reinstate
 *
 * Daily reconciliation cron — reinstates suspended barber subscriptions
 * whose Stripe subscription has returned to 'active' status.
 *
 * The webhook handles reinstatement in real-time via invoice.paid, but
 * this cron catches any cases where the webhook was missed or delayed.
 *
 * Schedule: daily at 09:00 UTC
 * Auth: Bearer CRON_SECRET
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStripe } from '@/lib/stripe/client';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

export async function GET(request: Request) {
  await hydrateProcessEnv();
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }

  const stripe = getStripe();
  const now = new Date().toISOString();
  const results = { reinstated: 0, still_suspended: 0, errors: [] as string[] };

  try {
    // Find all suspended subscriptions that have a Stripe subscription ID
    const { data: suspended, error } = await db
      .from('barber_subscriptions')
      .select('id, user_id, customer_email, customer_name, stripe_subscription_id')
      .in('payment_status', ['past_due', 'suspended'])
      .not('stripe_subscription_id', 'is', null);

    if (error) {
      logger.error('[barber-reinstate cron] fetch error', error);
      return NextResponse.json({ error: 'DB query failed' }, { status: 500 });
    }

    for (const sub of suspended ?? []) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id!);

        if (stripeSub.status === 'active') {
          // Stripe says active — reinstate
          await db
            .from('barber_subscriptions')
            .update({
              payment_status: 'active',
              failed_payment_at: null,
              suspension_deadline: null,
              suspended_at: null,
              suspension_reason: null,
              updated_at: now,
            })
            .eq('id', sub.id);

          await db.from('billing_events').insert({
            barber_subscription_id: sub.id,
            user_id: sub.user_id,
            event_type: 'reinstated',
            metadata: { source: 'reconciliation_cron', stripe_status: stripeSub.status },
          });

          if (sub.customer_email) {
            await sendEmail({
              to: sub.customer_email,
              subject: 'Your Barber Apprenticeship access has been restored',
              html: reinstateEmailHtml({
                name: sub.customer_name || 'Apprentice',
                dashboardUrl: `${SITE_URL}/learner/dashboard`,
              }),
            }).catch((err) =>
              logger.error('[barber-reinstate cron] reinstate email failed', { id: sub.id, err })
            );
          }

          results.reinstated++;
          logger.info('[barber-reinstate cron] reinstated', { id: sub.id });
        } else {
          results.still_suspended++;
        }
      } catch (err) {
        results.errors.push(`sub ${sub.id}: reinstate check failed`);
        logger.error('[barber-reinstate cron] check failed', { id: sub.id, err });
      }
    }

    return NextResponse.json({ success: true, timestamp: now, results });
  } catch (err) {
    logger.error('[barber-reinstate cron] fatal', err);
    return NextResponse.json({ error: 'Cron failed', details: String(err) }, { status: 500 });
  }
}

function reinstateEmailHtml({ name, dashboardUrl }: { name: string; dashboardUrl: string }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#16a34a">Access Restored</h2>
      <p>Hi ${name},</p>
      <p>Your payment was processed successfully and your barber apprenticeship access has been fully restored.</p>
      <p style="margin:24px 0">
        <a href="${dashboardUrl}"
           style="background:#ea580c;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600">
          Go to Dashboard
        </a>
      </p>
      <p>— Elevate for Humanity</p>
    </div>
  `;
}
