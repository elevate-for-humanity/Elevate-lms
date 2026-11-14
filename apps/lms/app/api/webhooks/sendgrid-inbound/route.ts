import { hydrateProcessEnv } from '@/lib/secrets';
import { verifySendGridInboundRequest } from '@/lib/email/verify-sendgrid-inbound';
import { respondToParisMail } from '@/lib/email/paris-mail';
import { logger } from '@/lib/logger';
// PUBLIC ROUTE: SendGrid inbound webhook
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { getErrorContext, normalizeError } from '@/lib/errors/normalize-error';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { claimWebhookEvent, finalizeWebhookEvent, claimInboundForward } from '@/lib/webhooks/event-tracker';
import { parseInboundEmail, resolveForwardTarget } from '@/lib/email/sendgrid-inbound';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { storeInboundCommunicationEmail } from '@/lib/email/communication-inbound';

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

    const { from, to, subject, html, text, replyTo } = parsed;
    const eventId = parsed.deliveryId || parsed.eventId;

    logger.info('[SendGrid Inbound] Received email', { from, to, subject, eventId });

    // Dedup — same email delivered twice by SendGrid retries
    const { shouldProcess, confident, leaseToken } = await claimWebhookEvent(
      'sendgrid-inbound',
      eventId,
      'email.received',
      { from, to, subject },
      { requireFinalizedDuplicate: true },
    );

    if (!shouldProcess) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    if (!confident) {
      logger.error(
        '[SendGrid Inbound] Cannot verify idempotency — rejecting for retry',
        undefined,
        { eventId },
      );
      return NextResponse.json({ error: 'Temporary processing error' }, { status: 503 });
    }

    if (!leaseToken) throw new Error('Inbound delivery lease was not returned');
    activeClaim = { eventId, leaseToken };
    const workspaceDelivery = await storeInboundCommunicationEmail(parsed);
    if(workspaceDelivery.filtered){await finalizeWebhookEvent('sendgrid-inbound',eventId,'processed', undefined, { strict: true, leaseToken });return NextResponse.json({ok:true,filtered:true});}
    if (workspaceDelivery.stored) {
      await respondToParisMail(parsed);
      await finalizeWebhookEvent('sendgrid-inbound', eventId, 'processed', undefined, { strict: true, leaseToken });
      logger.info('[SendGrid Inbound] Stored in Elevate Email', {
        eventId,
        mailboxCount: workspaceDelivery.mailboxCount,
      });
      return NextResponse.json({ ok: true, stored: true });
    }

    const forwardTo = resolveForwardTarget(to);

    logger.info('[SendGrid Inbound] Forwarding', { from, to, forwardTo, subject });

    const forwarding = await claimInboundForward(parsed.eventId, forwardTo);
    if (forwarding.state === 'duplicate') {
      await finalizeWebhookEvent('sendgrid-inbound', eventId, 'processed', undefined, { strict: true, leaseToken });
      return NextResponse.json({ ok: true, idempotent: true });
    }
    if (forwarding.state !== 'claimed' || !forwarding.leaseToken)
      throw new Error('External forwarding outcome requires reconciliation');
    const result = await sendEmail({
      singleAttempt: true,
      to: forwardTo,
      from: `Elevate Forwarding <${PLATFORM_DEFAULTS.emailFromAddress}>`,
      replyTo: replyTo || from,
      subject: `Fwd: ${subject}`,
      html: html || `<p><strong>From:</strong> ${from}</p><p>${text || '(no body)'}</p>`,
      text: text || `From: ${from}\n\n(no body)`,
    });

    await finalizeWebhookEvent('sendgrid-inbound', forwarding.eventId, result.success ? 'processed' : 'errored', result.error, {
      strict: true, leaseToken: forwarding.leaseToken,
      retrySafe: !result.success && (/^SendGrid rejected request \([45]\d\d\)$/.test(result.error || '') || result.error === 'Email service not configured. Set SENDGRID_API_KEY.'),
    });
    if (!result.success) {
      logger.error('[SendGrid Inbound] Forward failed:', result.error);
      await finalizeWebhookEvent('sendgrid-inbound', eventId, 'errored', String(result.error), { strict: true, leaseToken });
      return NextResponse.json({ ok: false, error: 'Forward failed' }, { status: 500 });
    }

    await finalizeWebhookEvent('sendgrid-inbound', eventId, 'processed', undefined, { strict: true, leaseToken });
    logger.info('[SendGrid Inbound] Forwarded successfully', { forwardTo, subject });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (activeClaim) {
      try { await finalizeWebhookEvent('sendgrid-inbound', activeClaim.eventId, 'errored', 'Inbound delivery attempt failed', { strict: true, leaseToken: activeClaim.leaseToken }); }
      catch { /* A stale lease cannot finalize a newer attempt. */ }
    }
    logger.error(
      '[SendGrid Inbound] Webhook error',
      normalizeError(err, 'SendGrid webhook error'),
      getErrorContext(err),
    );
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}

export const POST = withApiAudit('/api/webhooks/sendgrid-inbound', _POST, {
  actor_type: 'webhook',
  skip_body: true,
});
