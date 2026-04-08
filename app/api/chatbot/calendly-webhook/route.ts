import { logger } from '@/lib/logger';
import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { hydrateProcessEnv } from '@/lib/secrets';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { claimWebhookEvent, finalizeWebhookEvent } from '@/lib/webhooks/event-tracker';
import { withRuntime } from '@/lib/api/withRuntime';

// AUTH: Intentionally public — no authentication required

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Initialize Resend only if API key is available (prevents build errors)

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
      from: 'Ona <info@elevateforhumanity.org>',
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
    ? payload.questions_and_answers.map(qa => `${qa.question}: ${qa.answer}`).join('\n')
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
      from: 'Elevate Calendly <info@elevateforhumanity.org>',
      to: internalEmail,
      subject: `Scope Call Booked — ${payload.invitee.name}`,
      text: emailContent,
    });
  }
}

async function _POST(request: NextRequest) {
  try {
  await hydrateProcessEnv();
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;

    // Verify Calendly webhook signature (HMAC-SHA256, t=timestamp.v1=sig format)
    // Set CALENDLY_WEBHOOK_SECRET to the signing key from Calendly Dashboard → Webhooks.
    // Until configured, requests are accepted but a warning is logged.
    const sigHeader = request.headers.get('calendly-webhook-signature');
    const webhookSecret = process.env.CALENDLY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.warn('[Calendly Webhook] CALENDLY_WEBHOOK_SECRET not set — skipping signature verification');
    } else if (!sigHeader) {
      logger.warn('[Calendly Webhook] Missing signature header — rejecting');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    } else {
      // Parse "t=<timestamp>,v1=<signature>"
      const parts = Object.fromEntries(sigHeader.split(',').map(p => p.split('=')));
      const timestamp = parts['t'];
      const receivedSig = parts['v1'];
      if (!timestamp || !receivedSig) {
        logger.warn('[Calendly Webhook] Malformed signature header');
        return NextResponse.json({ error: 'Invalid signature format' }, { status: 401 });
      }
      // Reject stale webhooks (>5 min)
      if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
        logger.warn('[Calendly Webhook] Stale timestamp rejected');
        return NextResponse.json({ error: 'Request too old' }, { status: 401 });
      }
      const rawBody = await request.text();
      const { createHmac, timingSafeEqual } = await import('crypto');
      const expected = createHmac('sha256', webhookSecret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');
      if (!timingSafeEqual(Buffer.from(receivedSig, 'hex'), Buffer.from(expected, 'hex'))) {
        logger.error('[Calendly Webhook] Signature mismatch — rejecting');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }
    const event: CalendlyEvent = await request.json();

    logger.info('[Calendly Webhook] Received event:', event.event);

    // Use scheduled_event URI as the stable dedup key; fall back to invitee email + type
    const eventId: string =
      (event.payload as Record<string, unknown>)['uri'] as string ||
      `${event.event}:${event.payload.invitee.email}:${event.payload.scheduled_event.start_time}`;

    const { shouldProcess, confident } = await claimWebhookEvent(
      'calendly',
      eventId,
      event.event,
      {
        invitee_email: event.payload.invitee.email,
        event_type_slug: event.payload.event_type.slug,
        start_time: event.payload.scheduled_event.start_time,
      },
    );

    if (!shouldProcess) {
      return NextResponse.json({ received: true, idempotent: true });
    }

    if (!confident) {
      logger.error('[Calendly Webhook] Cannot verify idempotency — rejecting for retry', { eventId });
      return NextResponse.json({ error: 'Temporary processing error' }, { status: 503 });
    }

    try {
      if (!process.env.SENDGRID_API_KEY) {
        logger.warn('[Calendly Webhook] SENDGRID_API_KEY not configured');
        await finalizeWebhookEvent('calendly', eventId, 'skipped', 'SENDGRID_API_KEY not configured');
        return NextResponse.json({ success: true, warning: 'Email not sent - SENDGRID_API_KEY not configured' });
      }

      switch (event.event) {
        case 'invitee.created':
          await Promise.all([
            sendBookingConfirmation(event.payload.invitee),
            notifyInternal(event.payload),
            sendReminder(event.payload.invitee, event.payload.scheduled_event.start_time),
          ]);
          logger.info('[Calendly Webhook] Booking confirmation sent to:', event.payload.invitee.email);
          break;

        case 'invitee.canceled':
          logger.info('[Calendly Webhook] Booking canceled:', event.payload.invitee.email);
          break;

        default:
          logger.info('[Calendly Webhook] Unhandled event type:', event.event);
      }

      await finalizeWebhookEvent('calendly', eventId, 'processed');
      return NextResponse.json({ success: true });

    } catch (error) {
      await finalizeWebhookEvent('calendly', eventId, 'errored', String(error));
      throw error;
    }

  } catch (error) {
    logger.error('[Calendly Webhook] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// GET endpoint for webhook verification
async function _GET(request: Request) {
  
    const rateLimited = await applyRateLimit(request, 'api');
    if (rateLimited) return rateLimited;
return NextResponse.json({
    status: 'ok',
    endpoint: 'chatbot/calendly-webhook',
    description: 'Handles Calendly booking events for scope confirmation calls',
    events: ['invitee.created', 'invitee.canceled'],
  });
}
export const GET = withRuntime(withApiAudit('/api/chatbot/calendly-webhook', _GET, { actor_type: 'webhook', skip_body: true }));
export const POST = withRuntime(withApiAudit('/api/chatbot/calendly-webhook', _POST, { actor_type: 'webhook', skip_body: true }));
