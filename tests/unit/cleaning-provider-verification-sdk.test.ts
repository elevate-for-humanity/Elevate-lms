// @vitest-environment node
import { createHash, generateKeyPairSync, sign } from 'node:crypto';
import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { describe, expect, it, vi } from 'vitest';

const boundary = vi.hoisted(() => ({ admin: vi.fn(), session: vi.fn(), config: vi.fn(), fetch: vi.fn() }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: boundary.admin }));
vi.mock('@/lib/supabase/server', () => ({ createClient: boundary.session }));
vi.mock('@/lib/supabase/public-config', () => ({ getServerPublicSupabaseConfig: boundary.config }));
vi.mock('@/lib/supabase/timed-fetch', () => ({ timedFetch: boundary.fetch }));
vi.mock('@/lib/apps/website-builder-access', () => ({ getWebsiteBuilderAccess: async () => ({ allowed: true }) }));
// This suite isolates real SDK/cookie/claim behavior. The complete HTTP flow and
// all rate budgets are exercised without limiter mocks in rate-limit-flow.test.
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));

import { sessionCookieOptions } from '@/lib/auth/session-cookie-options';
import { CLEANING_SITE } from '@/lib/cleaning/server';
import { verifiedProviderEmail } from '@/lib/cleaning/provider-email-proof';
import { completeProviderEmailVerification, requestProviderEmailVerification, providerVerificationCookie } from '@/lib/cleaning/provider-email-verification';
import { GET as verificationCallback } from '@/apps/marketing/app/api/tenant-sites/cleaning/provider/verification/callback/route';

const { publicKey, privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
const jwk = { ...publicKey.export({ format: 'jwk' }), kid: 'provider-server-pkce', alg: 'RS256', use: 'sig' };
const config = { url: 'https://provider-flow.example.invalid', anonKey: 'public-test-key' };
const userId = '11111111-1111-4111-8111-111111111111';
const originalSessionId = '22222222-2222-4222-8222-222222222222';
const newSessionId = '33333333-3333-4333-8333-333333333333';
const challengeId = '44444444-4444-4444-8444-444444444444';
const email = 'provider@example.invalid';
const authCode = '12345678-aaaa-4bbb-8ccc-123456789000';
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
type Row = Record<string, any>;

function token(sessionId: string, mailbox = email, method = 'magiclink', subject = userId) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: `${config.url}/auth/v1`, aud: 'authenticated', sub: subject, email: mailbox,
    role: 'authenticated', is_anonymous: false, session_id: sessionId, iat: now, exp: now + 3600,
    amr: [{ method, timestamp: now }] };
  const message = `${encode({ alg: 'RS256', typ: 'JWT', kid: jwk.kid })}.${encode(claims)}`;
  return `${message}.${sign('RSA-SHA256', Buffer.from(message), privateKey).toString('base64url')}`;
}

