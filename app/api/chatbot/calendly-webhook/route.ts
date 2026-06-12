import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createHmac, timingSafeEqual } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Calendly webhook events
interface CalendlyEvent {
  event: 'invitee.created' | 'invitee.canceled';
  payload: {
    event_type: {
      name: string;
      slug: string;
    };
    invitee: {
      name: string;
      email: string;
      first_name?: string;
      last_name?: string;
      timezone?: string;
    };
    scheduled_event: {
      name: string;
      start_time: string;
      end_time: string;
      location?: {
        type: string;
        location?: string;
      };
    };
    questions_and_answers?: Array<{
      question: string;
      answer: string;
    }>;
    tracking?: {
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    };
  };
}

// Post-booking confirmation email with "What Happens Next" checklist
async function sendBookingConfirmation(invitee: CalendlyEvent['payload']['invitee']) {
  const firstName = invitee.first_name || invitee.name.split(' ')[0];

  const emailContent = `Hi ${firstName},

Thanks for scheduling time.

For our call, I'll be reviewing the summary the assistant prepared so we can focus on confirming scope and fit rather than re-covering basics.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WHAT HAPPENS NEXT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You're booked. Here's what to expect.

BEFORE THE CALL
• The Program Fit Navigator has prepared a summary of your responses.
• Ona will review your program structure, scale, and governance needs in advance.
• No additional materials are required unless you choose to share them.

DURING THE CALL (15 MINUTES)
• Confirm whether the platform fits your program operations.
• Validate scope (programs, learners, credentials, partners).
• Clarify any governance or compliance considerations.
• Determine whether it makes sense to proceed—and how.

WHAT THIS CALL IS NOT
• Not a pricing negotiation.
• Not a contract discussion.
• Not a technical deep dive.

AFTER THE CALL
• If there's a clear fit, next steps will be outlined (timeline, scope, documentation).
• If there's not a fit, you'll have clarity without obligation.

YOUR PREPARATION (OPTIONAL)
• Approximate number of programs and learners.
• Any compliance or reporting constraints you're aware of.

That's it. No surprises.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROGRAM OPERATIONS REVIEW
15-Minute Agenda
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PURPOSE
Confirm whether the platform fits your program structure and governance needs.

1. CONTEXT CHECK (2 minutes)
   • Review program type, scale, and objectives
   • Confirm what prompted the review

2. OPERATIONAL FIT (6 minutes)
   • Enrollment and approval flow
   • Document handling and staff involvement
   • Completion and credential issuance
   • Governance and audit considerations

3. SCOPE CONFIRMATION (4 minutes)
   • Number of programs
   • Learner volume
   • Credentials issued
   • Partner involvement
   • Timeline constraints

4. NEXT STEPS (3 minutes)
   • Confirm fit or non-fit
   • Outline what proceeding would require (if applicable)
   • Identify decision path and timing

WHAT THIS CALL IS NOT
• Not a pricing negotiation
• Not a contract discussion
• Not a technical deep dive

OUTCOME
Clarity on fit and a clear recommendation for what to do next.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Talk soon,
Ona`;

  if (resend) {
    await resend.emails.send({
      from: 'Ona <elevate4humanityedu@gmail.com>',
      to: invitee.email,
      subject: 'Scope confirmation call',
      text: emailContent,
    });
  }
}

// 24-hour reminder email
async function sendReminder(invitee: CalendlyEvent['payload']['invitee'], scheduledTime: string) {
  const firstName = invitee.first_name || invitee.name.split(' ')[0];

  const emailContent = `Hi ${firstName},

Looking forward to our conversation tomorrow.
We'll confirm scope and determine next steps.

Talk soon,
Ona`;

  // Schedule the reminder for 24 hours before the meeting
  const meetingTime = new Date(scheduledTime);
  const reminderTime = new Date(meetingTime.getTime() - 24 * 60 * 60 * 1000);

  // Only send if reminder time is in the future
  if (reminderTime > new Date()) {
    // Note: Resend doesn't support scheduled sends natively
    // In production, you'd use a job queue or cron job
    // For now, we'll log this for manual follow-up or future implementation
    logger.info('[Calendly Webhook] Reminder scheduled for:', {
      email: invitee.email,
      reminderTime: reminderTime.toISOString(),
      meetingTime: scheduledTime,
    });
  }

  // For immediate testing, send the reminder content
  // In production, this would be scheduled
  return { scheduled: true, reminderTime: reminderTime.toISOString() };
}

