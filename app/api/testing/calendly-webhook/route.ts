/**
 * POST /api/testing/calendly-webhook
 *
 * Receives Calendly webhook events for the Testing Appointment event type.
 *
 * Events handled:
 *   invitee.created  — booking confirmed: send confirmation email + SMS,
 *                      store appointment in testing_appointments, alert staff
 *   invitee.canceled — booking canceled: send cancellation email + SMS,
 *                      update appointment record
 *
 * Reminders (24hr + 1hr) are scheduled via rows in testing_appointment_reminders
 * and fired by the daily cron at /api/internal/testing-reminders.
 *
 * Webhook signature verified using CALENDLY_WEBHOOK_SECRET (Signing Key from
 * Calendly → Integrations → Webhooks).
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { sendSMS } from '@/lib/notifications/sms';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import crypto from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── Signature verification ───────────────────────────────────────────────────

function verifyCalendlySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.CALENDLY_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('CALENDLY_WEBHOOK_SECRET not set — skipping signature verification');
    return true; // allow in dev; enforce in prod by setting the secret
  }
  if (!signature) return false;
  const expected = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

// ─── Email templates ──────────────────────────────────────────────────────────

function confirmationEmailHtml(name: string, startTime: string, examQuestion: string): string {
  const date = new Date(startTime);
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Indiana/Indianapolis' });

  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
  <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Testing Appointment Confirmed</h1>
    <p style="color: #93c5fd; margin: 8px 0 0;">Elevate for Humanity Testing Center</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Hi ${name},</p>
    <p>Your testing appointment is confirmed. Here are your details:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr style="background: #f8fafc;">
        <td style="padding: 10px 12px; font-weight: bold; width: 140px;">Date</td>
        <td style="padding: 10px 12px;">${formatted}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold;">Time</td>
        <td style="padding: 10px 12px;">${time} ET</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td style="padding: 10px 12px; font-weight: bold;">Exam</td>
        <td style="padding: 10px 12px;">${examQuestion || 'See confirmation'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold;">Location</td>
        <td style="padding: 10px 12px;">${TESTING_CENTER.address}</td>
      </tr>
    </table>

    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold;">What to bring:</p>
      <ul style="margin: 8px 0 0; padding-left: 20px;">
        <li>Valid government-issued photo ID</li>
        <li>This confirmation email</li>
      </ul>
      <p style="margin: 12px 0 0; font-weight: bold;">Arrival policy:</p>
      <p style="margin: 4px 0 0;">Arrive <strong>10 minutes early</strong>. Late arrivals may forfeit their appointment. <strong>No walk-ins accepted.</strong></p>
    </div>

    <p>Questions? Contact us at <a href="mailto:${TESTING_CENTER.email}">${TESTING_CENTER.email}</a> or call <a href="tel:${TESTING_CENTER.phoneTel}">${TESTING_CENTER.phone}</a>.</p>
    <p style="color: #64748b; font-size: 13px;">You will receive a reminder 24 hours and 1 hour before your appointment.</p>
  </div>
</body>
</html>`;
}

function cancellationEmailHtml(name: string, startTime: string): string {
  const date = new Date(startTime);
  const formatted = date.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  return `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
  <div style="background: #7f1d1d; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 22px;">Testing Appointment Canceled</h1>
    <p style="color: #fca5a5; margin: 8px 0 0;">Elevate for Humanity Testing Center</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Hi ${name},</p>
    <p>Your testing appointment on <strong>${formatted}</strong> has been canceled.</p>
    <p>To reschedule, visit <a href="https://calendly.com/elevate4humanityedu/60min">calendly.com/elevate4humanityedu/60min</a> or call us at ${TESTING_CENTER.phone}.</p>
    <p style="color: #64748b; font-size: 13px;">If you did not cancel this appointment, please contact us immediately at ${TESTING_CENTER.email}.</p>
  </div>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  const rawBody = await req.text();
  const signature = req.headers.get('calendly-webhook-signature');

  if (!verifyCalendlySignature(rawBody, signature)) {
    logger.warn('Calendly webhook signature verification failed');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const eventType: string = event.event;
  const payload = event.payload;

  // Only handle our testing event type
  const eventTypeName: string = payload?.event_type?.name ?? '';
  if (!eventTypeName.toLowerCase().includes('testing')) {
    return NextResponse.json({ ok: true, skipped: 'not a testing event' });
  }

  const db = createAdminClient();

  const inviteeName: string  = payload?.invitee?.name ?? 'Test-taker';
  const inviteeEmail: string = payload?.invitee?.email ?? '';
  const inviteePhone: string = payload?.invitee?.questions_and_answers
    ?.find((q: any) => q.question?.toLowerCase().includes('phone'))?.answer ?? '';
  const examAnswer: string   = payload?.invitee?.questions_and_answers
    ?.find((q: any) => q.question?.toLowerCase().includes('exam'))?.answer ?? '';
  const startTime: string    = payload?.event?.start_time ?? payload?.scheduled_event?.start_time ?? '';
  const endTime: string      = payload?.event?.end_time   ?? payload?.scheduled_event?.end_time   ?? '';
  const eventUri: string     = payload?.event?.uri        ?? payload?.scheduled_event?.uri        ?? '';
  const inviteeUri: string   = payload?.invitee?.uri      ?? '';
  const cancelUrl: string    = payload?.invitee?.cancel_url ?? '';
  const rescheduleUrl: string = payload?.invitee?.reschedule_url ?? '';

  // ── invitee.created ────────────────────────────────────────────────────────
  if (eventType === 'invitee.created') {

    // 1. Store appointment
    const { data: appt, error: apptError } = await db
      .from('testing_appointments')
      .upsert({
        calendly_event_uri:    eventUri,
        calendly_invitee_uri:  inviteeUri,
        invitee_name:          inviteeName,
        invitee_email:         inviteeEmail,
        invitee_phone:         inviteePhone,
        exam_type:             examAnswer,
        start_time:            startTime,
        end_time:              endTime,
        status:                'confirmed',
        cancel_url:            cancelUrl,
        reschedule_url:        rescheduleUrl,
        created_at:            new Date().toISOString(),
      }, { onConflict: 'calendly_invitee_uri' })
      .select('id')
      .single();

    if (apptError) {
      logger.error('Failed to store testing appointment', apptError);
      // Non-fatal — continue with notifications
    }

    // 2. Schedule reminders (24hr + 1hr)
    if (appt?.id && startTime) {
      const start = new Date(startTime);
      const reminder24h = new Date(start.getTime() - 24 * 60 * 60 * 1000);
      const reminder1h  = new Date(start.getTime() -      60 * 60 * 1000);

      await db.from('testing_appointment_reminders').insert([
        { appointment_id: appt.id, send_at: reminder24h.toISOString(), type: '24h', sent: false },
        { appointment_id: appt.id, send_at: reminder1h.toISOString(),  type: '1h',  sent: false },
      ]);
    }

    // 3. Confirmation email to invitee
    if (inviteeEmail) {
      await resend.emails.send({
        from: `Elevate Testing Center <${TESTING_CENTER.email}>`,
        to:   inviteeEmail,
        subject: 'Your Testing Appointment is Confirmed — Elevate for Humanity',
        html: confirmationEmailHtml(inviteeName, startTime, examAnswer),
      }).catch(err => logger.error('Confirmation email failed', err));
    }

    // 4. Confirmation SMS to invitee
    if (inviteePhone) {
      const date = new Date(startTime);
      const formatted = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Indiana/Indianapolis' });
      await sendSMS(inviteePhone,
        `Elevate Testing: Your ${examAnswer || 'exam'} appointment is confirmed for ${formatted} at ${time} ET. ` +
        `Bring photo ID. Arrive 10 min early. No walk-ins. Questions: ${TESTING_CENTER.phone}`
      ).catch(err => logger.error('Confirmation SMS failed', err));
    }

    // 5. Internal staff alert
    await resend.emails.send({
      from: `Elevate Testing Center <${TESTING_CENTER.email}>`,
      to:   TESTING_CENTER.email,
      subject: `New Testing Appointment: ${inviteeName} — ${examAnswer || 'Exam TBD'}`,
      html: `
        <p><strong>New booking received.</strong></p>
        <ul>
          <li><strong>Name:</strong> ${inviteeName}</li>
          <li><strong>Email:</strong> ${inviteeEmail}</li>
          <li><strong>Phone:</strong> ${inviteePhone || 'not provided'}</li>
          <li><strong>Exam:</strong> ${examAnswer || 'not specified'}</li>
          <li><strong>Time:</strong> ${startTime}</li>
          <li><strong>Cancel URL:</strong> <a href="${cancelUrl}">${cancelUrl}</a></li>
        </ul>
      `,
    }).catch(err => logger.error('Staff alert email failed', err));

    logger.info('Testing appointment confirmed', { inviteeEmail, examAnswer, startTime });
    return NextResponse.json({ ok: true, event: 'invitee.created' });
  }

  // ── invitee.canceled ───────────────────────────────────────────────────────
  if (eventType === 'invitee.canceled') {

    // Update appointment status
    await db
      .from('testing_appointments')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('calendly_invitee_uri', inviteeUri);

    // Cancel pending reminders
    const { data: appt } = await db
      .from('testing_appointments')
      .select('id')
      .eq('calendly_invitee_uri', inviteeUri)
      .single();

    if (appt?.id) {
      await db
        .from('testing_appointment_reminders')
        .update({ sent: true, canceled: true })
        .eq('appointment_id', appt.id)
        .eq('sent', false);
    }

    // Cancellation email
    if (inviteeEmail) {
      await resend.emails.send({
        from: `Elevate Testing Center <${TESTING_CENTER.email}>`,
        to:   inviteeEmail,
        subject: 'Testing Appointment Canceled — Elevate for Humanity',
        html: cancellationEmailHtml(inviteeName, startTime),
      }).catch(err => logger.error('Cancellation email failed', err));
    }

    // Cancellation SMS
    if (inviteePhone) {
      await sendSMS(inviteePhone,
        `Elevate Testing: Your appointment has been canceled. To reschedule: calendly.com/elevate4humanityedu/60min or call ${TESTING_CENTER.phone}`
      ).catch(err => logger.error('Cancellation SMS failed', err));
    }

    logger.info('Testing appointment canceled', { inviteeEmail, startTime });
    return NextResponse.json({ ok: true, event: 'invitee.canceled' });
  }

  return NextResponse.json({ ok: true, skipped: `unhandled event: ${eventType}` });
}
