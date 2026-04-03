/**
 * GET /api/cron/testing-no-show
 *
 * Nightly cron — marks confirmed bookings as no-show if the appointment
 * time has passed with no exam_result recorded, then creates an enforcement
 * hold requiring a $50 rescheduling fee before the candidate can rebook.
 *
 * Schedule in Netlify/Vercel: 0 2 * * * (2 AM daily)
 * Secured by CRON_SECRET header.
 *
 * Idempotent — safe to run multiple times.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FROM = 'Elevate Testing Center <testing@elevateforhumanity.org>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
const NO_SHOW_FEE_CENTS = 5000; // $50

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = createAdminClient();
  if (!db) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 });

  // Find confirmed bookings whose preferred_date is strictly before today with no result.
  // Using yesterday's date ensures same-day appointments are never prematurely marked —
  // the cron runs at 2 AM so any appointment from the prior calendar day is fair game.
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0]; // YYYY-MM-DD

  const { data: missed, error } = await db
    .from('exam_bookings')
    .select('id, email, first_name, last_name, exam_name, preferred_date, preferred_time, user_id')
    .eq('status', 'confirmed')
    .is('exam_result', null)
    .lte('preferred_date', yesterdayStr);

  if (error) {
    logger.error('[cron/no-show] Query failed', { error });
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  if (!missed || missed.length === 0) {
    return NextResponse.json({ processed: 0 });
  }

  let processed = 0;
  let skipped = 0;

  for (const booking of missed) {
    // Check if enforcement hold already exists for this booking
    const { data: existing } = await db
      .from('testing_enforcement')
      .select('id')
      .eq('booking_id', booking.id)
      .eq('enforcement_type', 'no_show')
      .maybeSingle();

    if (existing) { skipped++; continue; }

    // Mark booking as no-show
    await db
      .from('exam_bookings')
      .update({
        status: 'no_show',
        exam_result: 'no_show',
        result_recorded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', booking.id);

    // Create enforcement hold
    await db.from('testing_enforcement').insert({
      booking_id: booking.id,
      user_id: booking.user_id ?? null,
      email: booking.email.toLowerCase(),
      enforcement_type: 'no_show',
      fee_cents: NO_SHOW_FEE_CENTS,
      fee_paid: false,
    });

    // Notify candidate
    await sendEmail({
      to: booking.email,
      from: FROM,
      subject: 'Missed Exam Appointment — Rescheduling Fee Required | Elevate Testing Center',
      html: `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;padding:24px;color:#1E293B;max-width:600px;margin:0 auto">
  <h2 style="color:#1E3A5F">Missed Appointment — ${booking.exam_name}</h2>
  <p>Hi ${booking.first_name},</p>
  <p>Our records show you did not attend your scheduled exam on <strong>${booking.preferred_date}</strong>.</p>
  <p>To rebook, a <strong>$50 rescheduling fee</strong> is required. This fee covers the reserved seat and proctor time.</p>
  <p><a href="${SITE_URL}/testing/book" style="background:#dc2626;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Pay Fee &amp; Rebook →</a></p>
  <p style="color:#64748b;font-size:13px">If you believe this is an error, call <strong>(317) 314-3757</strong> within 48 hours.</p>
</body></html>`,
    }).catch(err => logger.warn('[cron/no-show] Email failed', { email: booking.email, err }));

    processed++;
  }

  logger.info('[cron/no-show] Complete', { processed, skipped });
  return NextResponse.json({ processed, skipped });
}
