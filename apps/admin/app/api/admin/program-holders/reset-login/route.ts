import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { logger } from '@/lib/logger';
import { hydrateProcessEnv } from '@/lib/secrets';
import { requireAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { createCredentialVerifier } from '@/lib/supabase/credential-verifier';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ELEVATE_COPY_EMAIL = 'elevate4humanityedu@gmail.com';

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;',
  })[character] ?? character);
}

async function invalidateUndeliveredPassword(
  admin: NonNullable<Awaited<ReturnType<typeof requireAdminClient>>>,
  userId: string,
) {
  await admin.auth.admin.updateUserById(userId, {
    password: `Undelivered!${crypto.randomBytes(24).toString('base64url')}7z`,
  });
}

/**
 * Reset and deliver a program-holder login using the production SendGrid service.
 * The generated password is never returned or logged.
 */
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'api');
  if (rateLimited) return rateLimited;

  await hydrateProcessEnv();
  const sessionClient = await createClient();
  const admin = await requireAdminClient();
  if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 503 });

  const {
    data: { user: actor },
  } = await sessionClient.auth.getUser();
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: actorProfile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', actor.id)
    .maybeSingle();
  if (!actorProfile || !['admin', 'staff'].includes(actorProfile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { holderId, expectedUserId, expectedEmail } = await req.json();
  if (!holderId || !expectedUserId || !expectedEmail) {
    return NextResponse.json({ error: 'holderId, expectedUserId, and expectedEmail are required' }, { status: 400 });
  }

  const normalizedEmail = String(expectedEmail).trim().toLowerCase();
  const { data: holder } = await admin
    .from('program_holders')
    .select('id,user_id,contact_name,organization_name,status')
    .eq('id', holderId)
    .maybeSingle();
  if (!holder || holder.user_id !== expectedUserId || holder.status !== 'approved') {
    return NextResponse.json({ error: 'Approved program holder identity did not match' }, { status: 409 });
  }

  const { data: authResult, error: authError } = await admin.auth.admin.getUserById(expectedUserId);
  if (authError || authResult.user?.email?.toLowerCase() !== normalizedEmail) {
    return NextResponse.json({ error: 'Auth identity did not match' }, { status: 409 });
  }

  const sendgridKey = process.env.SENDGRID_API_KEY?.trim();
  if (!sendgridKey || !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return NextResponse.json({ error: 'Production authentication or email service is unavailable' }, { status: 503 });
  }

  const password = `El!${crypto.randomBytes(18).toString('base64url')}9a`;
  const { error: updateError } = await admin.auth.admin.updateUserById(expectedUserId, {
    password,
    email_confirm: true,
    app_metadata: { ...authResult.user.app_metadata, role: 'program_holder' },
  });
  if (updateError) return NextResponse.json({ error: 'Password update failed' }, { status: 500 });

  const verifier = createCredentialVerifier();
  const { data: verified, error: verifyError } = await verifier.auth.signInWithPassword({
    email: normalizedEmail,
    password,
  });
  await verifier.auth.signOut();
  if (verifyError || verified.user?.id !== expectedUserId) {
    await invalidateUndeliveredPassword(admin, expectedUserId);
    return NextResponse.json({ error: 'Login verification failed' }, { status: 500 });
  }

  const loginUrl = `${(process.env.NEXT_PUBLIC_SITE_URL || 'https://app.elevateforhumanity.org').replace(/\/$/, '')}/login`;
  const html = `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#172033;line-height:1.6"><h2>Your program-holder account is ready</h2><p>Hello ${escapeHtml(holder.contact_name || 'Program Holder')},</p><p>Your permanent Elevate portal login has been set and verified.</p><div style="padding:18px;border:1px solid #dbe3ee;border-radius:10px;background:#f8fafc"><p><strong>Email:</strong> ${escapeHtml(normalizedEmail)}</p><p><strong>Password:</strong> ${escapeHtml(password)}</p><p><a href="${escapeHtml(loginUrl)}">Sign in to Elevate</a></p></div><p>After signing in, you will be routed to the Program Holder dashboard for ${escapeHtml(holder.organization_name)}.</p><p>Elevate for Humanity</p></div>`;

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${sendgridKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: normalizedEmail }], bcc: [{ email: ELEVATE_COPY_EMAIL }] }],
      from: { email: 'info@elevateforhumanity.org', name: 'Elevate for Humanity' },
      reply_to: { email: ELEVATE_COPY_EMAIL },
      subject: 'Your Elevate Program Holder Login',
      content: [{ type: 'text/html', value: html }],
    }),
  });

  if (!response.ok) {
    await invalidateUndeliveredPassword(admin, expectedUserId);
    logger.error('[Admin] SendGrid rejected program-holder credential delivery', undefined, {
      holderId,
      userId: expectedUserId,
      status: response.status,
    });
    return NextResponse.json({ error: 'Credential email delivery failed' }, { status: 502 });
  }

  logger.info('[Admin] Program-holder login reset and delivered', {
    holderId,
    userId: expectedUserId,
    sentBy: actor.id,
    provider: 'sendgrid',
    messageId: response.headers.get('x-message-id'),
  });

  return NextResponse.json({
    success: true,
    provider: 'sendgrid',
    email: normalizedEmail,
    messageId: response.headers.get('x-message-id'),
  });
}