async function harness() {
  const state = {
    currentEmail: email, currentUserId: userId, newEmail: email, newUserId: userId,
    newMethod: 'magiclink', newSessionId, revokedOriginal: false, revokeOnExchange: false,
    sendStatus: 200, claimOverride: null as Row | null, onExchange: null as (() => void) | null,
    beforeComplete: null as (() => void) | null, proof: null as Row | null,
  };
  const requests: Array<{ path: string; body: Row; url: string }> = [];
  const challenges = new Map<string, Row>();
  const cookies = new Map<string, string>();
  const cookieWrites: Array<Array<{ name: string; value: string; options: Row }>> = [];
  let emailRequest: Row | null = null;
  const user = () => ({ id: state.currentUserId, email: state.currentEmail, aud: 'authenticated',
    role: 'authenticated', email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false,
    app_metadata: {}, user_metadata: {}, created_at: '2026-01-01T00:00:00Z' });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = new URL(typeof input === 'string' ? input : input instanceof URL ? input.href : input.url);
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    requests.push({ path: url.pathname, body, url: url.href });
    if (url.pathname.endsWith('/.well-known/jwks.json')) return json({ keys: [jwk] });
    if (url.pathname.endsWith('/otp')) {
      expect(challenges.size).toBe(1); // Server storage must complete before mail dispatch.
      emailRequest = { ...body, redirect: url.searchParams.get('redirect_to') };
      return state.sendStatus === 200 ? json({}) : json({ msg: 'test mail limit', code: 'over_email_send_rate_limit' }, state.sendStatus);
    }
    if (url.pathname.endsWith('/token')) {
      const expected = createHash('sha256').update(String(body.code_verifier)).digest('base64url');
      if (body.auth_code !== authCode || expected !== emailRequest?.code_challenge || emailRequest?.code_challenge_method !== 's256') {
        return json({ msg: 'Invalid code verifier', code: 'bad_code_verifier' }, 400);
      }
      state.onExchange?.();
      if (state.revokeOnExchange) state.revokedOriginal = true;
      return json({ access_token: token(state.newSessionId, state.newEmail, state.newMethod, state.newUserId),
        refresh_token: 'new-local-test-refresh-token', expires_in: 3600, token_type: 'bearer',
        user: { ...user(), id: state.newUserId, email: state.newEmail } });
    }
    if (url.pathname.endsWith('/user')) {
      const authorization = new Headers(init?.headers).get('authorization') || '';
      const jwt = authorization.replace(/^Bearer /i, '');
      const payload = jwt ? JSON.parse(Buffer.from(jwt.split('.')[1], 'base64url').toString()) : {};
      if (state.revokedOriginal && payload.session_id === originalSessionId) return json({ msg: 'Session revoked', code: 'session_not_found' }, 401);
      return json(user());
    }
    throw new Error('Unexpected local Auth request');
  };
  const db = { rpc: vi.fn(async (name: string, args: Row): Promise<{ data: any; error: any }> => {
    if (name === 'cleaning_provider_proof_begin') {
      const row = { challenge_id: challengeId, user_id: args.p_user_id, email: args.p_email,
        session_id: args.p_session_id, website_id: args.p_website_id, browser_hash: args.p_browser_hash,
        verifier: args.p_verifier, expires_at: new Date(Date.now() + 600_000).toISOString(), claimed: false };
      challenges.set(args.p_state_hash, row);
      return { data: { challenge_id: challengeId, expires_at: row.expires_at }, error: null };
    }
    if (name === 'cleaning_provider_proof_claim') {
      const row = challenges.get(args.p_state_hash);
      if (!row || row.claimed || row.cancelled || Date.parse(row.expires_at) <= Date.now() ||
          row.website_id !== args.p_website_id || row.user_id !== args.p_user_id || row.email !== args.p_email ||
          row.session_id !== args.p_session_id || row.browser_hash !== args.p_browser_hash ||
          state.currentEmail !== args.p_email || state.revokedOriginal) return { data: null, error: null };
      const result = { ...row, ...state.claimOverride };
      Object.assign(row, { claimed: true, claim_hash: args.p_claim_hash, verifier: null });
      return { data: result, error: null };
    }
    if (name === 'cleaning_provider_proof_complete') {
      state.beforeComplete?.();
      const row = [...challenges.values()].find(row => row.challenge_id === args.p_challenge_id);
      const valid = row?.claimed && !row.completed && row.claim_hash === args.p_claim_hash &&
        row.user_id === args.p_user_id && row.email === args.p_email && state.currentEmail === args.p_email &&
        args.p_session_id === state.newSessionId && args.p_session_id !== row.session_id && state.newMethod === 'magiclink';
      if (valid) {
        row.completed = true;
        state.proof = { website_id: row.website_id, user_id: args.p_user_id, email: args.p_email, session_id: args.p_session_id };
      }
      return { data: Boolean(valid), error: null };
    }
    if (name === 'cleaning_provider_proof_valid') return { data: Boolean(state.proof &&
      state.proof.website_id === args.p_website_id && state.proof.user_id === args.p_user_id &&
      state.proof.email === args.p_email && state.proof.session_id === args.p_session_id && state.currentEmail === args.p_email), error: null };
    if (name === 'cleaning_provider_proof_cancel') {
      const row = challenges.get(args.p_state_hash);
      if (row) Object.assign(row, { verifier: null, cancelled: true });
      return { data: true, error: null };
    }
    throw new Error('Unexpected proof RPC');
  }) };
  const makeSession = () => createServerClient(config.url, config.anonKey, {
    auth: { autoRefreshToken: false, detectSessionInUrl: false }, global: { fetch: fetchImpl },
    cookies: {
      getAll: () => [...cookies].map(([name, value]) => ({ name, value })),
      setAll: values => {
        const scoped = values.map(cookie => ({ ...cookie, options: sessionCookieOptions(cookie.options, 'www.elevateforhumanity.org') }));
        for (const cookie of scoped) cookie.value ? cookies.set(cookie.name, cookie.value) : cookies.delete(cookie.name);
        cookieWrites.push(scoped);
      },
    },
  });
  const seed = makeSession();
  const seeded = await seed.auth.setSession({ access_token: token(originalSessionId, email, 'password'), refresh_token: 'original-local-test-refresh-token' });
  expect(seeded.error).toBeNull();
  cookieWrites.length = 0;
  requests.length = 0;
  const session = makeSession();
  boundary.config.mockReturnValue(config);
  boundary.fetch.mockImplementation(fetchImpl);
  boundary.session.mockImplementation(async () => makeSession());
  boundary.admin.mockResolvedValue({ ...db, from: () => {
    const query: any = { select: () => query, eq: () => query, maybeSingle: async () => ({
      data: { id: CLEANING_SITE, user_id: 'website-owner', is_published: true, site_config: { meta: { cleaningProviderOnboardingEnabled: true } } }, error: null,
    }) };
    return query;
  } });
  let browserNonce: string | undefined;
  const start = async () => {
    const current = await session.auth.getUser();
    const result = await requestProviderEmailVerification({ db, user: current.data.user, session, config, fetchImpl,
      request: new Request('https://www.elevateforhumanity.org/api/tenant-sites/cleaning/provider/verification', { method: 'POST' }),
    });
    browserNonce = result.browserNonce;
    return result;
  };
  const finish = (override: Row = {}) => completeProviderEmailVerification({ db, session, config, fetchImpl,
    state: emailRequest ? new URL(emailRequest.redirect).searchParams.get('state') : null,
    browserNonce, code: authCode, ...override });
  return { state, requests, db, challenges, cookies, cookieWrites, makeSession, session, user, start, finish,
    emailRequest: () => emailRequest!, browserNonce: () => browserNonce! };
}

