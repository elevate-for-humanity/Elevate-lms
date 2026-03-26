
import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';
export const maxDuration = 30;

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const ADMIN_EMAIL = 'testing@elevateforhumanity.org';
const FROM = 'Elevate Testing Center <testing@elevateforhumanity.org>';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'standard');
  if (rateLimited) return rateLimited;

  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const {
    examType, examName, bookingType, firstName, lastName, email, phone,
    organization, participantCount, preferredDate, preferredTime,
    alternateDate, notes,
  } = body;

  if (!examType || !firstName || !lastName || !email || !preferredDate || !preferredTime) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const db = createAdminClient();
  const confirmationCode = generateCode();

  const { error: insertErr } = await db.from('exam_bookings').insert({
    exam_type: examType,
    exam_name: examName || examType,
    booking_type: bookingType || 'individual',
    first_name: firstName,
    last_name: lastName,
    email,
    phone: phone || null,
    organization: organization || null,
    participant_count: participantCount || 1,
    preferred_date: preferredDate,
    preferred_time: preferredTime,
    alternate_date: alternateDate || null,
    notes: notes || null,
    status: 'pending',
    confirmation_code: confirmationCode,
  });

  if (insertErr) {
    logger.error('[Testing Book] Insert failed:', insertErr);
    return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 });
  }

  const isOrg = bookingType === 'organization';
  const examLabel = examName || examType;
  const seats = isOrg ? `${participantCount} seats` : '1 seat';

  // ── Confirmation email to candidate/org ──────────────────────────────────
  const candidateHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#1E3A5F;padding:28px 32px;text-align:center">
    <img src="${BASE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" height="60" style="display:block;margin:0 auto 12px"/>
    <p style="color:#94a3b8;font-size:13px;margin:0">Workforce Credential Testing Center · Indianapolis, IN</p>
  </div>
  <div style="padding:32px;color:#1E293B;font-size:15px;line-height:1.7">
    <h2 style="color:#1E3A5F;margin-top:0">Exam Booking Received</h2>
    <p>Hi ${firstName},</p>
    <p>We've received your exam booking request. Our testing coordinator will confirm your seat within <strong>1 business day</strong> and send you a final confirmation with your exact date, time, and check-in instructions.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:20px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b;width:140px">Confirmation Code</td><td style="padding:8px 0;font-weight:800;font-size:18px;letter-spacing:2px;color:#1E3A5F">${confirmationCode}</td></tr>
        <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">Exam</td><td style="padding:8px 0;font-weight:600">${examLabel}</td></tr>
        <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">Seats</td><td style="padding:8px 0;font-weight:600">${seats}</td></tr>
        ${isOrg ? `<tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">Organization</td><td style="padding:8px 0;font-weight:600">${organization}</td></tr>` : ''}
        <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">Preferred Date</td><td style="padding:8px 0;font-weight:600">${fmtDate(preferredDate)}</td></tr>
        <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">Preferred Time</td><td style="padding:8px 0;font-weight:600">${preferredTime}</td></tr>
        <tr><td style="padding:8px 0;color:#64748b">Status</td><td style="padding:8px 0"><span style="background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600">Pending Confirmation</span></td></tr>
      </table>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#1e40af">Exam Day Checklist</p>
      <ul style="margin:0;padding-left:20px;color:#1e40af;font-size:14px">
        <li>Bring a valid government-issued photo ID</li>
        <li>Arrive 15 minutes before your scheduled time</li>
        <li>No phones, notes, or outside materials permitted in the testing room</li>
        <li>Location: 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240</li>
      </ul>
    </div>
    <p>Questions? Reply to this email or call <strong>(317) 314-3757</strong>.</p>
    <p style="margin-bottom:0">See you soon,<br><strong>Alberta Davis</strong><br>Testing Center Coordinator<br>Elevate for Humanity</p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;color:#64748b;font-size:12px">
    <p style="margin:0">8888 Keystone Crossing Suite 1300 · Indianapolis, IN 46240 · (317) 314-3757</p>
  </div>
</div>
</body></html>`;

  // ── Admin notification ───────────────────────────────────────────────────
  const adminHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family:Arial,sans-serif;padding:24px;color:#1E293B">
  <h2 style="color:#1E3A5F">New Exam Booking — ${confirmationCode}</h2>
  <table style="border-collapse:collapse;font-size:14px;width:100%;max-width:500px">
    <tr><td style="padding:6px 12px 6px 0;color:#64748b">Name</td><td style="padding:6px 0;font-weight:600">${firstName} ${lastName}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#64748b">Email</td><td style="padding:6px 0">${email}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#64748b">Phone</td><td style="padding:6px 0">${phone || '—'}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#64748b">Exam</td><td style="padding:6px 0;font-weight:600">${examLabel}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#64748b">Type</td><td style="padding:6px 0">${isOrg ? `Organization — ${organization} (${participantCount} seats)` : 'Individual'}</td></tr>
    <tr><td style="padding:6px 12px 6px 0;color:#64748b">Preferred Date</td><td style="padding:6px 0;font-weight:600">${fmtDate(preferredDate)} at ${preferredTime}</td></tr>
    ${alternateDate ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b">Alternate Date</td><td style="padding:6px 0">${fmtDate(alternateDate)}</td></tr>` : ''}
    ${notes ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b">Notes</td><td style="padding:6px 0">${notes}</td></tr>` : ''}
  </table>
  <p style="margin-top:20px"><a href="${BASE_URL}/admin/testing" style="background:#1E3A5F;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Manage in Admin →</a></p>
</body></html>`;

  await Promise.allSettled([
    sendEmail({ to: email, from: FROM, subject: `Exam Booking Confirmed — ${confirmationCode} | Elevate Testing Center`, html: candidateHtml }),
    sendEmail({ to: ADMIN_EMAIL, from: FROM, replyTo: email, subject: `New Exam Booking: ${examLabel} — ${firstName} ${lastName} (${confirmationCode})`, html: adminHtml }),
  ]);

  return NextResponse.json({ success: true, confirmationCode });
}
