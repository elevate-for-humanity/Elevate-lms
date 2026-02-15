import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;
import { Resend } from 'resend';
import { logEmailDelivery } from '@/lib/email/monitor';
import { applyRateLimit } from '@/lib/api/withRateLimit';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function POST(req: Request) {
  
    const rateLimited = await applyRateLimit(request, 'strict');
    if (rateLimited) return rateLimited;
const startTime = Date.now();
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

    // If no RESEND_API_KEY, log and return success (dev mode)
    if (!resend) {
      // Log as pending in dev mode
      await logEmailDelivery({
        to: emailTo,
        subject: emailSubject,
        status: 'pending',
        provider: 'resend',
      });

      return NextResponse.json({
        ok: true,
        message: 'Email logged (no API key configured)',
      });
    }

    const { data, error } = await resend!.emails.send({
      from: 'Elevate for Humanity <noreply@www.elevateforhumanity.org>',
      to: Array.isArray(to) ? to : [to],
      subject,
      html: html || text,
      text: text || undefined,
    });

    if (error) {
      // Log failure
      await logEmailDelivery({
        to: emailTo,
        subject: emailSubject,
        status: 'failed',
        provider: 'resend',
        error_message: error instanceof Error ? error.message : String(error) || 'Unknown error',
      });

      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }

    // Log success
    await logEmailDelivery({
      to: emailTo,
      subject: emailSubject,
      status: 'sent',
      provider: 'resend',
      sent_at: new Date().toISOString(),
    });

    const duration = Date.now() - startTime;

    return NextResponse.json({ ok: true, id: data?.id });
  } catch (error) { 
    // Log failure
    if (emailTo && emailSubject) {
      await logEmailDelivery({
        to: emailTo,
        subject: emailSubject,
        status: 'failed',
        provider: 'resend',
        error_message:
          (error instanceof Error ? error.message : String(error)) ||
          'Unexpected error',
      });
    }

    return NextResponse.json(
      { error: 'Unexpected error sending email' },
      { status: 500 }
    );
  }
}
