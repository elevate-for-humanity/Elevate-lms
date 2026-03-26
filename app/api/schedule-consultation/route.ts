
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { createZoomMeeting } from '@/lib/integrations/zoom';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

async function _POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, phone, notes, appointment_type, appointment_date, appointment_time } = body;

    if (!name || !email || !appointment_type || !appointment_date || !appointment_time) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const typeLabels: Record<string, string> = {
      enrollment: 'Enrollment Consultation',
      funding: 'Financial Aid & Funding Review',
      info: 'Program Information Session',
      career: 'Career Advising',
    };
    const typeLabel = typeLabels[appointment_type] || appointment_type;

    const dateFormatted = new Date(appointment_date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    // Create a real Zoom meeting for this appointment
    let zoomUrl = '';
    let zoomId = '';
    try {
      const meeting = await createZoomMeeting({
        topic: `${typeLabel} — ${name}`,
        startTime: `${appointment_date}T${appointment_time}:00`,
        duration: 30,
        agenda: `${typeLabel} with ${name} (${email})${notes ? `. Notes: ${notes}` : ''}`,
        settings: {
          waiting_room: true,
          join_before_host: false,
          mute_upon_entry: true,
          auto_recording: 'cloud',
        },
      });
      zoomUrl = meeting.join_url;
      zoomId = meeting.id;
      logger.info('[Schedule] Zoom meeting created', { meetingId: meeting.id });
    } catch (zoomErr) {
      logger.error('[Schedule] Zoom meeting creation failed:', zoomErr instanceof Error ? zoomErr.message : zoomErr);
      return NextResponse.json({ error: 'Failed to create Zoom meeting. Please call (317) 314-3757 to schedule.' }, { status: 502 });
    }

    // Save to Supabase
    const supabase = createAdminClient();
    if (supabase) {
      const { error: dbError } = await supabase.from('appointments').insert({
        email,
        subject: name,
        appointment_type,
        appointment_date,
        appointment_time,
        location: zoomUrl,
        service_type: notes || '',
        status: 'scheduled',
        stage: phone || '',
      });
      if (dbError) {
        logger.error('[Schedule] DB insert failed:', dbError.message);
      }
    }

    // Send confirmation to applicant
    await sendEmail({
      to: email,
      subject: `Your Elevate Consultation is Confirmed — ${dateFormatted} at ${appointment_time}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
<img src="https://www.elevateforhumanity.org/logo.png" alt="Elevate" width="120" style="margin-bottom:20px"/>
<h2 style="color:#111827">Hi ${name.split(' ')[0]},</h2>
<p>Your consultation with our enrollment team is confirmed.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold;width:140px">Meeting</td><td style="padding:10px;border:1px solid #e5e7eb">${typeLabel}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Date</td><td style="padding:10px;border:1px solid #e5e7eb">${dateFormatted}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Time</td><td style="padding:10px;border:1px solid #e5e7eb">${appointment_time} (Eastern)</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Location</td><td style="padding:10px;border:1px solid #e5e7eb">Zoom Video Call</td></tr>
</table>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0">
<strong style="color:#1e40af">Join via Zoom</strong><br/>
<a href="${zoomUrl}" style="color:#2563eb;font-size:14px">${zoomUrl}</a><br/>
<span style="color:#3b82f6;font-size:12px">Meeting ID: ${zoomId}</span>
</div>
<h3 style="color:#111827">Before Your Meeting</h3>
<ol style="line-height:1.8">
<li>Register at <a href="https://indianacareerconnect.com" style="color:#dc2626">indianacareerconnect.com</a> if you haven't already</li>
<li>Browse programs at <a href="https://www.elevateforhumanity.org/programs" style="color:#dc2626">elevateforhumanity.org/programs</a></li>
<li>Have your ID and any prior training records ready</li>
</ol>
<p>Need to reschedule? Reply to this email or call <strong>(317) 314-3757</strong>.</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
<p style="color:#6b7280;font-size:12px">Elevate for Humanity &middot; Indianapolis, IN</p>
</div>`,
    }).catch((err) => {
      logger.error('[Schedule] Applicant confirmation email failed:', err instanceof Error ? err.message : err);
    });

    // Notify admin
    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `[NEW APPOINTMENT] ${name} — ${typeLabel} — ${dateFormatted} ${appointment_time}`,
      html: `<div style="font-family:Arial,sans-serif;padding:20px">
<h2 style="color:#111827">New Consultation Booked</h2>
<table style="border-collapse:collapse;margin:12px 0">
<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:bold">Name</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${name}</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:bold">Email</td><td style="padding:6px 12px;border:1px solid #e5e7eb"><a href="mailto:${email}">${email}</a></td></tr>
<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:bold">Phone</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${phone || 'Not provided'}</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:bold">Type</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${typeLabel}</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:bold">Date</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${dateFormatted} at ${appointment_time}</td></tr>
<tr><td style="padding:6px 12px;border:1px solid #e5e7eb;font-weight:bold">Notes</td><td style="padding:6px 12px;border:1px solid #e5e7eb">${notes || 'None'}</td></tr>
</table>
<p><a href="${zoomUrl}">Join Zoom Meeting</a> (ID: ${zoomId})</p>
</div>`,
    }).catch((err) => {
      logger.error('[Schedule] Admin notification email failed:', err instanceof Error ? err.message : err);
    });

    return NextResponse.json({ success: true, meetingUrl: zoomUrl });
  } catch (err) {
    logger.error('[Schedule] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/schedule-consultation', _POST);
