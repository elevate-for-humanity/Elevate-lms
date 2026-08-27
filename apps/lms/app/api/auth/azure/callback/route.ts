// PUBLIC ROUTE: Azure AD OAuth initiation/callback — rate-limited
/**
 * POST /api/auth/azure/callback
 * GET  /api/auth/azure/callback
 *
 * Azure AD OIDC callback. Two modes:
 *
 * 1. GET  — Initiates Azure AD OAuth via Supabase signInWithOAuth (azure provider).
 *           Supabase handles PKCE; the provider redirects back to /auth/callback.
 *           Active when AZURE_AD_ENABLED=true.
 *
 * 2. POST — Receives Azure AD form_post response (used by some enterprise IdP configs).
 *           Validates the id_token and establishes a Supabase session via magic link.
 *           Active when AZURE_AD_ENABLED=true and AZURE_CLIENT_ID/SECRET/TENANT_ID are set.
 *
 * Required env vars:
 *   AZURE_AD_ENABLED    — 'true' to activate
 *   AZURE_CLIENT_ID     — App registration client ID
 *   AZURE_CLIENT_SECRET — App registration client secret
 *   AZURE_TENANT_ID     — Directory (tenant) ID
 */
import { NextRequest, NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { validateRedirect } from '@/lib/auth/validate-redirect';
import { logger } from '@/lib/logger';
import { PLATFORM_DEFAULTS } from '@/lib/config/platform-config';

export const runtime = 'nodejs';

const DISABLED_RESPONSE = () =>
  NextResponse.json({ error: 'Azure AD SSO is not enabled on this instance' }, { status: 503 });

// ── GET: initiate Azure OAuth via Supabase ────────────────────────────────────
export async function GET(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'auth');
  if (rateLimited) return rateLimited;

  if (process.env.AZURE_AD_ENABLED !== 'true') return DISABLED_RESPONSE();

  const rawNext = req.nextUrl.searchParams.get('next') ?? '';
  const next = validateRedirect(rawNext, '/lms/dashboard');
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: {
      redirectTo: `${siteUrl}/auth/callback?redirect=${encodeURIComponent(next)}`,
      scopes: 'openid email profile',
    },
  });

  if (error || !data.url) {
    logger.error('[azure/callback] OAuth initiation failed', new Error(error?.message));
    return NextResponse.redirect(new URL('/login?error=azure_oauth_failed', req.url));
  }

  return NextResponse.redirect(data.url);
}

// ── POST: handle Azure form_post id_token ─────────────────────────────────────
export async function POST(req: NextRequest) {
  const rateLimited = await applyRateLimit(req, 'auth');
  if (rateLimited) return rateLimited;

  if (process.env.AZURE_AD_ENABLED !== 'true') return DISABLED_RESPONSE();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || PLATFORM_DEFAULTS.siteUrl;
  const loginUrl = `${siteUrl}/login`;

  const clientId     = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;
  const tenantId     = process.env.AZURE_TENANT_ID;

  if (!clientId || !clientSecret || !tenantId) {
    logger.error('[azure/callback] Azure AD env vars not configured');
    return NextResponse.redirect(`${loginUrl}?error=azure_not_configured`);
  }

  let idToken: string | null = null;  
  let state: string | null = null;  
  try {
    const formData = await req.formData();
    idToken = formData.get('id_token') as string | null;
    state = formData.get('state') as string | null;
  } catch {
    return NextResponse.redirect(`${loginUrl}?error=azure_parse_failed`);
  }

  if (!idToken) {
    return NextResponse.redirect(`${loginUrl}?error=azure_no_token`);
  }

  try {
    const tenantIssuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;
    const legacyTenantIssuer = `https://sts.windows.net/${tenantId}/`;
    const azureKeys = createRemoteJWKSet(
      new URL(`https://login.microsoftonline.com/${tenantId}/discovery/v2.0/keys`),
    );
    const { payload } = await jwtVerify(idToken, azureKeys, {
      audience: clientId,
      issuer: [tenantIssuer, legacyTenantIssuer],
      algorithms: ['RS256'],
      maxTokenAge: '10m',
    });
    const emailClaim = payload.email ?? payload.preferred_username ?? payload.upn;
    const email = typeof emailClaim === 'string' ? emailClaim : '';

    if (!email || !email.includes('@')) {
      logger.error('[azure/callback] No email in verified Azure id_token');
      return NextResponse.redirect(`${loginUrl}?error=azure_no_email`);
    }

    // Upsert user and generate a Supabase magic link to establish session
    const admin = await getAdminClient();
    if (!admin) {
      logger.error('[azure/callback] Supabase admin client not configured');
      return NextResponse.redirect(`${loginUrl}?error=azure_session_unavailable`);
    }
    const { data: existing } = await admin.auth.admin.listUsers() as { data: { users?: Array<{ email?: string }> } | null };
    const existingUser = existing?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!existingUser) {
      await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: {
          sso_provider: 'azure_ad',
          ...(typeof payload.oid === 'string' ? { azure_oid: payload.oid } : {}),
        },
      });
    }

    const redirectTo = state ? validateRedirect(state, `${siteUrl}/auth/callback`) : `${siteUrl}/auth/callback`;
    const { data: link, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: { redirectTo },
    });

    if (linkErr || !link?.properties?.action_link) {
      logger.error('[azure/callback] Failed to generate session link', new Error(linkErr?.message));
      return NextResponse.redirect(`${loginUrl}?error=azure_session_failed`);
    }

    logger.info('[azure/callback] Azure AD login success', { email });
    return NextResponse.redirect(link.properties.action_link);

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
          logger.error('[azure/callback] id_token processing failed', new Error(msg));
    return NextResponse.redirect(`${loginUrl}?error=azure_invalid`);
  }
}
