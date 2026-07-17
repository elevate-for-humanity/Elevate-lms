// PUBLIC ROUTE: public orientation scheduling form
// AUTH: Intentionally public — orientation booking is open to prospective students
// before they have an account. Rate-limited to 3 req/min via 'contact' tier.

import { NextResponse } from 'next/server';
import { createZoomMeeting } from '@/lib/integrations/zoom';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const ADMIN_EMAIL = 'elevate4humanityedu@gmail.com';

// Strip characters that could be used for email header injection
function sanitize(value: string): string {
  return value
    .replace(/[\r\n\t]/g, ' ')
    .trim()
    .slice(0, 200);
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
      ? `${PLATFORM_DEFAULTS.orgName} — Barbershop Walk-Through: ${safeName}`
      : `${PLATFORM_DEFAULTS.orgName} — Orientation: ${safeName}`;
    const duration = isBarbershop ? 60 : 45;
    const agenda = isBarbershop
      ? `Barbershop walk-through / site visit for ${safeName} (${safeEmail}). Covers apprenticeship hosting requirements, OJT structure, and next steps.`
      : `Virtual orientation session for ${safeName} (${safeEmail}). Covers programs, funding, enrollment process, and Q&A.`;

    // Zoom is optional — fall back to Calendly if credentials aren't configured
    const CALENDLY_FALLBACK = process.env.NEXT_PUBLIC_CALENDLY_30MIN || 'https://calendly.com/elevate4humanityedu';
    let meetingJoinUrl = CALENDLY_FALLBACK;
    let meetingId = '';

    const zoomConfigured = !!(
      process.env.ZOOM_ACCOUNT_ID &&
      process.env.ZOOM_CLIENT_ID &&
      process.env.ZOOM_CLIENT_SECRET
    );

    if (zoomConfigured) {
      try {
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
        meetingJoinUrl = meeting.join_url;
        meetingId = String(meeting.id);
        logger.info('[Orientation] Zoom meeting created', { meetingId, email: safeEmail });
      } catch (zoomErr) {
        logger.warn('[Orientation] Zoom meeting creation failed, falling back to Calendly', zoomErr);
        meetingJoinUrl = CALENDLY_FALLBACK;
      }
    } else {
      logger.info('[Orientation] Zoom not configured — using Calendly link', { email: safeEmail });
    }

    // Alias for email templates below
    const meeting = { join_url: meetingJoinUrl, id: meetingId };

    logger.info('[Orientation] Meeting link resolved', { url: meetingJoinUrl, email: safeEmail });

    const dateFormatted = new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    const sessionLabel = isBarbershop ? 'Barbershop Walk-Through' : 'Virtual Orientation';
    const firstName = safeName.split(' ')[0];

    // Confirmation email to student/partner
    await sendEmail({
      to: safeEmail,
      subject: `${sessionLabel} Confirmed — ${dateFormatted} at ${time}`,
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px">
// IMAGE-CONTRACT: allow raw img because legacy markup
<img src="${PLATFORM_DEFAULTS.siteUrl}/logo.jpg" alt="${PLATFORM_DEFAULTS.orgName}" width="120" style="margin-bottom:20px"/>
<h2 style="color:#111827">Hi ${firstName},</h2>
<p>Your <strong>${sessionLabel}</strong> with ${PLATFORM_DEFAULTS.orgName} is confirmed.</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0">
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold;width:120px">Session</td><td style="padding:10px;border:1px solid #e5e7eb">${sessionLabel}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Date</td><td style="padding:10px;border:1px solid #e5e7eb">${dateFormatted}</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Time</td><td style="padding:10px;border:1px solid #e5e7eb">${time} Eastern</td></tr>
<tr><td style="padding:10px;border:1px solid #e5e7eb;font-weight:bold">Duration</td><td style="padding:10px;border:1px solid #e5e7eb">${duration} minutes</td></tr>
</table>
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:16px;margin:16px 0">
<strong style="color:#1e40af">Join Your Session</strong><br/>
<a href="${meeting.join_url}" style="color:#2563eb;font-size:14px">${meeting.join_url}</a><br/>
${meeting.id ? `<span style="color:#6b7280;font-size:12px">Meeting ID: ${meeting.id}</span>` : ''}
</div>
<p>Need to reschedule? Call or text <strong>${PLATFORM_DEFAULTS.supportPhone}</strong> or reply to this email.</p>
<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
<p style="color:#6b7280;font-size:12px">${PLATFORM_DEFAULTS.orgName} Career &amp; Technical Institute &middot; Indianapolis, IN</p>
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

    // Link scheduling to application status (non-blocking).
    // Advance the most recent active application for this email to 'scheduled'
    // so the admin pipeline reflects the booking. Prospective students who have
    // not yet applied will have no row — that is expected and not an error.
    try {
      const db = await requireAdminClient();
      if (db) {
        const SCHEDULABLE = ['submitted', 'in_review', 'under_review', 'approved', 'enrolled'];
        const { data: app } = await db
          .from('applications')
          .select('id, status')
          .eq('email', safeEmail.toLowerCase())
          .in('status', SCHEDULABLE)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (app) {
          await db
            .from('applications')
            .update({
              status: 'scheduled',
              orientation_date: date,
              updated_at: new Date().toISOString(),
            })
            .eq('id', app.id);
          logger.info('[Orientation] Application advanced to scheduled', { applicationId: app.id });
        }
      }
    } catch (linkErr) {
      // Never block the scheduling response on this
      logger.warn('[Orientation] Application status link failed (non-fatal)', linkErr);
    }

    return NextResponse.json({ success: true, meetingUrl: meeting.join_url });
  } catch (err) {
    logger.error('[Orientation] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json(
      { error: 'Failed to create meeting. Please call ' + PLATFORM_DEFAULTS.supportPhone + '.' },
      { status: 500 },
    );
  }
}
export const POST = withApiAudit('/api/orientation/schedule', _POST);
