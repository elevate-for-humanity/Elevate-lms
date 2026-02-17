import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireApiAuth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';

async function sendSMS(phone: string, message: string): Promise<boolean> {
  if (
    !process.env.TWILIO_SID ||
    !process.env.TWILIO_AUTH_TOKEN ||
    !process.env.TWILIO_PHONE
  ) {
    return false;
  }

  try {
    const auth = Buffer.from(
      `${process.env.TWILIO_SID}:${process.env.TWILIO_AUTH_TOKEN}`
    ).toString('base64');

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_SID}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          From: process.env.TWILIO_PHONE,
          To: phone,
          Body: message,
        }),
      }
    );

    return response.ok;
  } catch (err) {
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const rateLimited = await applyRateLimit(req, 'api');
    if (rateLimited) return rateLimited;

    // Auth guard: require authenticated admin user
    try {
      await requireApiAuth();
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!profile?.role || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { application_id, reminder_type } = body;

    if (!application_id || !reminder_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Service temporarily unavailable.' },
        { status: 503 }
      );
    }

    // Get application details
    const { data: app, error: appError } = await supabase
      .from('applications')
      .select(
        `
        id,
        first_name,
        phone,
        contact_preference,
        application_checklist (
          workone_appointment_date,
          workone_location
        )
      `
      )
      .eq('id', application_id)
      .single();

    if (appError || !app) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Only send SMS if contact preference is text
    if (app.contact_preference !== 'Text Message') {
      return NextResponse.json(
        { message: 'Contact preference is not SMS' },
        { status: 200 }
      );
    }

    // Build message based on reminder type
    let message = '';
    const checklist = app.application_checklist?.[0];

    switch (reminder_type) {
      case 'workone_24hr':
        message = `Reminder: You have a WorkOne appointment tomorrow${
          checklist?.workone_appointment_date
            ? ` at ${checklist.workone_appointment_date}`
            : ''
        }. Please attend and tell them you are enrolling with Elevate for Humanity. Call 317-314-3757 if you need help.`;
        break;
      case 'workone_2hr':
        message = `Reminder: Your WorkOne appointment is in 2 hours${
          checklist?.workone_location ? ` at ${checklist.workone_location}` : ''
        }. Tell them you are enrolling with Elevate for Humanity.`;
        break;
      case 'workone_followup':
        message = `Hi ${app.first_name}, we noticed you haven't attended your WorkOne appointment yet. Please call us at 317-314-3757 if you need help rescheduling.`;
        break;
      case 'icc_reminder':
        message = `Hi ${app.first_name}, please create your account at IndianaCareerConnect.com and schedule your WorkOne appointment. Call 317-314-3757 if you need help.`;
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid reminder type' },
          { status: 400 }
        );
    }

    // Send SMS
    const sent = await sendSMS(app.phone, message);

    // Log reminder
    await supabase.from('sms_reminders').insert({
      application_id: app.id,
      reminder_type,
      status: sent ? 'sent' : 'failed',
    });

    return NextResponse.json({
      success: sent,
      message: sent ? 'Reminder sent' : 'Failed to send reminder',
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Failed to send reminder' },
      { status: 500 }
    );
  }
}
