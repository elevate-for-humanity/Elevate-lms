
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { TESTING_CENTER, TESTING_EMAIL } from '@/lib/testing/testing-config';
import { withRuntime } from '@/lib/api/withRuntime';
import { formatBookingDate } from '@/lib/testing/booking-validation';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = TESTING_EMAIL.adminEmail;
const FROM = TESTING_EMAIL.from;

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ISO date string YYYY-MM-DD, or empty/null (Calendly flow — date chosen later)
const isoDate = z.string().refine(
  v => !v || /^\d{4}-\d{2}-\d{2}$/.test(v) && !isNaN(new Date(v + 'T12:00:00').getTime()),
  { message: 'Invalid date — use YYYY-MM-DD' }
).transform(v => v || null).nullable().optional();

const BookingSchema = z.object({
  examType:         z.string().min(1),
  examName:         z.string().min(1),
  bookingType:      z.enum(['individual', 'organization']).default('individual'),
  firstName:        z.string().min(1),
  lastName:         z.string().min(1),
  email:            z.string().email(),
  phone:            z.string().nullish().transform(v => v || null),
  organization:     z.string().nullish().transform(v => v || null),
  participantCount: z.number().int().positive().default(1),
  preferredDate:    isoDate,
  preferredTime:    z.string().nullish().transform(v => v || null),
  alternateDate:    isoDate,
  notes:            z.string().nullish().transform(v => v || null),
  addOn:            z.boolean().default(false),
  slotId:           z.string().nullish().transform(v => v || null),
  paymentStatus:    z.string().nullish().transform(v => v || null),
  stripeSessionId:  z.string().nullish().transform(v => v || null),
});

