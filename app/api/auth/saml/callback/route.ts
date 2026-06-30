// PUBLIC ROUTE: SAML assertion consumer (IdP POST callback).
/**
 * POST /api/auth/saml/callback
 *
 * SAML 2.0 assertion consumer service (ACS).
 * Active only when SAML_ENABLED=true and SAML_ENTRY_POINT + SAML_CERT are configured.
 *
 * Flow:
 *   IdP → POST SAMLResponse → here → validate → upsert Supabase user → set session → redirect
 *
 * Required env vars:
 *   SAML_ENTRY_POINT   — IdP SSO URL
 *   SAML_ISSUER        — SP entity ID (default: elevate-lms)
 *   SAML_CERT          — IdP public certificate (PEM, no headers)
 *   SAML_CALLBACK_URL  — This route's public URL
 */
import { NextRequest, NextResponse } from 'next/server';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { getAdminClient } from '@/lib/supabase/admin';
import { getRoleDestination } from '@/lib/auth/role-destinations';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'auth');
  if (rateLimited) return rateLimited;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const loginUrl = `${siteUrl}/login`;

  if (process.env.SAML_ENABLED !== 'true') {
    return NextResponse.json({ error: 'SAML SSO is not enabled on this instance' }, { status: 503 });
  }

  const entryPoint = process.env.SAML_ENTRY_POINT;
  const cert       = process.env.SAML_CERT;
  const issuer     = process.env.SAML_ISSUER || 'elevate-lms';
  const callbackUrl = process.env.SAML_CALLBACK_URL || `${siteUrl}/api/auth/saml/callback`;

  if (!entryPoint || !cert) {
    logger.error('[saml/callback] SAML_ENTRY_POINT or SAML_CERT not configured');
    return NextResponse.redirect(`${loginUrl}?error=saml_not_configured`);
  }

  // Parse the multipart/form-data body to get SAMLResponse
  let samlResponse: string | null = null;
  let relayState: string | null = null;
  try {
    const formData = await req.formData();
    samlResponse = formData.get('SAMLResponse') as string | null;
    relayState   = formData.get('RelayState') as string | null;
  } catch {
    return NextResponse.redirect(`${loginUrl}?error=saml_parse_failed`);
  }

  if (!samlResponse) {
    return NextResponse.redirect(`${loginUrl}?error=saml_no_response`);
  }

  try {
    // Dynamically import to avoid loading passport-saml in non-SAML builds
    const { SAML } = await import('@node-saml/passport-saml');

    const saml = new SAML({
      entryPoint,
      issuer,
      callbackUrl,
      idpCert: cert,
      identifierFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress',
      wantAssertionsSigned: true,
      wantAuthnResponseSigned: true,
      signatureAlgorithm: 'sha256',
    });

    // Validate the SAML assertion
    const { profile } = await saml.validatePostResponseAsync({ SAMLResponse: samlResponse }) as { profile: Record<string, any> | null };

    const email = profile?.nameID ?? (profile as Record<string, unknown>)?.email as string;
    if (!email || !email.includes('@')) {
      logger.error('[saml/callback] No email in SAML profile', undefined, { profile });
      return NextResponse.redirect(`${loginUrl}?error=saml_no_email`);
    }

    // Upsert user in Supabase Auth
    const admin = await getAdminClient();
    const { data: existing } = await admin.auth.admin.listUsers();
    const existingUser = existing?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    let userId: string;
    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user — SAML-authenticated, no password
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { sso_provider: 'saml', saml_name_id: profile?.nameID },
      });
      if (createErr || !created?.user) {
        logger.error('[saml/callback] Failed to create user', undefined, { error: createErr?.message });
        return NextResponse.redirect(`${loginUrl}?error=saml_user_create_failed`);
      }
      userId = created.user.id;
    }

    // Generate a magic link to establish a real Supabase session
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo: relayState || `${siteUrl}/auth/callback` },
    });

    if (linkErr || !link?.properties?.action_link) {
      logger.error('[saml/callback] Failed to generate session link', undefined, { error: linkErr?.message });
      return NextResponse.redirect(`${loginUrl}?error=saml_session_failed`);
    }

    logger.info('[saml/callback] SAML login success', { userId, email });
    return NextResponse.redirect(link.properties.action_link);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('[saml/callback] SAML validation failed', undefined, { error: msg });
    return NextResponse.redirect(`${loginUrl}?error=saml_invalid`);
  }
}
