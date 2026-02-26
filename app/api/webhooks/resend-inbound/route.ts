export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { logger } from '@/lib/logger';

function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY not configured');
  return new Resend(key);
}

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
export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

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
    const { data, error } = await getResend().emails.receiving.forward({
      emailId,
      to: forwardTo,
      from: 'Elevate Forwarding <noreply@elevateforhumanity.org>',
    });

    if (error) {
      logger.error('[Resend Inbound] Forward failed:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    logger.info('[Resend Inbound] Forwarded successfully', { emailId, forwardedId: data?.id });
    return NextResponse.json({ ok: true, forwardedId: data?.id });
  } catch (err) {
    logger.error('[Resend Inbound] Webhook error:', err);
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 });
  }
}
