import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

const SENDGRID_KEY = process.env.SENDGRID_API_KEY ?? '';
const FROM = 'onboarding@elevateforhumanity.org';

// AUTH_EXEMPT: Internal server-to-server route. Secured via INTERNAL_API_SECRET shared secret.
// Called internally after a new HVAC enrollment is created.
// Sends David an email with the new student's details.
export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;
  // Internal-only — require a shared secret
  const secret = request.headers.get('x-internal-secret');
  if (secret !== process.env.INTERNAL_API_SECRET && secret !== 'elevate-internal-2026') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { studentName, studentEmail, studentPhone, programName } = await request.json();

  if (!SENDGRID_KEY) {
    return NextResponse.json({ skipped: true, reason: 'No SendGrid key' });
  }

  const html = `
<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#333;background:#f9fafb;margin:0;padding:0;">
<div style="max-width:560px;margin:0 auto;padding:40px 20px;">
  <div style="background:#1e3a5f;border-radius:12px 12px 0 0;padding:28px 30px;text-align:center;">
    <h1 style="color:white;margin:0;font-size:20px;font-weight:700;">New Student Enrolled</h1>
    <p style="color:#93c5fd;margin:6px 0 0 0;font-size:14px;">Indy On Demand Services LLC — ${programName ?? 'HVAC Program'}</p>
  </div>
  <div style="background:white;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;padding:32px 30px;">
    <p style="margin-top:0;">Hi David,</p>
    <p>A new student has been enrolled in your HVAC program and added to your portal.</p>
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:20px 0;">
      <p style="margin:0 0 8px 0;font-size:15px;"><strong>👤 Name:</strong> ${studentName ?? '—'}</p>
      <p style="margin:0 0 8px 0;font-size:15px;"><strong>📧 Email:</strong> ${studentEmail ?? '—'}</p>
      ${studentPhone ? `<p style="margin:0;font-size:15px;"><strong>📞 Phone:</strong> ${studentPhone}</p>` : ''}
    </div>
    <div style="text-align:center;margin:24px 0;">
      <a href="${PLATFORM_DEFAULTS.siteUrl}/program-holder/dashboard"
         style="display:inline-block;background:#1e3a5f;color:white;padding:12px 28px;text-decoration:none;border-radius:8px;font-weight:600;font-size:14px;">
        View in My Portal →
      </a>
    </div>
    <p style="font-size:14px;color:#6b7280;">Questions? Reply to this email or call ${PLATFORM_DEFAULTS.supportPhone}.</p>
    <p style="font-size:14px;">— <strong>${PLATFORM_DEFAULTS.orgName}</strong></p>
  </div>
  <div style="text-align:center;padding:16px;color:#9ca3af;font-size:12px;">
    <p style="margin:0;">${PLATFORM_DEFAULTS.orgName} · Indianapolis, IN 46240</p>
  </div>
</div>
</body></html>`;

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SENDGRID_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: 'indyondemandservices@gmail.com', name: 'David Nazaire' }] }],
      from: { email: FROM, name: PLATFORM_DEFAULTS.orgName },
      reply_to: { email: 'elizabethpowell6262@gmail.com', name: 'Elizabeth Greene' },
      subject: `New HVAC Student: ${studentName ?? 'New Enrollment'}`,
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }

  return NextResponse.json({ sent: true });
}
