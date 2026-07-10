// Admin-only: send a test email via SendGrid to verify configuration
import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { sendEmail } from '@/lib/email/sendgrid';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;
  try {
    await requireRole(['admin']);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const to = String(body?.to ?? '').trim();
  const subject = String(body?.subject ?? 'SendGrid Test — ' + PLATFORM_DEFAULTS.orgName + '').trim();

  if (!to) return NextResponse.json({ error: 'Missing "to" address' }, { status: 400 });

  const result = await sendEmail({
    to,
    from: 'Elevate for Humanity <noreply@elevateforhumanity.org>',
    replyTo: 'elevate4humanityedu@gmail.com',
    subject,
    html: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;">
  <div style="background:#1e293b;padding:24px 32px;border-radius:8px 8px 0 0;">
    <p style="margin:0;color:#fff;font-size:18px;font-weight:700;">${PLATFORM_DEFAULTS.orgName}</p>
    <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">SendGrid Configuration Test</p>
  </div>
  <div style="padding:32px;background:#fff;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px;">
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:20px;margin-bottom:20px;">
      <p style="margin:0;color:#166534;font-weight:700;font-size:16px;">✅ SendGrid is working correctly</p>
      <p style="margin:8px 0 0;color:#374151;font-size:14px;">
        This test email confirms your SendGrid integration is configured and sending successfully.
      </p>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;color:#374151;">
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 0;font-weight:600;width:120px;">Sent to</td>
        <td style="padding:8px 0;">${to}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 0;font-weight:600;">From</td>
        <td style="padding:8px 0;">${PLATFORM_DEFAULTS.emailFromAddress}</td>
      </tr>
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 0;font-weight:600;">Reply-to</td>
        <td style="padding:8px 0;">elevate4humanityedu@gmail.com</td>
      </tr>
      <tr>
        <td style="padding:8px 0;font-weight:600;">Sent at</td>
        <td style="padding:8px 0;">${new Date().toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET</td>
      </tr>
    </table>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
    <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
      ${PLATFORM_DEFAULTS.orgName} · 8888 Keystone Crossing Suite 1300, Indianapolis, IN 46240
    </p>
  </div>
</div>`,
  });

  if (result.success) {
    return NextResponse.json({ ok: true, message: `Test email sent to ${to}` });
  }
  return NextResponse.json({ ok: false, error: result.error ?? 'Send failed' }, { status: 500 });
}
