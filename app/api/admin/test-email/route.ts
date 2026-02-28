import { NextRequest, NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email/sendgrid';
import { withApiAudit } from '@/lib/audit/withApiAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/test-email
 * Auth: token query param or x-admin-test-token header.
 * Body: { to?: string } — defaults to MAIL_TO_ADMIN env.
 *
 * curl -X POST "https://www.elevateforhumanity.org/api/admin/test-email?token=YOUR_TOKEN" \
 *   -H "content-type: application/json" -d '{"to":"you@gmail.com"}'
 */
async function _POST(req: NextRequest) {
  const token = process.env.ADMIN_TEST_EMAIL_TOKEN;
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'ADMIN_TEST_EMAIL_TOKEN not configured' },
      { status: 503 }
    );
  }

  const url = new URL(req.url);
  const provided =
    url.searchParams.get('token') || req.headers.get('x-admin-test-token');
  if (provided !== token) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const to = String(
    body?.to ?? process.env.MAIL_TO_ADMIN ?? ''
  ).trim();

  if (!to) {
    return NextResponse.json(
      { ok: false, error: 'Missing "to" in body or MAIL_TO_ADMIN env var' },
      { status: 400 }
    );
  }

  const result = await sendEmail({
    to,
    subject: `[TEST] Elevate Email System — ${new Date().toISOString()}`,
    html: [
      '<div style="font-family:sans-serif;max-width:600px;margin:0 auto">',
      '<h2 style="color:#059669">Email System Test</h2>',
      '<p>If you received this, SendGrid is configured correctly for Elevate for Humanity.</p>',
      '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>',
      `<p style="color:#6b7280;font-size:14px">Sent to: ${to}<br/>`,
      `Sent at: ${new Date().toLocaleString('en-US', { timeZone: 'America/Indiana/Indianapolis' })} ET</p>`,
      '</div>',
    ].join(''),
    text: 'If you received this, SendGrid is configured correctly for Elevate for Humanity.',
  });

  if (result.success) {
    return NextResponse.json({ ok: true, to, id: result.data?.id });
  }

  return NextResponse.json(
    { ok: false, error: result.error },
    { status: 500 }
  );
}
export const POST = withApiAudit('/api/admin/test-email', _POST);