describe('provider mailbox proof through the real installed PKCE and SSR clients', () => {
  it('sends only the verified session email and stores the actual SDK verifier before email dispatch', async () => {
    const f = await harness(); await f.start();
    const sent = f.emailRequest(), row = [...f.challenges.values()][0];
    expect(sent).toMatchObject({ email, create_user: false, code_challenge_method: 's256' });
    expect(createHash('sha256').update(row.verifier).digest('base64url')).toBe(sent.code_challenge);
    const callback = new URL(sent.redirect);
    expect(callback.origin).toBe('https://www.elevateforhumanity.org');
    expect(callback.pathname).toBe('/api/tenant-sites/cleaning/provider/verification/callback');
    expect(callback.searchParams.get('state')).not.toBe(f.browserNonce());
    expect(row.browser_hash).toBe(hash(f.browserNonce()));
    expect(f.cookieWrites).toEqual([]);
    expect([...f.cookies.values()].join('')).not.toContain(row.verifier);
    expect(f.state.proof).toBeNull();
  });

  it('records proof for the new signed session, writes real SSR cookies, and admits the next request', async () => {
    const f = await harness(); await f.start(); await f.finish();
    expect(f.state.proof).toEqual({ website_id: CLEANING_SITE, user_id: userId, email, session_id: newSessionId });
    expect([...f.challenges.values()][0]).toMatchObject({ verifier: null, claimed: true, completed: true });
    expect(f.cookieWrites.length).toBeGreaterThan(0);
    expect(f.cookieWrites.flat().every(cookie => cookie.options.domain === '.elevateforhumanity.org')).toBe(true);
    const nextRequest = f.makeSession();
    const current = await nextRequest.auth.getUser();
    await expect(verifiedProviderEmail(current.data.user, nextRequest, f.db)).resolves.toEqual({ id: userId, email });
    expect(f.requests.filter(request => request.path.endsWith('/token'))).toHaveLength(1);
  });

  it('preserves a legitimate pending cookie through invalid navigation, then accepts the real link', async () => {
    const f = await harness(); await f.start();
    const name = providerVerificationCookie().name;
    f.cookies.set(name, f.browserNonce());
    const navigate = async (url: URL) => {
      const response = await verificationCallback(new NextRequest(url, {
        headers: { cookie: [...f.cookies].map(([key, value]) => `${key}=${value}`).join('; ') },
      }));
      for (const cookie of response.cookies.getAll()) {
        cookie.value ? f.cookies.set(cookie.name, cookie.value) : f.cookies.delete(cookie.name);
      }
      return response;
    };
    const legitimate = new URL(f.emailRequest().redirect);
    legitimate.searchParams.set('code', authCode);
    const invalid = new URL(legitimate);
    invalid.searchParams.set('state', 'f'.repeat(64));
    const rejected = await navigate(invalid);
    expect(rejected.headers.get('location')).toContain('provider_email_verification=expired');
    expect(rejected.headers.get('set-cookie')).toBeNull();
    expect(f.cookies.get(name)).toBe(f.browserNonce());
    expect([...f.challenges.values()][0]).toMatchObject({ claimed: false });
    expect(f.requests.filter(request => request.path.endsWith('/token'))).toHaveLength(0);

    const completed = await navigate(legitimate);
    expect(completed.headers.get('location')).toContain('provider_email_verification=success');
    expect(completed.headers.get('set-cookie')).toContain('Max-Age=0');
    expect(f.cookies.has(name)).toBe(false);
    expect(f.state.proof?.session_id).toBe(newSessionId);
    const next = f.makeSession();
    await expect(verifiedProviderEmail((await next.auth.getUser()).data.user, next, f.db)).resolves.toEqual({ id: userId, email });
    expect(f.requests.filter(request => request.path.endsWith('/token'))).toHaveLength(1);
  });

  it.each(['malformed', 'unknown', 'wrong-browser', 'expired', 'wrong-session'])('does not report an unclaimed challenge as consumed (%s)', async variant => {
    const f = await harness(); await f.start();
    const options: Row = {};
    if (variant === 'malformed') options.state = 'bad';
    if (variant === 'unknown') options.state = 'f'.repeat(64);
    if (variant === 'wrong-browser') options.browserNonce = 'f'.repeat(64);
    if (variant === 'expired') [...f.challenges.values()][0].expires_at = '2000-01-01T00:00:00Z';
    if (variant === 'wrong-session') await f.session.auth.setSession({ access_token: token('another-session', email, 'password'), refresh_token: 'other-local-test-token' });
    await expect(f.finish(options)).rejects.toMatchObject({ challengeConsumed: false });
    expect([...f.challenges.values()][0].claimed).toBe(false);
  });

  it.each(['claimed-fields', 'claimed-expiry', 'exchange', 'proof', 'set-session'])('reports consumed challenges after later failure (%s)', async variant => {
    const f = await harness(); await f.start();
    const options: Row = {};
    if (variant === 'claimed-fields') f.state.claimOverride = { email: 'wrong@example.invalid' };
    if (variant === 'claimed-expiry') f.state.claimOverride = { expires_at: '2000-01-01T00:00:00Z' };
    if (variant === 'exchange') options.code = 'wrong-auth-code';
    if (variant === 'proof') f.state.beforeComplete = () => { f.state.currentEmail = 'changed@example.invalid'; };
    if (variant === 'set-session') vi.spyOn(f.session.auth, 'setSession').mockRejectedValue(new Error('Session cookie storage unavailable'));
    await expect(f.finish(options)).rejects.toMatchObject({ challengeConsumed: true });
    expect([...f.challenges.values()][0]).toMatchObject({ claimed: true, verifier: null });
  });

  it('supports a valid exchange that revokes the original login under single-session Auth', async () => {
    const f = await harness(); await f.start(); f.state.revokeOnExchange = true;
    await expect(f.finish()).resolves.toBeUndefined();
    expect(f.state.proof?.session_id).toBe(newSessionId);
    const next = f.makeSession();
    await expect(verifiedProviderEmail((await next.auth.getUser()).data.user, next, f.db)).resolves.toEqual({ id: userId, email });
  });

  it('keeps proof on a refreshed token for the same email and session', async () => {
    const f = await harness(); await f.start(); await f.finish();
    await f.session.auth.setSession({ access_token: token(newSessionId), refresh_token: 'rotated-local-test-token' });
    const next = f.makeSession();
    await expect(verifiedProviderEmail((await next.auth.getUser()).data.user, next, f.db)).resolves.toEqual({ id: userId, email });
  });

  it.each([undefined, 'wrong-browser', 'a'.repeat(64)])('rejects absent, malformed, or mismatched browser nonce %s before exchanging', async browserNonce => {
    const f = await harness(); await f.start();
    await expect(f.finish({ browserNonce })).rejects.toThrow();
    expect(f.requests.filter(request => request.path.endsWith('/token'))).toEqual([]);
    expect(f.cookieWrites).toEqual([]); expect(f.state.proof).toBeNull();
  });

  it('rejects a consumed link and allows only one concurrent callback to exchange', async () => {
    const f = await harness(); await f.start();
    const outcomes = await Promise.allSettled([f.finish(), f.finish()]);
    expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(f.requests.filter(request => request.path.endsWith('/token'))).toHaveLength(1);
    await expect(f.finish()).rejects.toThrow();
    expect(f.requests.filter(request => request.path.endsWith('/token'))).toHaveLength(1);
  });

  it('rejects an expired challenge without an Auth exchange or session cookies', async () => {
    const f = await harness(); await f.start();
    [...f.challenges.values()][0].expires_at = '2000-01-01T00:00:00Z';
    await expect(f.finish()).rejects.toThrow();
    expect(f.requests.some(request => request.path.endsWith('/token'))).toBe(false);
    expect(f.cookieWrites).toEqual([]); expect(f.state.proof).toBeNull();
  });

  it('rejects an old code after the original account changes email, even with refreshed signed claims', async () => {
    const f = await harness(); await f.start(); f.state.currentEmail = 'changed@example.invalid';
    await f.session.auth.setSession({ access_token: token(originalSessionId, f.state.currentEmail), refresh_token: 'changed-local-test-token' });
    f.cookieWrites.length = 0;
    await expect(f.finish()).rejects.toThrow();
    expect(f.requests.some(request => request.path.endsWith('/token'))).toBe(false);
    expect(f.cookieWrites).toEqual([]); expect(f.state.proof).toBeNull();
  });

  it.each([
    ['user_id', 'different-user'], ['email', 'different@example.invalid'], ['session_id', newSessionId],
  ])('independently rejects a mismatched claimed %s before exchange', async (field, value) => {
    const f = await harness(); await f.start(); f.state.claimOverride = { [field]: value };
    await expect(f.finish()).rejects.toThrow();
    expect(f.requests.some(request => request.path.endsWith('/token'))).toBe(false);
    expect(f.state.proof).toBeNull();
  });

  it('lets the real SDK/Auth exchange reject a substituted stored verifier', async () => {
    const f = await harness(); await f.start(); f.state.claimOverride = { verifier: 'b'.repeat(64) };
    await expect(f.finish()).rejects.toThrow();
    expect(f.requests.filter(request => request.path.endsWith('/token'))).toHaveLength(1);
    expect(f.state.proof).toBeNull(); expect(f.cookieWrites).toEqual([]);
  });

  it.each(['email', 'user', 'method', 'old-session'])('rejects wrong exchanged %s identity without saving cookies or proof', async variant => {
    const f = await harness(); await f.start();
    if (variant === 'email') f.state.newEmail = 'changed@example.invalid';
    if (variant === 'user') f.state.newUserId = '55555555-5555-4555-8555-555555555555';
    if (variant === 'method') f.state.newMethod = 'otp';
    if (variant === 'old-session') f.state.newSessionId = originalSessionId;
    await expect(f.finish()).rejects.toThrow();
    expect(f.state.proof).toBeNull(); expect(f.cookieWrites).toEqual([]);
  });

  it('rejects an email change between exchange and verified user lookup', async () => {
    const f = await harness(); await f.start(); f.state.onExchange = () => { f.state.currentEmail = 'changed@example.invalid'; };
    await expect(f.finish()).rejects.toThrow();
    expect(f.state.proof).toBeNull(); expect(f.cookieWrites).toEqual([]);
  });

  it('fails closed on an email change at atomic completion after otherwise valid Auth checks', async () => {
    const f = await harness(); await f.start(); f.state.beforeComplete = () => { f.state.currentEmail = 'changed@example.invalid'; };
    await expect(f.finish()).rejects.toThrow();
    expect(f.state.proof).toBeNull(); expect(f.cookieWrites).toEqual([]);
  });

  it('cancels the stored verifier when the real email API reports a rate limit', async () => {
    const f = await harness(); f.state.sendStatus = 429;
    await expect(f.start()).rejects.toMatchObject({ status: 429 });
    expect([...f.challenges.values()][0]).toMatchObject({ verifier: null, cancelled: true });
    expect(f.state.proof).toBeNull(); expect(f.cookieWrites).toEqual([]);
  });
});
