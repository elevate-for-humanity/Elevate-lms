// PUBLIC ROUTE: public schedule booking form

import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

const ScheduleSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(200),
  phone: z.string().min(7).max(50),
  notes: z.string().max(2000).optional().or(z.literal('')),
  meetingType: z.enum(['virtual', 'phone']),
  date: z.string(), // ISO date string
  time: z.string(), // HH:MM format
  duration: z.number().optional(),
});

async function _POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;


    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ ok: false, error: 'Invalid request body' }, { status: 400 });
    }

    const parsed = ScheduleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { ok: false, error: 'Invalid form data', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const meetingDate = new Date(data.date);
    const dateStr = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });

    // Try saving to Supabase
    let dbSaved = false;
    try {
      const supabase = await getAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { error: dbError } = await supabase
        .from('marketing_contacts')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: data.email,
          tags: ['meeting_request', data.meetingType, `time_${data.time}`],
        });

      if (dbError) {
        logger.warn('Could not save meeting request to database:', dbError);
      } else {
        dbSaved = true;
      }
    } catch (dbErr) {
      logger.warn('Database unavailable for meeting booking:', dbErr);
    }

    // Send email notification
    try {
      const { sendEmail } = await import('@/lib/email/sendgrid');

      await sendEmail({
        to: 'elevate4humanityedu@gmail.com',
        subject: `Meeting Request from ${data.name}`,
        html: `
          <h2>New Meeting Request</h2>
          <p><strong>Name:</strong> ${data.name}</p>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Phone:</strong> ${data.phone}</p>
          <p><strong>Type:</strong> ${data.meetingType === 'virtual' ? 'Virtual Meeting (Google Meet)' : 'Phone Call'}</p>
          <p><strong>Date:</strong> ${dateStr}</p>
          <p><strong>Time:</strong> ${data.time}</p>
          ${data.notes ? `<p><strong>Notes:</strong><br>${data.notes}</p>` : ''}
          <hr>
          <p><em>Submitted from www.elevateforhumanity.org/schedule/meeting</em></p>
        `,
      });

      // Confirmation email to the requester
      await sendEmail({
        to: data.email,
        subject: 'Meeting Request Received — Elevate for Humanity',
        html: `
          <h2>Your Meeting Request Has Been Received</h2>
          <p>Hi ${data.name.split(' ')[0]},</p>
          <p>We received your request for a <strong>${data.meetingType === 'virtual' ? 'virtual meeting' : 'phone call'}</strong>.</p>
          <p><strong>Requested Date:</strong> ${dateStr}<br>
          <strong>Requested Time:</strong> ${data.time}</p>
          <p>Our team will confirm your meeting within 1 business day. If the requested time is unavailable, we will suggest alternatives.</p>
          <p>If you need to reach us sooner, email <a href="mailto:info@elevateforhumanity.org">info@elevateforhumanity.org</a>.</p>
          <p>— Elevate for Humanity</p>
        `,
      });

      // SMS alert via AT&T email-to-SMS gateway (only if configured)
      if (process.env.ADMIN_SMS_GATEWAY) {
        await sendEmail({
          to: process.env.ADMIN_SMS_GATEWAY,
          subject: 'Meeting',
          html: `${data.name}\n${data.meetingType}\n${dateStr} ${data.time}`,
        }).catch((err) => logger.warn('[booking] SMS alert failed:', err));
      }
    } catch (emailErr) {
      logger.error('Failed to send meeting notification email:', emailErr);
    }

    return NextResponse.json({ ok: true, dbSaved });
  } catch (err) {
    logger.error('Booking schedule API error:', err);
    return NextResponse.json(
      { ok: false, error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/booking/schedule', _POST);
