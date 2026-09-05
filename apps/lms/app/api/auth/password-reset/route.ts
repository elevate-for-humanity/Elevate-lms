import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { sendEmail } from '@/lib/email';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';
import { siteUrls } from '@/lib/utils/site-urls';
import { requireAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const GENERIC_RESPONSE = {
  ok: true,
  message: 'If an account exists for that address, a secure password-reset link has been sent.',
};

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  const body = await request.json().catch(() => null);
  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';
  const programHolder = body?.portal === 'program-holder';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  try {
    const db = await requireAdminClient();
    const resetPath = programHolder
      ? '/reset-password?portal=program-holder&mode=recovery'
      : '/reset-password?mode=recovery';
    const redirectTo = `${siteUrls.app}/api/auth/recovery-callback?next=${encodeURIComponent(resetPath)}`;
    const { data, error } = await db.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    });

    if (error || !data?.properties?.action_link) {
      logger.warn('[password-reset] Recovery link generation failed', {
        error: error?.message ?? 'No action link returned',
      });
      return NextResponse.json(GENERIC_RESPONSE);
    }

    const delivery = await sendEmail({
      to: email,
      subject: `Reset your password — ${PLATFORM_DEFAULTS.orgName}`,
      text: `Use this secure link to reset your password: ${data.properties.action_link}\n\nThis link expires. If you did not request it, ignore this email.`,
      html: `<div style="max-width:600px;margin:0 auto;padding:32px;font-family:Arial,sans-serif;color:#0f172a">
        <h1 style="font-size:24px;margin:0 0 16px">Reset your password</h1>
        <p style="line-height:1.6">Use the secure button below to choose a new password for your ${programHolder ? 'Program Holder' : 'Elevate'} account.</p>
        <p style="margin:28px 0"><a href="${data.properties.action_link}" style="display:inline-block;padding:14px 24px;background:#1d4ed8;color:#fff;text-decoration:none;border-radius:6px;font-weight:700">Reset Password</a></p>
        <p style="font-size:13px;color:#64748b;line-height:1.6">This link expires. If you did not request a password reset, you can ignore this email.</p>
      </div>`,
    });

    if (!delivery.success) {
      logger.error('[password-reset] Email delivery failed', undefined, {
        error: delivery.error,
      });
    }
  } catch (error) {
    logger.error('[password-reset] Unexpected failure', error);
  }

  // Never disclose whether an address has an account.
  return NextResponse.json(GENERIC_RESPONSE);
}