export const POST = withRuntime(
  { rateLimit: 'contact' },
  async (req) => {
    let rawBody: unknown;
    try { rawBody = await req.json(); }
    catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

    const parsed = BookingSchema.safeParse(rawBody);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      examType, examName, bookingType, firstName, lastName, email, phone,
      organization, participantCount, preferredDate, preferredTime,
      alternateDate, notes, addOn, slotId, paymentStatus, stripeSessionId,
    } = parsed.data;

    const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

  const db = createAdminClient();
  const confirmationCode = generateCode();
  const hasAddOn = addOn === true;
  const isPaid = paymentStatus === 'paid';

  // If a slot was selected, verify it still has capacity before booking
  if (slotId) {
    const { data: slot, error: slotErr } = await db
      .from('testing_slots')
      .select('id, capacity, booked_count, is_cancelled')
      .eq('id', slotId)
      .single();

    if (slotErr || !slot) {
      return NextResponse.json({ error: 'Selected slot not found' }, { status: 400 });
    }
    if (slot.is_cancelled) {
      return NextResponse.json({ error: 'Selected slot has been cancelled' }, { status: 400 });
    }
    if (slot.booked_count >= slot.capacity) {
      return NextResponse.json({ error: 'Selected slot is now full — please choose another time' }, { status: 409 });
    }
  }

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
    preferred_date: preferredDate || null,
    preferred_time: preferredTime || null,
    alternate_date: alternateDate || null,
    notes: notes || null,
    status: 'pending',
    confirmation_code: confirmationCode,
    add_on: hasAddOn,
    add_on_paid: isPaid && hasAddOn,
    payment_status: isPaid ? 'paid' : 'unpaid',
    payment_intent_id: stripeSessionId || null,
    slot_id: slotId || null,
  });

  // Increment booked_count on the slot atomically
  if (!insertErr && slotId) {
    await db.rpc('increment_slot_booked_count', { slot_id: slotId }).catch(() => {
      // Non-fatal — admin can reconcile manually
      logger.warn('[testing/book] Failed to increment slot booked_count', { slotId });
    });
  }

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
        <tr style="border-bottom:1px solid #f1f5f9"><td style="padding:8px 0;color:#64748b">Preferred Date</td><td style="padding:8px 0;font-weight:600">${formatBookingDate(preferredDate)}</td></tr>
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
        <li>Location: ${TESTING_CENTER.address}</li>
      </ul>
    </div>
    <p>Questions? Reply to this email or call <strong>${TESTING_CENTER.phone}</strong>.</p>
    <p style="margin-bottom:0">See you soon,<br><strong>${TESTING_CENTER.coordinator.name}</strong><br>${TESTING_CENTER.coordinator.title}<br>Elevate for Humanity</p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;color:#64748b;font-size:12px">
    <p style="margin:0">${TESTING_CENTER.address} · ${TESTING_CENTER.phone}</p>
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
    <tr><td style="padding:6px 12px 6px 0;color:#64748b">Preferred Date</td><td style="padding:6px 0;font-weight:600">${formatBookingDate(preferredDate)} at ${preferredTime}</td></tr>
    ${alternateDate ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b">Alternate Date</td><td style="padding:6px 0">${formatBookingDate(alternateDate)}</td></tr>` : ''}
    ${notes ? `<tr><td style="padding:6px 12px 6px 0;color:#64748b">Notes</td><td style="padding:6px 0">${notes}</td></tr>` : ''}
  </table>
  <p style="margin-top:20px"><a href="${BASE_URL}/admin/testing" style="background:#1E3A5F;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-weight:bold">Manage in Admin →</a></p>
</body></html>`;

  // ── Add-on delivery email ────────────────────────────────────────────────
  const addOnHtml = hasAddOn ? `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fffbeb;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#1E3A5F;padding:28px 32px;text-align:center">
    <img src="${BASE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" height="60" style="display:block;margin:0 auto 12px"/>
    <p style="color:#94a3b8;font-size:13px;margin:0">Certification Success Package</p>
  </div>
  <div style="padding:32px;color:#1E293B;font-size:15px;line-height:1.7">
    <h2 style="color:#1E3A5F;margin-top:0">Your Prep Materials Are Ready</h2>
    <p>Hi ${firstName},</p>
    <p>You added the <strong>Certification Success Package</strong> to your exam booking. Here's what's included and how to access it:</p>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:20px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #fef3c7"><td style="padding:8px 0;color:#92400e;width:200px">Full-length practice test</td><td style="padding:8px 0"><a href="${BASE_URL}/lms" style="color:#1E3A5F;font-weight:600">Access in your LMS account →</a></td></tr>
        <tr style="border-bottom:1px solid #fef3c7"><td style="padding:8px 0;color:#92400e">Study guide</td><td style="padding:8px 0"><a href="${BASE_URL}/lms" style="color:#1E3A5F;font-weight:600">Access in your LMS account →</a></td></tr>
        <tr style="border-bottom:1px solid #fef3c7"><td style="padding:8px 0;color:#92400e">Retake strategy</td><td style="padding:8px 0">Included in your study guide</td></tr>
        <tr><td style="padding:8px 0;color:#92400e">Email support</td><td style="padding:8px 0"><a href="mailto:${TESTING_CENTER.email}" style="color:#1E3A5F;font-weight:600">${TESTING_CENTER.email}</a></td></tr>
      </table>
    </div>
    <p>If you don't have an LMS account yet, reply to this email and we'll get you set up before your exam date.</p>
    <p style="margin-bottom:0">Good luck,<br><strong>${TESTING_CENTER.coordinator.name}</strong><br>${TESTING_CENTER.coordinator.title}<br>Elevate for Humanity</p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;color:#64748b;font-size:12px">
    <p style="margin:0">${TESTING_CENTER.address} · ${TESTING_CENTER.phone}</p>
  </div>
</div>
</body></html>` : null;

  const emailJobs: Promise<unknown>[] = [
    sendEmail({ to: email, from: FROM, subject: `Exam Booking Confirmed — ${confirmationCode} | Elevate Testing Center`, html: candidateHtml }),
    sendEmail({ to: ADMIN_EMAIL, from: FROM, replyTo: email, subject: `New Exam Booking: ${examLabel} — ${firstName} ${lastName} (${confirmationCode})`, html: adminHtml }),
  ];

  if (addOnHtml) {
    emailJobs.push(
      sendEmail({ to: email, from: FROM, subject: `Your Certification Success Package — ${examLabel} | Elevate Testing Center`, html: addOnHtml })
    );
  }

  await Promise.allSettled(emailJobs);

  return NextResponse.json({ success: true, confirmationCode, addOn: hasAddOn });
  }
);
