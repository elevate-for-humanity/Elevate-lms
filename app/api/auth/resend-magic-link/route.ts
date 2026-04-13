// PUBLIC ROUTE: magic link resend — no auth possible
/**
 * POST /api/auth/resend-magic-link
 *
 * Generates a fresh Supabase magic link for an existing user and emails it.
 * Used on the apply/success page and learner dashboard holding screen when
 * the user missed or lost their original sign-in link.
 *
 * Rate-limited to 3 requests per 5 minutes per IP (strict tier).
 * Does not confirm whether the email exists — always returns 200 to prevent
 * user enumeration.
 *
 * PUBLIC ROUTE: no session required (user may not be signed in yet).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendEmail } from '@/lib/email';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';
const LOGO_URL = `${SITE_URL}/images/Elevate_for_Humanity_logo_81bf0fab.jpg`;

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const rateLimited = await applyRateLimit(request, 'strict');
  if (rateLimited) return rateLimited;

  let email: string;
  let next: string;

  try {
    const body = await request.json();
    email = (body.email ?? '').trim().toLowerCase();
    next = (body.next ?? '/learner/dashboard').trim();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  // Sanitize next — must be a relative path on this domain
  if (!next.startsWith('/') || next.includes('//') || next.length > 200) {
    next = '/learner/dashboard';
  }

  try {
    const db = await getAdminClient();

    const { data, error } = await db.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        redirectTo: `${SITE_URL}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });

    if (error) {
      // Log but don't expose — could be "user not found" which we don't reveal
      logger.warn('[resend-magic-link] generateLink failed', { email, error: error.message });
      // Return 200 regardless to prevent user enumeration
      return NextResponse.json({ ok: true });
    }

    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      logger.warn('[resend-magic-link] No action_link in response', { email });
      return NextResponse.json({ ok: true });
    }

    await sendEmail({
      to: email,
      subject: 'Your sign-in link — Elevate for Humanity',
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:Georgia,serif;color:#1a1a1a;background:#ffffff">
          <div style="text-align:center;padding:32px 24px 24px">
            <img src="${LOGO_URL}" alt="Elevate for Humanity" width="160" style="max-width:160px;height:auto" />
          </div>
          <div style="padding:0 32px 32px">
            <h2 style="font-weight:normal;font-size:22px;margin:0 0 20px">Your sign-in link</h2>
            <p style="font-size:15px;line-height:1.7;margin:0 0 16px">
              Use the button below to sign in to your Elevate account. This link expires in 1 hour.
            </p>
            <div style="text-align:center;margin:28px 0">
              <a href="${actionLink}"
                 style="display:inline-block;padding:14px 40px;background:#1a1a1a;color:#ffffff;text-decoration:none;border-radius:6px;font-family:Arial,sans-serif;font-weight:bold;font-size:15px">
                Sign In
              </a>
            </div>
            <p style="font-size:13px;color:#888;line-height:1.7">
              If you did not request this link, you can ignore this email.
              Questions? Call <a href="tel:3173143757" style="color:#888">(317) 314-3757</a>.
            </p>
          </div>
        </div>`,
    });

    logger.info('[resend-magic-link] Sent', { email });
    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('[resend-magic-link] Unexpected error', err);
    return NextResponse.json({ ok: true }); // Never reveal internal errors
  }
}
