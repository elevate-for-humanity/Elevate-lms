// AUTH: Intentionally public — orientation booking is open to prospective students
// before they have an account. Rate-limited to 3 req/min via 'contact' tier.

import { NextResponse } from 'next/server';
import { createZoomMeeting } from '@/lib/integrations/zoom';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

// Strip characters that could be used for email header injection
function sanitize(value: string): string {
  return value.replace(/[\r\n\t]/g, ' ').trim().slice(0, 200);
}

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request as any, 'contact');
  if (rateLimited) return rateLimited;

  try {
    const { name, email, date, time, sessionType } = await request.json();

    if (!name || !email || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Basic email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const safeName = sanitize(String(name));
    const safeEmail = sanitize(String(email));

    const isBarbershop = sessionType === 'barbershop';
    const topic = isBarbershop
      ? `Elevate for Humanity — Barbershop Walk-Through: ${safeName}`
      : `Elevate for Humanity — Orientation: ${safeName}`;
    const duration = isBarbershop ? 60 : 45;
    const agenda = isBarbershop
      ? `Barbershop walk-through / site visit for ${safeName} (${safeEmail}). Covers apprenticeship hosting requirements, OJT structure, and next steps.`
      : `Virtual orientation session for ${safeName} (${safeEmail}). Covers programs, funding, enrollment process, and Q&A.`;

    const meeting = await createZoomMeeting({
      topic,
      startTime: `${date}T${time}:00`,
      duration,
      agenda,
      settings: {
        waiting_room: true,
        join_before_host: false,
        mute_upon_entry: true,
        auto_recording: 'cloud',
      },
    });

    logger.info('[Orientation] Zoom meeting created', { meetingId: meeting.id, email: safeEmail });

    const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    const sessionLabel = isBarbershop ? 'Barbershop Walk-Through' : 'Virtual Orientation';
    const firstName = safeName.split(' ')[0];

    // Confirmation email to student/partner
    await sendEmail({
      to: safeEmail,
      subject: `${sessionLabel} Confirmed — ${dateFormatted} at ${time}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<img src="https://www.elevateforhumanity.org/logo.jpg" alt="Elevate for Humanity" width="120" style="margin-bottom:20px"/>
<h2 style="color:#111827">Hi ${firstName},</h2>
<p>Your <strong>${sessionLabel}</strong> with Elevate for Humanity is confirmed.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold;width:120px">Session</td><td style="padding:10px;border:1px solid #e5e7eb">${sessionLabel}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Date</td><td style="padding:10px;border:1px solid #e5e7eb">${dateFormatted}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Time</td><td style="padding:10px;border:1px solid #e5e7eb">${time} Eastern</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Duration</td><td style="padding:10px;border:1px solid #e5e7eb">${duration} minutes</td></tr>
</table>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0">
<strong style="color:#1e40af">Join via Zoom</strong><br/>
<a href="${meeting.join_url}" style="color:#2563eb;font-size:14px">${meeting.join_url}</a><br/>
<span style="color:#6b7280;font-size:12px">Meeting ID: ${meeting.id}</span>
</div>
<p>Need to reschedule? Call or text <strong>(317) 314-3757</strong> or reply to this email.</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
<p style="color:#6b7280;font-size:12px">Elevate for Humanity Career &amp; Technical Institute &middot; Indianapolis, IN</p>
</div>`,
    }).catch((err) => {
      logger.error('[Orientation] Student email failed:', err instanceof Error ? err.message : err);
    });

    // Notify admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[${sessionLabel.toUpperCase()}] ${safeName} — ${dateFormatted} ${time}`,
      html: `<div style="font-family:Arial,sans-serif;padding:20px">
<h2>New ${sessionLabel} Scheduled</h2>
<p><strong>Name:</strong> ${safeName}<br/><strong>Email:</strong> ${safeEmail}<br/><strong>Date:</strong> ${dateFormatted} at ${time} Eastern<br/><strong>Duration:</strong> ${duration} min</p>
<p><a href="${meeting.join_url}">Join Zoom Meeting</a> &mdash; ID: ${meeting.id}</p>
</div>`,
    }).catch((err) => {
      logger.error('[Orientation] Admin email failed:', err instanceof Error ? err.message : err);
    });

    return NextResponse.json({ success: true, meetingUrl: meeting.join_url });
  } catch (err) {
    logger.error('[Orientation] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Failed to create meeting. Please call (317) 314-3757.' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/orientation/schedule', _POST);
