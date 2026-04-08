import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { logEmailDelivery } from '@/lib/email/monitor';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

import { withRuntime } from '@/lib/api/withRuntime';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/email/send
 * Internal endpoint called by server actions to send transactional emails.
 * Requires x-internal-secret header matching CRON_SECRET — not publicly callable.
 * Rate-limited as a secondary defence.
 */
async function _POST(req: Request) {
  // Verify internal caller — reject any request without the shared secret.
  // This prevents the route from being used as an open email relay.
  const secret = process.env.CRON_SECRET;
  const provided = (req as any).headers?.get?.('x-internal-secret') ??
    (req as Request).headers.get('x-internal-secret');
  if (!secret || provided !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;

  let emailTo = '';
  let emailSubject = '';

  try {
    const body = await req.json();
    const { to, subject, html, text } = body;

    emailTo = Array.isArray(to) ? to[0] : to;
    emailSubject = subject;

    if (!to || !subject || (!html && !text)) {
      return NextResponse.json(
        { error: 'Missing required fields: to, subject, and html or text' },
        { status: 400 }
      );
    }

    const result = await sendEmail({ to: emailTo, subject, html, text });

    await logEmailDelivery({
      to: emailTo,
      subject: emailSubject,
      status: result.success ? 'sent' : 'failed',
      provider: 'sendgrid',
      ...(result.success ? { sent_at: new Date().toISOString() } : {}),
      ...(result.error ? { error_message: result.error } : {}),
    });

    if (result.success) {
      return NextResponse.json({ ok: true, id: result.data?.id });
    }

    return NextResponse.json({ error: result.error }, { status: 500 });
  } catch (error) {
    if (emailTo && emailSubject) {
      await logEmailDelivery({
        to: emailTo,
        subject: emailSubject,
        status: 'failed',
        provider: 'sendgrid',
        error_message: 'Unexpected error',
      });
    }

    return NextResponse.json(
      { error: 'Unexpected error sending email' },
      { status: 500 }
    );
  }
}
export const POST = withRuntime(withApiAudit('/api/email/send', _POST));
