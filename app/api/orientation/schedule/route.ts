export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createZoomMeeting } from '@/lib/integrations/zoom';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

export async function POST(request: Request) {
  try {
    const { name, email, date, time } = await request.json();

    if (!name || !email || !date || !time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const meeting = await createZoomMeeting({
      topic: `Elevate for Humanity — Orientation: ${name}`,
      startTime: `${date}T${time}:00`,
      duration: 45,
      agenda: `Virtual orientation session for ${name} (${email})`,
      settings: {
        waiting_room: true,
        join_before_host: false,
        mute_upon_entry: true,
        auto_recording: 'cloud',
      },
    });

    logger.info('[Orientation] Zoom meeting created', { meetingId: meeting.id, email });

    const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    // Confirmation email to student
    await sendEmail({
      to: email,
      subject: `Orientation Confirmed — ${dateFormatted} at ${time}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<img src="https://www.elevateforhumanity.org/logo.png" alt="Elevate" width="120" style="margin-bottom:20px"/>
<h2 style="color:#111827">Hi ${name.split(' ')[0]},</h2>
<p>Your virtual orientation with Elevate for Humanity is confirmed.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold;width:120px">Date</td><td style="padding:10px;border:1px solid #e5e7eb">${dateFormatted}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Time</td><td style="padding:10px;border:1px solid #e5e7eb">${time} (Eastern)</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Duration</td><td style="padding:10px;border:1px solid #e5e7eb">45 minutes</td></tr>
</table>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0">
<strong style="color:#1e40af">Join via Zoom</strong><br/>
<a href="${meeting.join_url}" style="color:#2563eb;font-size:14px">${meeting.join_url}</a><br/>
<span style="color:#3b82f6;font-size:12px">Meeting ID: ${meeting.id}</span>
</div>
<p>Need to reschedule? Reply to this email or call <strong>(317) 314-3757</strong>.</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
<p style="color:#6b7280;font-size:12px">Elevate for Humanity &middot; Indianapolis, IN</p>
</div>`,
    }).catch((err) => {
      logger.error('[Orientation] Student email failed:', err instanceof Error ? err.message : err);
    });

    // Notify admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[ORIENTATION] ${name} — ${dateFormatted} ${time}`,
      html: `<div style="font-family:Arial,sans-serif;padding:20px">
<h2>New Orientation Scheduled</h2>
<p><strong>Name:</strong> ${name}<br/><strong>Email:</strong> ${email}<br/><strong>Date:</strong> ${dateFormatted} at ${time}</p>
<p><a href="${meeting.join_url}">Join Zoom Meeting</a> (ID: ${meeting.id})</p>
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
