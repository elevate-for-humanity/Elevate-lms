import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/resend';
import { logEmailDelivery } from '@/lib/email/monitor';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/email/send
 * Internal endpoint called by server actions to send transactional emails.
 * No auth required — callers are trusted server-side code.
 * Rate-limited to prevent abuse.
 */
async function _POST(req: Request) {
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
      provider: 'resend',
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
        provider: 'resend',
        error_message: 'Unexpected error',
      });
    }

    return NextResponse.json(
      { error: 'Unexpected error sending email' },
      { status: 500 }
    );
  }
}
export const POST = withApiAudit('/api/email/send', _POST);
