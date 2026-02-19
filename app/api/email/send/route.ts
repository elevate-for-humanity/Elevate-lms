import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 60;

import { Resend } from 'resend';
import { logEmailDelivery } from '@/lib/email/monitor';
import nodemailer from 'nodemailer';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// SMTP fallback for when Resend is not configured
function getSmtpTransport() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function POST(req: Request) {
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

    // Try Resend first
    if (resend) {
      const { data, error } = await resend.emails.send({
        from: 'Elevate for Humanity <noreply@elevateforhumanity.org>',
        to: Array.isArray(to) ? to : [to],
        subject,
        html: html || text,
        text: text || undefined,
      });

      if (error) {
        console.error('[Email] Resend failed:', error.message);
        await logEmailDelivery({
          to: emailTo,
          subject: emailSubject,
          status: 'failed',
          provider: 'resend',
          error_message: error.message,
        });
        // Fall through to SMTP
      } else {
        await logEmailDelivery({
          to: emailTo,
          subject: emailSubject,
          status: 'sent',
          provider: 'resend',
          sent_at: new Date().toISOString(),
        });
        return NextResponse.json({ ok: true, id: data?.id, provider: 'resend' });
      }
    }

    // SMTP fallback (Gmail)
    const smtp = getSmtpTransport();
    if (smtp) {
      const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
      await smtp.sendMail({
        from: `Elevate for Humanity <${smtpUser}>`,
        to: Array.isArray(to) ? to.join(', ') : to,
        subject,
        html: html || undefined,
        text: text || undefined,
      });

      await logEmailDelivery({
        to: emailTo,
        subject: emailSubject,
        status: 'sent',
        provider: 'smtp-gmail',
        sent_at: new Date().toISOString(),
      });

      return NextResponse.json({ ok: true, provider: 'smtp' });
    }

    // No email provider configured
    console.warn('[Email] No provider configured (RESEND_API_KEY or SMTP_USER/SMTP_PASS). Email not sent to:', emailTo);
    await logEmailDelivery({
      to: emailTo,
      subject: emailSubject,
      status: 'pending',
      provider: 'none',
    });

    return NextResponse.json({
      ok: false,
      message: 'No email provider configured. Application saved but notification not sent.',
    });
  } catch (error) {
    console.error('[Email] Unexpected error:', error);
    if (emailTo && emailSubject) {
      await logEmailDelivery({
        to: emailTo,
        subject: emailSubject,
        status: 'failed',
        provider: 'unknown',
        error_message: error instanceof Error ? error.message : 'Unexpected error',
      });
    }

    return NextResponse.json(
      { error: 'Unexpected error sending email' },
      { status: 500 }
    );
  }
}