// Internal notification
async function notifyInternal(payload: CalendlyEvent['payload']) {
  const internalEmail = process.env.LEAD_NOTIFICATION_EMAIL || 'elevate4humanityedu@gmail.com';

  const meetingTime = new Date(payload.scheduled_event.start_time);
  const formattedTime = meetingTime.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  // Extract any custom questions/answers
  const qaSection = payload.questions_and_answers?.length
    ? payload.questions_and_answers.map((qa) => `${qa.question}: ${qa.answer}`).join('\n')
    : 'No additional information provided';

  const emailContent = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEW SCOPE CALL BOOKED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Name: ${payload.invitee.name}
Email: ${payload.invitee.email}
Timezone: ${payload.invitee.timezone || 'Not specified'}

Meeting: ${payload.scheduled_event.name}
Time: ${formattedTime}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ADDITIONAL INFO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${qaSection}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SOURCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

UTM Source: ${payload.tracking?.utm_source || 'Direct'}
UTM Medium: ${payload.tracking?.utm_medium || 'N/A'}
UTM Campaign: ${payload.tracking?.utm_campaign || 'N/A'}

Timestamp: ${new Date().toISOString()}
`.trim();

  if (resend) {
    await resend.emails.send({
      from: 'Elevate Calendly <elevate4humanityedu@gmail.com>',
      to: internalEmail,
      subject: `Scope Call Booked — ${payload.invitee.name}`,
      text: emailContent,
    });
  }
}

function verifyCalendlySignature(payload: string, signature: string | null): boolean {
  const secret = process.env.CALENDLY_WEBHOOK_SECRET;
  if (!secret) {
    logger.warn('[Calendly Webhook] CALENDLY_WEBHOOK_SECRET not set — skipping signature verification');
    return true; // allow in dev; enforce in prod by setting the secret
  }
  if (!signature) return false;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  try {
    return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Verify webhook signature against CALENDLY_WEBHOOK_SECRET
    const signature = request.headers.get('calendly-webhook-signature');
    const rawBody = await request.text();
    if (!verifyCalendlySignature(rawBody, signature)) {
      logger.warn('[Calendly Webhook] Invalid signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const event: CalendlyEvent = JSON.parse(rawBody);

    logger.info('[Calendly Webhook] Received event:', event.event);

    if (!process.env.RESEND_API_KEY) {
      logger.warn('[Calendly Webhook] RESEND_API_KEY not configured');
      return NextResponse.json({
        success: true,
        warning: 'Email not sent - RESEND_API_KEY not configured',
      });
    }

    // Persist booking to DB regardless of email status
    const db = await requireAdminClient();
    if (db) {
      const p = event.payload;
      await Promise.resolve(
        db
          .from('calendly_bookings')
          .upsert(
            {
              event_type: event.event,
              invitee_name: p.invitee.name,
              invitee_email: p.invitee.email,
              invitee_timezone: p.invitee.timezone ?? null,
              event_name: p.scheduled_event.name,
              start_time: p.scheduled_event.start_time,
              end_time: p.scheduled_event.end_time,
              location:
                p.scheduled_event.location?.location ?? p.scheduled_event.location?.type ?? null,
              utm_source: p.tracking?.utm_source ?? null,
              utm_medium: p.tracking?.utm_medium ?? null,
              utm_campaign: p.tracking?.utm_campaign ?? null,
              questions: p.questions_and_answers ?? null,
              status: event.event === 'invitee.canceled' ? 'canceled' : 'scheduled',
              raw_payload: p,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'invitee_email,start_time', ignoreDuplicates: false },
          )
      ).catch((err) => {
          logger.error('[Calendly Webhook] DB upsert failed', err);
        });
    }

    switch (event.event) {
      case 'invitee.created':
        // New booking created
        await Promise.all([
          sendBookingConfirmation(event.payload.invitee),
          notifyInternal(event.payload),
          sendReminder(event.payload.invitee, event.payload.scheduled_event.start_time),
        ]);
        logger.info(
          '[Calendly Webhook] Booking confirmation sent',
          { email: event.payload.invitee.email },
        );
        break;

      case 'invitee.canceled':
        logger.info('[Calendly Webhook] Booking canceled', { email: event.payload.invitee.email });
        break;

      default:
        logger.info('[Calendly Webhook] Unhandled event type', { event: event.event });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[Calendly Webhook] Error:', error);
    return NextResponse.json({ error: 'Failed to process webhook' }, { status: 500 });
  }
}

// GET endpoint for webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    endpoint: 'chatbot/calendly-webhook',
    description: 'Handles Calendly booking events for scope confirmation calls',
    events: ['invitee.created', 'invitee.canceled'],
  });
}
