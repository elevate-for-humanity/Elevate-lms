// PUBLIC ROUTE: SendGrid inbound webhook
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { claimWebhookEvent, finalizeWebhookEvent } from '@/lib/webhooks/event-tracker';
import { parseInboundEmail, resolveForwardTarget } from '@/lib/email/sendgrid-inbound';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * SendGrid Inbound Parse webhook — receives emails sent to @elevateforhumanity.org
 * and forwards them to Gmail.
 *
 * Setup required:
 * 1. SendGrid Dashboard → Settings → Inbound Parse → Add Host & URL
 *    - Receiving Domain: elevateforhumanity.org
 *    - Destination URL:  https://www.elevateforhumanity.org/api/webhooks/sendgrid-inbound
 *    - Check "POST the raw, full MIME message" OFF (use default form-encoded)
 *    - Check "Send Raw" OFF
 *
 * 2. DNS — add MX record at your domain registrar:
 *    Type: MX  |  Host: @  |  Value: mx.sendgrid.net  |  Priority: 10
 *    (Remove or lower-priority any existing MX records for the root domain)
 */
async function _POST(request: NextRequest) {
  try {
    const parsed = await parseInboundEmail(request);

    if (!parsed) {
      return NextResponse.json({ error: 'Failed to parse inbound email' }, { status: 400 });
    }

    const { from, to, subject, html, text, replyTo, eventId } = parsed;

    logger.info('[SendGrid Inbound] Received email', { from, to, subject, eventId });

    // Dedup — same email delivered twice by SendGrid retries
    const { shouldProcess, confident } = await claimWebhookEvent(
      'sendgrid-inbound' as any,
      eventId,
      'email.received',
      { from, to, subject },
    );

    if (!shouldProcess) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    if (!confident) {
      logger.error('[SendGrid Inbound] Cannot verify idempotency — rejecting for retry', { eventId });
      return NextResponse.json({ error: 'Temporary processing error' }, { status: 503 });
    }

    const forwardTo = resolveForwardTarget(to);

    logger.info('[SendGrid Inbound] Forwarding', { from, to, forwardTo, subject });

    const result = await sendEmail({
      to:      forwardTo,
      from:    'Elevate Forwarding <noreply@elevateforhumanity.org>',
      replyTo: replyTo || from,
      subject: `Fwd: ${subject}`,
      html:    html || `<p><strong>From:</strong> ${from}</p><p>${text || '(no body)'}</p>`,
      text:    text || `From: ${from}\n\n(no body)`,
    });

    if (!result.success) {
      logger.error('[SendGrid Inbound] Forward failed:', result.error);
      await finalizeWebhookEvent('sendgrid-inbound' as any, eventId, 'errored', String(result.error));
      return NextResponse.json({ ok: false, error: 'Forward failed' }, { status: 500 });
    }

    await finalizeWebhookEvent('sendgrid-inbound' as any, eventId, 'processed');
    logger.info('[SendGrid Inbound] Forwarded successfully', { forwardTo, subject });
    return NextResponse.json({ ok: true });

  } catch (err) {
    logger.error('[SendGrid Inbound] Webhook error:', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/webhooks/sendgrid-inbound', _POST, { actor_type: 'webhook', skip_body: true });
