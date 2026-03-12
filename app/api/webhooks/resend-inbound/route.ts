export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { resend } from '@/lib/resend';
import { logger } from '@/lib/logger';
import { withApiAudit } from '@/lib/audit/withApiAudit';

// Where to forward inbound emails. Map recipient prefixes to Gmail.
const FORWARD_MAP: Record<string, string> = {
  'info': 'elevate4humanityedu@gmail.com',
  'support': 'elevate4humanityedu@gmail.com',
  'admissions': 'elevate4humanityedu@gmail.com',
  'enrollment': 'elevate4humanityedu@gmail.com',
};
const DEFAULT_FORWARD = 'elevate4humanityedu@gmail.com';

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

    if (event.type !== 'email.received') {
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

    // Determine forwarding destination based on the recipient address
    let forwardTo = DEFAULT_FORWARD;
    for (const addr of toAddresses) {
      const prefix = addr.split('@')[0]?.toLowerCase();
      if (prefix && FORWARD_MAP[prefix]) {
        forwardTo = FORWARD_MAP[prefix];
        break;
      }
    }

    logger.info('[Resend Inbound] Forwarding email', {
      emailId,
      from,
      to: toAddresses,
      subject,
      forwardTo,
    });

    // Use Resend SDK forward helper — handles content + attachments automatically
    // TODO: receiving.forward is Resend-specific; needs dedicated client if re-enabled
    const { data, error } = await (resend as any).emails.receiving.forward({
      emailId,
      to: forwardTo,
      from: 'Elevate Forwarding <noreply@elevateforhumanity.org>',
    });

    if (error) {
      logger.error('[Resend Inbound] Forward failed:', error);
      return NextResponse.json({ ok: false, error: 'Forward failed' }, { status: 500 });
    }

    logger.info('[Resend Inbound] Forwarded successfully', { emailId, forwardedId: data?.id });
    return NextResponse.json({ ok: true, forwardedId: data?.id });
  } catch (err) {
    logger.error('[Resend Inbound] Webhook error:', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
export const POST = withApiAudit('/api/webhooks/resend-inbound', _POST, { actor_type: 'webhook', skip_body: true });
