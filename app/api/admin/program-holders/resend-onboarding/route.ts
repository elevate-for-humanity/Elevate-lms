
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';

export const runtime = 'nodejs';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/program-holders/resend-onboarding
 * Body: { holderId: string }
 *
 * Generates a fresh magic link for the program holder and sends it to their
 * email. Safe to call multiple times — each call generates a new link and
 * invalidates the previous one.
 */
export async function POST(req: NextRequest) {
  await hydrateProcessEnv();
  const supabase = await createClient();
  const adminDb = await getAdminClient();

  if (!adminDb) {
    return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });
  }

  // Auth check — admin/staff only
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: profile } = await adminDb
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || !['admin', 'super_admin', 'staff'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { holderId } = body;

  if (!holderId) {
    return NextResponse.json({ error: 'holderId is required' }, { status: 400 });
  }

  // Fetch the holder and their linked auth account email.
  // We send the magic link to the auth account email, not contact_email,
  // to prevent a mismatch if contact details were updated after signup.
  const { data: holder, error: holderError } = await adminDb
    .from('program_holders')
    .select('id, contact_email, contact_name, organization_name, user_id')
    .eq('id', holderId)
    .single();

  if (holderError || !holder) {
    return NextResponse.json({ error: 'Program holder not found' }, { status: 404 });
  }

  if (!holder.user_id) {
    return NextResponse.json({ error: 'This program holder has no linked auth account. They must sign up first.' }, { status: 422 });
  }

  // Resolve the canonical email from the auth account, not the contact record.
  const { data: authUser, error: authUserError } = await adminDb.auth.admin.getUserById(holder.user_id);
  if (authUserError || !authUser?.user?.email) {
    logger.error('[Admin] Could not resolve auth account for program holder', { holderId, userId: holder.user_id });
    return NextResponse.json({ error: 'Could not resolve auth account for this holder.' }, { status: 500 });
  }
  const authEmail = authUser.user.email;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.elevateforhumanity.org';

  // Generate a fresh magic link using the auth account email (canonical).
  const { data: linkData, error: linkError } = await adminDb.auth.admin.generateLink({
    type: 'magiclink',
    email: authEmail,
    options: { redirectTo: `${siteUrl}/program-holder/onboarding` },
  });

  if (linkError || !linkData?.properties?.action_link) {
    logger.error('[Admin] Failed to generate magic link for program holder', linkError);
    return NextResponse.json({ error: 'Could not generate login link. Check that this email has an auth account.' }, { status: 500 });
  }

  const magicLink = linkData.properties.action_link;

  // Send the email
  const sgKey = process.env.SENDGRID_API_KEY;
  if (!sgKey) {
    return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
  }

  const emailPayload = {
    from: { email: 'noreply@elevateforhumanity.org', name: 'Elevate for Humanity' },
    reply_to: { email: 'elevate4humanityedu@gmail.com', name: 'Elizabeth Greene' },
    personalizations: [{ to: [{ email: authEmail, name: holder.contact_name }] }],
    subject: 'Your Onboarding Link — Elevate for Humanity',
    content: [{
      type: 'text/html',
      value: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#f8fafc">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 20px">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1)">
        <tr><td style="background:linear-gradient(135deg,#ea580c 0%,#dc2626 100%);padding:30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:22px">Complete Your Onboarding</h1>
          <p style="color:#fecaca;margin:8px 0 0;font-size:14px">${holder.organization_name} — Elevate for Humanity</p>
        </td></tr>
        <tr><td style="padding:32px">
          <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 16px">Hi ${holder.contact_name},</p>
          <p style="color:#334155;font-size:15px;line-height:1.7;margin:0 0 24px">
            Here is your onboarding link for <strong>${holder.organization_name}</strong>.
            Click the button below to access your program holder portal.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding:8px 0 24px">
              <a href="${magicLink}" style="display:inline-block;background:#dc2626;color:#fff;text-decoration:none;padding:14px 32px;border-radius:6px;font-weight:bold;font-size:16px">
                Go to Onboarding →
              </a>
            </td></tr>
          </table>
          <p style="color:#64748b;font-size:13px;line-height:1.7;margin:0">
            This link expires in 24 hours. If you need a new one, contact us at
            <a href="mailto:info@elevateforhumanity.org" style="color:#dc2626">info@elevateforhumanity.org</a>
            or call <a href="tel:3173143757" style="color:#dc2626">317-314-3757</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    }],
  };

  const sgRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${sgKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(emailPayload),
  });

  if (!sgRes.ok) {
    const err = await sgRes.text();
    logger.error('[Admin] SendGrid failed for resend-onboarding', new Error(err));
    return NextResponse.json({ error: 'Email delivery failed' }, { status: 500 });
  }

  logger.info('[Admin] Onboarding link resent', { holderId, authEmail, contactEmail: holder.contact_email, sentBy: user.id });

  return NextResponse.json({ success: true, email: holder.contact_email });
}
