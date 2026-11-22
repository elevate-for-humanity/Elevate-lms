import { hydrateProcessEnv } from '@/lib/secrets';
import { verifySendGridInboundRequest } from '@/lib/email/verify-sendgrid-inbound';
import { respondToParisMail } from '@/lib/email/paris-mail';
// PUBLIC ROUTE: SendGrid inbound webhook
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { claimWebhookEvent, finalizeWebhookEvent } from '@/lib/webhooks/event-tracker';
import { parseInboundEmail } from '@/lib/email/sendgrid-inbound';
import { storeInboundCommunicationEmail } from '@/lib/email/communication-inbound';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';

/**
 * SendGrid Inbound Parse webhook — receives emails sent to @elevateforhumanity.org
 * and stores them in Elevate Email.
 *
 * Setup required:
 * 1. SendGrid Dashboard → Settings → Inbound Parse → Add Host & URL
 *    - Receiving Domain: elevateforhumanity.org
 *    - Destination URL:  https://www.elevateforhumanity.org/api/webhooks/sendgrid-inbound
 *    - Check "POST the raw, full MIME message" OFF (use default form-encoded)
 *    - Check "Send Raw" OFF
 *
 * Enable an Inbound Parse signing policy and bind its public key to
 * SENDGRID_INBOUND_WEBHOOK_PUBLIC_KEY before releasing this handler.
 *
 * 2. DNS — add MX record at your domain registrar:
 *    Type: MX  |  Host: @  |  Value: mx.sendgrid.net  |  Priority: 10
 *    (Remove or lower-priority any existing MX records for the root domain)
 */
async function _POST(request: NextRequest) {
  let activeClaim: { eventId: string; leaseToken: string } | undefined;
  try {
    await hydrateProcessEnv();
    const verification = await verifySendGridInboundRequest(request, process.env.SENDGRID_INBOUND_WEBHOOK_PUBLIC_KEY);
    if (verification.verified === false)
      return NextResponse.json({ error: verification.status === 503 ? 'Inbound verification unavailable' : 'Invalid webhook signature' }, { status: verification.status });
    const parsed = await parseInboundEmail(request);

    if (!parsed) {
      return NextResponse.json({ error: 'Failed to parse inbound email' }, { status: 400 });
    }

    const eventId = parsed.deliveryId || parsed.eventId;

    // Dedup — same email delivered twice by SendGrid retries
    const { shouldProcess, confident, leaseToken } = await claimWebhookEvent(
      'sendgrid-inbound',
      eventId,
      'email.received',
      { messageKey: parsed.eventId },
      { requireFinalizedDuplicate: true },
    );

    if (!shouldProcess) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    if (!confident) {
      logger.error('[SendGrid Inbound] Cannot verify idempotency — rejecting for retry', {
        eventId,
      });
      return NextResponse.json({ error: 'Temporary processing error' }, { status: 503 });
    }

    if (!leaseToken) throw new Error('Inbound delivery lease was not returned');
    activeClaim = { eventId, leaseToken };
    const delivery = await storeInboundCommunicationEmail(parsed);
    if (!delivery.stored && !delivery.filtered && !delivery.review) {
      throw new Error('Inbound mail could not be stored');
    }
    if (delivery.stored) await respondToParisMail(parsed);
    await finalizeWebhookEvent('sendgrid-inbound', eventId, 'processed', undefined, {
      strict: true,
      leaseToken,
    });
    logger.info('[SendGrid Inbound] Delivery recorded', {
      eventId,
      mailboxCount: delivery.mailboxCount,
      review: delivery.review === true,
    });
    return NextResponse.json({
      ok: true,
      stored: delivery.stored,
      ...(delivery.filtered ? { filtered: true } : {}),
      ...(delivery.review ? { review: true } : {}),
    });
  } catch {
    if (activeClaim) {
      try { await finalizeWebhookEvent('sendgrid-inbound', activeClaim.eventId, 'errored', 'Inbound delivery attempt failed', { strict: true, leaseToken: activeClaim.leaseToken }); }
      catch { /* A stale lease cannot finalize a newer attempt. */ }
    }
    logger.error('[SendGrid Inbound] Delivery failed', undefined, { eventId: activeClaim?.eventId });
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/webhooks/sendgrid-inbound', _POST, {
  actor_type: 'webhook',
  skip_body: true,
});
