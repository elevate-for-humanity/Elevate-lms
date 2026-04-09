/**
 * POST /api/internal/testing-reminders
 *
 * Fires pending testing appointment reminders (24hr and 1hr).
 * Called by the daily cron — runs frequently enough to catch both windows.
 * Gated by CRON_SECRET.
 *
 * For each unsent reminder where send_at <= now():
 *   - Send reminder email to invitee
 *   - Send reminder SMS to invitee
 *   - Mark reminder as sent
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { resend } from '@/lib/resend';
import { sendSMS } from '@/lib/notifications/sms';
import { logger } from '@/lib/logger';
import { TESTING_CENTER } from '@/lib/testing/testing-config';
import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const POST = withRuntime(
  { cron: true },
  async () => {

  const db = await getAdminClient();

  // Fetch all unsent reminders due now or overdue
  const { data: reminders, error } = await db
    .from('testing_appointment_reminders')
    .select(`
      id,
      type,
      appointment_id,
      testing_appointments (
        invitee_name,
        invitee_email,
        invitee_phone,
        exam_type,
        start_time,
        status,
        reschedule_url
      )
    `)
    .eq('sent', false)
    .eq('canceled', false)
    .lte('send_at', new Date().toISOString())
    .limit(50);

  if (error) {
    logger.error('Failed to fetch testing reminders', error);
    return NextResponse.json({ error: 'DB error' }, { status: 500 });
  }

  if (!reminders?.length) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  let sent = 0;
  const failed: string[] = [];

  for (const reminder of reminders) {
    const appt = (reminder as any).testing_appointments;
    if (!appt || appt.status === 'canceled') {
      // Mark canceled reminders as done
      await db.from('testing_appointment_reminders')
        .update({ sent: true, canceled: true })
        .eq('id', reminder.id);
      continue;
    }

    const { invitee_name, invitee_email, invitee_phone, exam_type, start_time, reschedule_url } = appt;
    const isOneHour = reminder.type === '1h';

    const date = new Date(start_time);
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric',
    });
    const time = date.toLocaleTimeString('en-US', {
      hour: 'numeric', minute: '2-digit', timeZone: 'America/Indiana/Indianapolis',
    });

    const subject = isOneHour
      ? `Reminder: Your testing appointment is in 1 hour — ${time} ET today`
      : `Reminder: Your testing appointment is tomorrow at ${time} ET`;

    const urgencyNote = isOneHour
      ? '<p style="color:#dc2626;font-weight:bold;">Your appointment is in 1 hour. Please leave now if you haven\'t already.</p>'
      : '<p>Your appointment is tomorrow. Please confirm you have everything ready.</p>';

    const emailHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b;">
  <div style="background: #1e3a5f; padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 20px;">Testing Appointment Reminder</h1>
    <p style="color: #93c5fd; margin: 8px 0 0;">Elevate for Humanity Testing Center</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; padding: 24px; border-radius: 0 0 8px 8px;">
    <p>Hi ${invitee_name},</p>
    ${urgencyNote}
    <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
      <tr style="background: #f8fafc;">
        <td style="padding: 10px 12px; font-weight: bold; width: 120px;">Date</td>
        <td style="padding: 10px 12px;">${formatted}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold;">Time</td>
        <td style="padding: 10px 12px;">${time} ET</td>
      </tr>
      <tr style="background: #f8fafc;">
        <td style="padding: 10px 12px; font-weight: bold;">Exam</td>
        <td style="padding: 10px 12px;">${exam_type || 'See confirmation'}</td>
      </tr>
      <tr>
        <td style="padding: 10px 12px; font-weight: bold;">Location</td>
        <td style="padding: 10px 12px;">${TESTING_CENTER.address}</td>
      </tr>
    </table>
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 4px;">
      <p style="margin: 0; font-weight: bold;">Bring:</p>
      <ul style="margin: 8px 0 0; padding-left: 20px;">
        <li>Valid government-issued photo ID</li>
        <li>Your booking confirmation</li>
      </ul>
      <p style="margin: 8px 0 0;"><strong>Arrive 10 minutes early. No walk-ins accepted.</strong></p>
    </div>
    ${reschedule_url ? `<p style="font-size:13px;color:#64748b;">Need to reschedule? <a href="${reschedule_url}">Click here</a> — do not reply to this email.</p>` : ''}
    <p style="font-size:13px;color:#64748b;">Questions: ${TESTING_CENTER.email} | ${TESTING_CENTER.phone}</p>
  </div>
</body>
</html>`;

    try {
      // Email
      if (invitee_email) {
        await resend.emails.send({
          from: `Elevate Testing Center <${TESTING_CENTER.email}>`,
          to:   invitee_email,
          subject,
          html: emailHtml,
        });
      }

      // SMS
      if (invitee_phone) {
        const smsText = isOneHour
          ? `Elevate Testing REMINDER: Your ${exam_type || 'exam'} is in 1 HOUR at ${time} ET. ${TESTING_CENTER.address}. Bring photo ID.`
          : `Elevate Testing REMINDER: Your ${exam_type || 'exam'} is TOMORROW at ${time} ET. ${TESTING_CENTER.address}. Bring photo ID. Questions: ${TESTING_CENTER.phone}`;
        await sendSMS(invitee_phone, smsText);
      }

      // Mark sent
      await db.from('testing_appointment_reminders')
        .update({ sent: true, sent_at: new Date().toISOString() })
        .eq('id', reminder.id);

      sent++;
    } catch (err) {
      logger.error('Failed to send testing reminder', err as Error, { reminderId: reminder.id });
      failed.push(reminder.id);
    }
  }

  logger.info('Testing reminders processed', { sent, failed: failed.length });
  return NextResponse.json({ ok: true, sent, failed: failed.length });
  }
);
