// app/api/lti/launch/route.ts
// LTI 1.3 launch endpoint — verifies state nonce (CSRF) + JWT signature via JWKS.
import { NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

import { createAdminClient } from '@/lib/supabase/admin';
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { withApiAudit } from '@/lib/audit/withApiAudit';
import { logger } from '@/lib/logger';

const LTI_STATE_COOKIE = 'lti_state';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

// Cache JWKS key sets per JWKS URL to avoid re-fetching on every request.
const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function getJWKS(jwksUri: string) {
  if (!jwksCache.has(jwksUri)) {
    jwksCache.set(jwksUri, createRemoteJWKSet(new URL(jwksUri)));
  }
  return jwksCache.get(jwksUri)!;
}

async function _POST(request: Request) {
  const rateLimited = await applyRateLimit(request, 'api');
  if (rateLimited) return rateLimited;

  const db = createAdminClient();
  const supabase = db;

  const req = request as Request & { cookies?: any };
  const formData = await request.formData();
  const idToken    = String(formData.get('id_token') || '');
  const stateParam = String(formData.get('state')    || '');

  if (!idToken || !stateParam) {
    return NextResponse.json({ error: 'Missing id_token or state' }, { status: 400 });
  }

  // ── CSRF: validate state against the cookie set during login initiation ──
  // Cookie value: "<state>.<nonce>"
  const cookieHeader = (request as any).headers?.get?.('cookie') ?? '';
  const stateCookieMatch = cookieHeader.match(new RegExp(`(?:^|;\\s*)${LTI_STATE_COOKIE}=([^;]+)`));
  const stateCookieValue = stateCookieMatch?.[1] ?? '';
  const [cookieState, cookieNonce] = stateCookieValue.split('.');

  if (!cookieState || cookieState !== stateParam) {
    logger.error('[LTI launch] State mismatch — possible CSRF', { stateParam, cookieState });
    return NextResponse.json({ error: 'Invalid state — launch request may have been tampered with' }, { status: 403 });
  }

  // Clear the state cookie immediately — single use
  const clearStateCookie = `${LTI_STATE_COOKIE}=; Max-Age=0; Path=/api/lti; HttpOnly; Secure; SameSite=None`;

  // ── Step 1: Decode header to extract issuer + client_id without verifying ──
  // We only use this to look up the platform record — we do NOT trust any claims yet.
  let rawIssuer: string;
  let rawClientId: string;
  try {
    const [headerB64, payloadB64] = idToken.split('.');
    const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
    rawIssuer   = payload.iss;
    rawClientId = Array.isArray(payload.aud) ? payload.aud[0] : payload.aud;
    if (!rawIssuer || !rawClientId) throw new Error('Missing iss/aud');
  } catch {
    return NextResponse.json({ error: 'Malformed id_token' }, { status: 400 });
  }

  // ── Step 2: Look up platform config (includes jwks_uri) ──────────────────
  const { data: platform } = await db
    .from('lti_platforms')
    .select('*')
    .eq('issuer', rawIssuer)
    .eq('client_id', rawClientId)
    .maybeSingle();

  if (!platform) {
    return NextResponse.json({ error: 'Unknown LTI platform' }, { status: 403 });
  }

  if (!platform.jwks_uri) {
    logger.error(`[LTI] Platform ${rawIssuer} has no jwks_uri configured`);
    return NextResponse.json({ error: 'Platform JWKS not configured' }, { status: 500 });
  }

  // ── Step 3: Verify JWT signature using platform JWKS ─────────────────────
  let decoded: any;
  try {
    const JWKS = getJWKS(platform.jwks_uri);
    const { payload } = await jwtVerify(idToken, JWKS, {
      issuer:   rawIssuer,
      audience: rawClientId,
    });
    decoded = payload;
  } catch (err) {
    logger.error('[LTI] JWT verification failed:', err);
    return NextResponse.json({ error: 'Invalid or expired id_token' }, { status: 401 });
  }

  // ── Step 3b: Validate nonce claim matches cookie nonce ────────────────────
  if (cookieNonce && decoded.nonce && decoded.nonce !== cookieNonce) {
    logger.error('[LTI launch] Nonce mismatch', { jwtNonce: decoded.nonce, cookieNonce });
    return NextResponse.json({ error: 'Nonce mismatch — replay attack detected' }, { status: 403 });
  }

  // ── Step 4: Extract verified claims ──────────────────────────────────────
  const subject = decoded.sub as string;
  const email   = (decoded.email || decoded['https://purl.imsglobal.org/spec/lti/claim/custom']?.email) as string | undefined;
  const name    = (decoded.name || decoded.given_name) as string | undefined;
  const context       = decoded['https://purl.imsglobal.org/spec/lti/claim/context'] as any;
  const resourceLink  = decoded['https://purl.imsglobal.org/spec/lti/claim/resource_link'] as any;

  if (!subject) {
    return NextResponse.json({ error: 'Missing sub claim' }, { status: 400 });
  }

  // ── Step 5: Upsert user ───────────────────────────────────────────────────
  const { data: user } = await supabase
    .from('users')
    .upsert({ email, name, lti_subject: subject }, { onConflict: 'email' })
    .select()
    .single();

  if (!user) {
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
  }

  // ── Step 6: Upsert course from context ───────────────────────────────────
  const courseTitle = context?.title || 'LTI Course';
  const contextId   = context?.id    || '';

  const { data: course } = await supabase
    .from('training_courses')
    .upsert({ title: courseTitle, lti_context_id: contextId }, { onConflict: 'lti_context_id' })
    .select()
    .single();

  if (!course) {
    return NextResponse.json({ error: 'Failed to create course' }, { status: 500 });
  }

  // ── Step 7: Redirect into LMS — clear the state cookie (single-use) ─────
  const toolUrl = process.env.LTI_TOOL_URL || process.env.NEXT_PUBLIC_APP_URL || '';
  const redirectUrl = `${toolUrl}/lti/course/${course.id}?user=${user.id}`;

  const redirectResponse = NextResponse.redirect(redirectUrl);
  redirectResponse.headers.set('Set-Cookie', clearStateCookie);
  return redirectResponse;
}

export const POST = withApiAudit('/api/lti/launch', _POST);
