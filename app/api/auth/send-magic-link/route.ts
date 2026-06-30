import { NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { safeError } from '@/lib/api/safe-error';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

// PUBLIC ROUTE: unauthenticated users need this to sign in
export async function POST(req: Request) {
  const rateLimited = await applyRateLimit(req, 'auth');
  if (rateLimited) return rateLimited;

  const { email, redirectTo } = await req.json().catch(() => ({}));

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return safeError('Invalid email address', 400);
  }

  const db = await getAdminClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  // Always route through /auth/callback so the session is established correctly
  // and role-based destination routing runs. Never redirect directly to a page.
  const destination = redirectTo || getRoleDestination('student');
  const finalRedirect = `${siteUrl}/auth/callback?redirect=${encodeURIComponent(destination)}`;

  // generateLink fails with "User not found" for unknown emails — use that as
  // the existence check instead of O(n) listUsers() scan.
  const { data: link, error: linkErr } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email: email.trim(),
    options: { redirectTo: finalRedirect },
  });

  if (linkErr) {
    // Don't reveal whether the email exists — return success either way
    if (linkErr.message?.toLowerCase().includes('not found') ||
        linkErr.message?.toLowerCase().includes('no user')) {
      return NextResponse.json({ ok: true });
    }
    return safeError('Could not generate sign-in link', 500);
  }

  if (!link?.properties?.action_link) {
    return safeError('Could not generate sign-in link', 500);
  }

  const magicLink = link.properties.action_link;
  const firstName = email.split('@')[0];

  const sgKey = process.env.SENDGRID_API_KEY;
  if (!sgKey) {
    return safeError('Email service not configured', 500);
  }

  const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sgKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: email.trim() }] }],
      from: { email: PLATFORM_DEFAULTS.emailFromAddress, name: PLATFORM_DEFAULTS.orgName },
      reply_to: { email: 'elevate4humanityedu@gmail.com' },
      subject: 'Your sign-in link — ${PLATFORM_DEFAULTS.orgName}',
      content: [
        {
          type: 'text/html',
          value: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:32px 24px;background:#fff;">
  // IMAGE-CONTRACT: allow raw img because legacy markup
  <img src="${PLATFORM_DEFAULTS.siteUrl}/images/Elevate_for_Humanity_logo_81bf0fab.jpg" alt="${PLATFORM_DEFAULTS.orgName}" style="height:60px;margin-bottom:24px;" />
  <h2 style="color:#1e293b;margin-bottom:8px;">Hi ${firstName},</h2>
  <p style="color:#475569;font-size:15px;line-height:1.6;">
    Here is your sign-in link for ${PLATFORM_DEFAULTS.orgName}. Click the button below to access your portal — no password needed.
  </p>
  <div style="margin:32px 0;">
    <a href="${magicLink}" style="background:#dc2626;color:#fff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:bold;font-size:16px;display:inline-block;">
      Sign In Now
    </a>
  </div>
  <p style="color:#94a3b8;font-size:13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore it.</p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />
  <p style="color:#94a3b8;font-size:12px;">Elevate for Humanity · Indianapolis, IN</p>
</div>`,
        },
      ],
    }),
  });

  if (res.status !== 202) {
    return safeError('Failed to send email', 500);
  }

  return NextResponse.json({ ok: true });
}
