import { NextRequest, NextResponse } from 'next/server';
import { apiRequireAdmin } from '@/lib/admin/guards';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendEmail } from '@/lib/email/sendgrid';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/send-email
 * Auth: admin role required.
 * Body: { to, subject, html, text?, fromName? }
 *
 * General-purpose email send for admin tooling (Dev Studio, etc.).
 */
async function _POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'strict');
  if (rateLimited) return rateLimited;
  const auth = await apiRequireAdmin(req);
  if (auth.error) return auth.error;

  const body = await req.json().catch(() => ({}));
  const { to, subject, html, text, fromName } = body as {
    to?: string;
    subject?: string;
    html?: string;
    text?: string;
    fromName?: string;
  };

  if (!to || !subject || !html) {
    return NextResponse.json(
      { error: 'Missing required fields: to, subject, html' },
      { status: 400 },
    );
  }

  const displayName = fromName ? String(fromName) : PLATFORM_DEFAULTS.orgName;
  const fromAddress =
    process.env.EMAIL_FROM || process.env.MAIL_FROM || 'info@elevateforhumanity.org';
  const fromField = `${displayName} <${fromAddress}>`;

  const result = await sendEmail({
    to: String(to).trim(),
    subject: String(subject),
    html: String(html),
    text: text ? String(text) : undefined,
    from: fromField,
  });

  if (result.success) {
    return NextResponse.json({ ok: true, messageId: result.data?.id });
  }

  return NextResponse.json({ error: result.error ?? 'Send failed' }, { status: 500 });
}

export const POST = withApiAudit('/api/admin/send-email', _POST);
