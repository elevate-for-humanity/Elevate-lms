
import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { claimWebhookEvent, finalizeWebhookEvent } from '@/lib/webhooks/event-tracker';
import { fetchReceivedEmail, resolveForwardTarget } from '@/lib/email/resend-inbound';
export const runtime = 'nodejs';
export const maxDuration = 30;

export const dynamic = 'force-dynamic';

/**
 * Resend inbound webhook — receives email.received events and forwards
 * emails sent to @elevateforhumanity.org addresses to Gmail.
 *
 * Register this URL in Resend Dashboard → Webhooks:
 *   https://www.elevateforhumanity.org/api/webhooks/resend-inbound
 *   Event: email.received
 */
async function _POST(request: NextRequest) {
  try {
    // Resend delivers webhooks via Svix — verify HMAC-SHA256 signature.
    // Set RESEND_WEBHOOK_SECRET from Resend Dashboard → Webhooks → Signing Secret.
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('[Resend Inbound] RESEND_WEBHOOK_SECRET not configured — rejecting request');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 });
    }

    const svixId = request.headers.get('svix-id');
    const svixTimestamp = request.headers.get('svix-timestamp');
    const svixSignature = request.headers.get('svix-signature');

    if (!svixId || !svixTimestamp || !svixSignature) {
      logger.warn('[Resend Inbound] Missing Svix signature headers');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    // Reject stale webhooks (>5 min)
    if (Math.abs(Date.now() / 1000 - Number(svixTimestamp)) > 300) {
      logger.warn('[Resend Inbound] Stale timestamp rejected');
      return NextResponse.json({ error: 'Request too old' }, { status: 401 });
    }

    const rawBody = await request.text();
    const { createHmac, timingSafeEqual } = await import('crypto');
    // Svix signs: "<svix-id>.<svix-timestamp>.<body>"
    const toSign = `${svixId}.${svixTimestamp}.${rawBody}`;
    // Secret is base64-encoded after the "whsec_" prefix
    const secretBytes = Buffer.from(webhookSecret.replace(/^whsec_/, ''), 'base64');
    const expected = createHmac('sha256', secretBytes).update(toSign).digest('base64');
    // svix-signature may contain multiple space-separated "v1,<sig>" values
    const signatures = svixSignature.split(' ').map(s => s.replace(/^v1,/, ''));
    const valid = signatures.some(sig => {
      try {
        return timingSafeEqual(Buffer.from(sig, 'base64'), Buffer.from(expected, 'base64'));
      } catch { return false; }
    });
    if (!valid) {
      logger.error('[Resend Inbound] Signature mismatch — rejecting');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // svix-id is the stable delivery ID — Svix retries reuse the same svix-id,
    // making it the correct dedup key for this provider.
    const eventId = svixId;

    if (event.type !== 'email.received') {
      // Track non-email events as skipped so the monitor sees all delivery attempts
      await claimWebhookEvent('resend', eventId, event.type || 'unknown', { skipped: true })
        .catch(() => {});
      await finalizeWebhookEvent('resend', eventId, 'skipped', `unhandled type: ${event.type}`)
        .catch(() => {});
      return NextResponse.json({ ok: true, skipped: true });
    }

    const emailId = event.data?.email_id;
    const toAddresses: string[] = event.data?.to || [];
    const from = event.data?.from || '';
    const subject = event.data?.subject || '(no subject)';

    if (!emailId) {
      logger.warn('[Resend Inbound] No email_id in event');
      return NextResponse.json({ ok: false, error: 'missing email_id' }, { status: 400 });
    }

    const { shouldProcess, confident } = await claimWebhookEvent(
      'resend',
      eventId,
      event.type,
      { email_id: emailId, from, subject, to: toAddresses },
    );

    if (!shouldProcess) {
      return NextResponse.json({ ok: true, idempotent: true });
    }

    if (!confident) {
      logger.error('[Resend Inbound] Cannot verify idempotency — rejecting for retry', { eventId });
      return NextResponse.json({ error: 'Temporary processing error' }, { status: 503 });
    }

    const forwardTo = resolveForwardTarget(toAddresses);

    logger.info('[Resend Inbound] Forwarding email', { emailId, from, to: toAddresses, subject, forwardTo });

    // Fetch full email content from Resend, then forward via SendGrid.
    const received = await fetchReceivedEmail(emailId);

    const html = received?.html ?? `<p><strong>From:</strong> ${from}</p><p><em>(Email body unavailable — RESEND_API_KEY not configured)</em></p>`;
    const text = received?.text ?? `From: ${from}\n\n(Email body unavailable — RESEND_API_KEY not configured)`;
    const replyTo = received?.reply_to?.[0] ?? from;

    const result = await sendEmail({
      to: forwardTo,
      from: 'Elevate Forwarding <noreply@elevateforhumanity.org>',
      replyTo,
      subject: `Fwd: ${subject}`,
      html,
      text,
    });

    if (!result.success) {
      logger.error('[Resend Inbound] Forward failed:', result.error);
      await finalizeWebhookEvent('resend', eventId, 'errored', String(result.error));
      return NextResponse.json({ ok: false, error: 'Forward failed' }, { status: 500 });
    }

    await finalizeWebhookEvent('resend', eventId, 'processed');
    logger.info('[Resend Inbound] Forwarded successfully', { emailId, forwardTo });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[Resend Inbound] Webhook error:', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/webhooks/resend-inbound', _POST, { actor_type: 'webhook', skip_body: true });
