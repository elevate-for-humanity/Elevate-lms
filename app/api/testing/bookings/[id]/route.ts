import { safeInternalError } from '@/lib/api/safe-error';

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
import { TESTING_CENTER, TESTING_EMAIL } from '@/lib/testing/testing-config';
const FROM = TESTING_EMAIL.from;

function fmtDate(d: string) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  });
}

async function _PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const db = await getAdminClient();
  if (!db) throw new Error('Admin client failed to initialize');

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single();
  if (!['admin', 'super_admin'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await params;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }); }

  const { status, confirmedDate, confirmedTime, adminNotes } = body;

  const updates: any = { status, updated_at: new Date().toISOString() };
  if (confirmedDate) updates.confirmed_date = confirmedDate;
  if (confirmedTime) updates.confirmed_time = confirmedTime;
  if (adminNotes !== undefined) updates.admin_notes = adminNotes;
  if (status === 'cancelled') updates.cancelled_at = new Date().toISOString();

  const { data: booking, error } = await db
    .from('exam_bookings')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    logger.error('[Testing] Failed to update booking:', error.message);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }

  // Send confirmation email when status changes to 'confirmed'
  if (status === 'confirmed' && booking) {
    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<div style="max-width:600px;margin:24px auto;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
  <div style="background:#1E3A5F;padding:28px 32px;text-align:center">
    <img src="${BASE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="Elevate for Humanity" height="60" style="display:block;margin:0 auto 12px"/>
    <p style="color:#94a3b8;font-size:13px;margin:0">Workforce Credential Testing Center · Indianapolis, IN</p>
  </div>
  <div style="padding:32px;color:#1E293B;font-size:15px;line-height:1.7">
    <h2 style="color:#15803d;margin-top:0">✅ Exam Seat Confirmed</h2>
    <p>Hi ${booking.first_name},</p>
    <p>Your exam seat has been confirmed. Here are your final details:</p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin:20px 0">
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <tr style="border-bottom:1px solid #dcfce7"><td style="padding:8px 0;color:#166534;width:140px">Confirmation Code</td><td style="padding:8px 0;font-weight:800;font-size:18px;letter-spacing:2px;color:#15803d">${booking.confirmation_code}</td></tr>
        <tr style="border-bottom:1px solid #dcfce7"><td style="padding:8px 0;color:#166534">Exam</td><td style="padding:8px 0;font-weight:600">${booking.exam_name}</td></tr>
        <tr style="border-bottom:1px solid #dcfce7"><td style="padding:8px 0;color:#166534">Date</td><td style="padding:8px 0;font-weight:600">${fmtDate(confirmedDate ?? booking.preferred_date)}</td></tr>
        <tr><td style="padding:8px 0;color:#166534">Time</td><td style="padding:8px 0;font-weight:600">${confirmedTime ?? booking.preferred_time}</td></tr>
      </table>
    </div>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px 20px;margin:20px 0">
      <p style="margin:0 0 8px;font-weight:bold;color:#1e40af">Exam Day Instructions</p>
      <ul style="margin:0;padding-left:20px;color:#1e40af;font-size:14px">
        <li>Arrive <strong>15 minutes early</strong> for check-in at the testing center</li>
        <li>Bring a valid <strong>government-issued photo ID</strong></li>
        <li>No phones, notes, or outside materials in the testing room</li>
        <li><strong>Location:</strong> ${TESTING_CENTER.address}</li>
      </ul>
    </div>
    ${adminNotes ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin:20px 0"><p style="margin:0;font-size:14px;color:#475569"><strong>Note from Testing Center:</strong> ${adminNotes}</p></div>` : ''}
    <p>Questions? Reply to this email or call <strong>${TESTING_CENTER.phone}</strong>.</p>
    <p style="margin-bottom:0">See you soon,<br><strong>${TESTING_CENTER.coordinator.name}</strong><br>${TESTING_CENTER.coordinator.title}<br>Elevate for Humanity</p>
  </div>
  <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:20px 32px;text-align:center;color:#64748b;font-size:12px">
    <p style="margin:0">${TESTING_CENTER.address} · ${TESTING_CENTER.phone}</p>
  </div>
</div>
</body></html>`;

    await sendEmail({
      to: booking.email,
      from: FROM,
      subject: `Exam Confirmed — ${fmtDate(confirmedDate ?? booking.preferred_date)} at ${confirmedTime ?? booking.preferred_time} | Elevate Testing Center`,
      html,
    }).catch(e => logger.error('[Testing] Confirm email failed:', e));
  }

  return NextResponse.json({ success: true, booking });
}

export const PATCH = withApiAudit('/api/testing/bookings/[id]', _PATCH);
