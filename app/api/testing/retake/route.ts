/**
 * POST /api/testing/retake
 *
 * Called by the proctor portal when recording a failed exam result.
 * Creates a testing_enforcement hold requiring a retake fee before
 * the candidate can book again.
 *
 * Admin/staff only.
 *
 * Body: { bookingId: string, email: string, examName: string }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { sendEmail } from '@/lib/email/sendgrid';
import { safeError, safeInternalError } from '@/lib/api/safe-error';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import { TESTING_CENTER, TESTING_EMAIL } from '@/lib/testing/testing-config';
import { hydrateProcessEnv } from '@/lib/secrets';
const FROM = TESTING_EMAIL.from;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.elevateforhumanity.org';
const RETAKE_FEE_CENTS = 5000; // $50

export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const auth = await apiRequireAdmin(req);

  const db = createAdminClient();
  if (!db) return safeError('Database unavailable', 500);

  let body: { bookingId: string; email: string; examName: string };
  try { body = await req.json(); } catch { return safeError('Invalid JSON', 400); }

  const { bookingId, email, examName } = body;
  if (!bookingId || !email) return safeError('bookingId and email are required', 400);

  // Verify booking exists
  const { data: booking } = await db
    .from('exam_bookings')
    .select('id, user_id, exam_result')
    .eq('id', bookingId)
    .maybeSingle();

  if (!booking) return safeError('Booking not found', 404);

  // Mark exam result as failed
  await db
    .from('exam_bookings')
    .update({
      exam_result: 'failed',
      result_recorded_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId);

  // Check if retake hold already exists
  const { data: existing } = await db
    .from('testing_enforcement')
    .select('id')
    .eq('booking_id', bookingId)
    .eq('enforcement_type', 'retake')
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ message: 'Retake hold already exists', holdId: existing.id });
  }

  // Create enforcement hold
  const { data: hold, error } = await db
    .from('testing_enforcement')
    .insert({
      booking_id: bookingId,
      user_id: booking.user_id ?? null,
      email: email.toLowerCase().trim(),
      enforcement_type: 'retake',
      fee_cents: RETAKE_FEE_CENTS,
      fee_paid: false,
    })
    .select('id')
    .single();

  if (error) return safeInternalError(error, 'Failed to create retake hold');

  logger.info('[testing/retake] Retake hold created', { bookingId, holdId: hold.id });

  // Notify candidate
  await sendEmail({
    to: email,
    from: FROM,
    subject: `Exam Result — Retake Available | Elevate Testing Center`,
    html: `<!DOCTYPE html>
<html><body style="font-family:Arial,sans-serif;padding:24px;color:#1E293B;max-width:600px;margin:0 auto">
  <h2 style="color:#1E3A5F">Exam Result — ${examName ?? 'Your Exam'}</h2>
  <p>Thank you for testing at Elevate for Humanity. Unfortunately, you did not pass this attempt.</p>
  <p>You are eligible to retake the exam. A <strong>$50 retake fee</strong> is required to schedule your next attempt.</p>
  <p><a href="${SITE_URL}/testing/book" style="background:#1E3A5F;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Pay Fee &amp; Schedule Retake →</a></p>
  <p style="color:#64748b;font-size:13px">Questions? Call <strong>${TESTING_CENTER.phone}</strong> or reply to this email.</p>
</body></html>`,
  }).catch(err => logger.warn('[testing/retake] Email failed', { email, err }));

  return NextResponse.json({ success: true, holdId: hold.id });
}
