/**
 * GET /api/cron/barber-billing
 *
 * Weekly cron — escalates past_due barber subscriptions to suspended
 * after the 7-day grace period expires.
 *
 * Stripe handles the actual weekly charge via subscription. This job:
 *   1. Finds subscriptions where suspension_deadline has passed and
 *      payment_status is still 'past_due'
 *   2. Marks them 'suspended' in barber_subscriptions
 *   3. Logs each action to billing_events
 *   4. Sends suspension notice email to the apprentice
 *
 * Schedule: daily at 08:00 UTC (catches any grace periods that expired overnight)
 * Auth: Bearer CRON_SECRET
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) {
    return NextResponse.json({ error: 'DB unavailable' }, { status: 503 });
  }

  const now = new Date().toISOString();
  const results = { suspended: 0, errors: [] as string[] };

  try {
    // Find past_due subscriptions whose grace period has expired
    const { data: overdue, error } = await db
      .from('barber_subscriptions')
      .select('id, user_id, customer_email, customer_name, stripe_subscription_id, suspension_deadline')
      .eq('payment_status', 'past_due')
      .lt('suspension_deadline', now);

    if (error) {
      logger.error('[barber-billing cron] fetch error', error);
      return NextResponse.json({ error: 'DB query failed' }, { status: 500 });
    }

    for (const sub of overdue ?? []) {
      try {
        // Mark suspended
        await db
          .from('barber_subscriptions')
          .update({
            payment_status: 'suspended',
            suspended_at: now,
            suspension_reason: 'Grace period expired — payment not received',
            updated_at: now,
          })
          .eq('id', sub.id);

        // Log to billing_events
        await db.from('billing_events').insert({
          barber_subscription_id: sub.id,
          user_id: sub.user_id,
          event_type: 'suspended',
          failure_reason: 'Grace period expired',
          metadata: { suspension_deadline: sub.suspension_deadline },
        });

        // Send suspension email
        if (sub.customer_email) {
          await sendEmail({
            to: sub.customer_email,
            subject: 'Your Barber Apprenticeship access has been suspended',
            html: suspensionEmailHtml({
              name: sub.customer_name || 'Apprentice',
              updateUrl: `${SITE_URL}/billing-required`,
            }),
          }).catch((err) =>
            logger.error('[barber-billing cron] suspension email failed', { id: sub.id, err })
          );
        }

        // Notify admin
        await sendEmail({
          to: ADMIN_EMAIL,
          subject: `Barber apprentice suspended: ${sub.customer_name || sub.customer_email}`,
          html: `<p><strong>${sub.customer_name || 'Unknown'}</strong> (${sub.customer_email}) has been suspended for non-payment. Stripe subscription: ${sub.stripe_subscription_id}</p>`,
        }).catch(() => {});

        results.suspended++;
        logger.info('[barber-billing cron] suspended', { id: sub.id, email: sub.customer_email });
      } catch (err) {
        results.errors.push(`sub ${sub.id}: suspension failed`);
        logger.error('[barber-billing cron] suspension failed', { id: sub.id, err });
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now,
      results,
    });
  } catch (err) {
    logger.error('[barber-billing cron] fatal', err);
    return NextResponse.json({ error: 'Cron failed', details: String(err) }, { status: 500 });
  }
}

function suspensionEmailHtml({ name, updateUrl }: { name: string; updateUrl: string }) {
  return `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
      <h2 style="color:#dc2626">Access Suspended — Payment Required</h2>
      <p>Hi ${name},</p>
      <p>Your barber apprenticeship access has been suspended because a weekly tuition payment could not be processed and the 7-day grace period has passed.</p>
      <p><strong>Your hours and progress are saved.</strong> Access is restored immediately once payment is updated.</p>
      <p style="margin:24px 0">
        <a href="${updateUrl}"
           style="background:#ea580c;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:600">
          Update Payment Method
        </a>
      </p>
      <p>If you need help, call us at <strong>(317) 314-3757</strong> or reply to this email.</p>
      <p>— Elevate for Humanity</p>
    </div>
  `;
}
