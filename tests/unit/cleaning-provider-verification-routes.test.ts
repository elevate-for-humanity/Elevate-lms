// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  admin: vi.fn(), session: vi.fn(), tenant: vi.fn(), owner: vi.fn(), rateLimit: vi.fn(),
  hosting: vi.fn(), authFetch: vi.fn(), complete: vi.fn(), rpc: vi.fn(), claims: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.session }));
vi.mock('@/lib/tenant/resolve-public-tenant', () => ({ resolvePublishedTenantFromRequest: mocks.tenant }));
vi.mock('@/lib/websites/can-manage-hosted-website', () => ({ canManageHostedWebsite: mocks.owner }));
vi.mock('@/lib/apps/website-builder-access', () => ({ getWebsiteBuilderAccess: mocks.hosting }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rateLimit }));
vi.mock('@/lib/supabase/public-config', () => ({ getServerPublicSupabaseConfig: () => ({ url: 'https://route-proof.example.invalid', anonKey: 'public-test-key' }) }));
vi.mock('@/lib/supabase/timed-fetch', () => ({ timedFetch: mocks.authFetch }));
vi.mock('@/lib/cleaning/provider-email-verification', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/cleaning/provider-email-verification')>(),
  completeProviderEmailVerification: mocks.complete,
}));

import { CLEANING_SITE } from '@/lib/cleaning/server';
import { ProviderVerificationFailure, providerVerificationCookie } from '@/lib/cleaning/provider-email-verification';
import { POST } from '@/apps/marketing/app/api/tenant-sites/cleaning/provider/verification/route';
import { GET } from '@/apps/marketing/app/api/tenant-sites/cleaning/provider/verification/callback/route';

const origin = 'https://www.elevateforhumanity.org';
const path = '/api/tenant-sites/cleaning/provider/verification';
const email = 'provider@example.invalid';
const userId = '11111111-1111-4111-8111-111111111111';
const sessionId = '22222222-2222-4222-8222-222222222222';
const nonce = 'b'.repeat(64), state = 'a'.repeat(64), code = '12345678-abcd-4abc-8def-123456789000';
type Row = Record<string, any>;
let site: Row, user: Row | null, db: Row, tablesRead: string[], signedClaims: Row;

function request(body: unknown = {}, requestOrigin = origin, host = origin) {
  return new NextRequest(host + path, { method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/json' }, body: JSON.stringify(body) });
}
function callback(query = `state=${state}&code=${code}`, browserNonce: string | null = nonce, host = origin) {
  return new NextRequest(`${host}${path}/callback?${query}`, {
    headers: browserNonce === null ? {} : { cookie: `${providerVerificationCookie().name}=${browserNonce}` },
  });
}

beforeEach(() => {
  vi.clearAllMocks(); tablesRead = [];
  site = { id: CLEANING_SITE, user_id: 'website-owner', is_published: true, site_config: { meta: { cleaningProviderOnboardingEnabled: true, cleaningNetworkEnabled: false } } };
  user = { id: userId, email, email_confirmed_at: '2026-01-01T00:00:00Z', is_anonymous: false };
  const now = Math.floor(Date.now() / 1000);
  signedClaims = { sub: userId, email, session_id: sessionId, role: 'authenticated', iat: now, exp: now + 3600, amr: [{ method: 'password', timestamp: now }] };
  mocks.claims.mockImplementation(async () => ({ data: { claims: signedClaims }, error: null }));
  mocks.session.mockImplementation(async () => ({ auth: { getUser: async () => ({ data: { user }, error: null }), getClaims: mocks.claims } }));
  db = {
    rpc: mocks.rpc,
    from(table: string) {
      tablesRead.push(table);
      const query: any = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: site, error: null }) };
      return query;
    },
  };
  mocks.admin.mockResolvedValue(db);
  mocks.tenant.mockResolvedValue({ websiteId: CLEANING_SITE });
  mocks.owner.mockResolvedValue(false);
  mocks.rateLimit.mockResolvedValue(null);
  mocks.hosting.mockResolvedValue({ allowed: true });
  mocks.rpc.mockImplementation(async name => ({ data: name === 'cleaning_provider_proof_begin' ? { challenge_id: 'challenge', expires_at: new Date(Date.now() + 600_000).toISOString() } : true, error: null }));
  mocks.authFetch.mockResolvedValue(new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
  mocks.complete.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());

describe('provider verification email request boundary', () => {
  it('uses the current signed identity, returns only a send receipt, and keeps the SDK verifier out of browser cookies', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ sent: true });
    const [, body] = mocks.authFetch.mock.calls[0];
    expect(JSON.parse(body.body)).toMatchObject({ email, create_user: false, code_challenge_method: 's256' });
    const begin = mocks.rpc.mock.calls.find(call => call[0] === 'cleaning_provider_proof_begin')![1];
    expect(begin).toMatchObject({ p_website_id: CLEANING_SITE, p_user_id: userId, p_session_id: sessionId, p_email: email });
    const cookie = response.cookies.get('__Host-efh-cleaning-provider-verification')!;
    expect(cookie.value).toMatch(/^[a-f0-9]{64}$/);
    expect(cookie.value).not.toBe(begin.p_verifier);
    const header = response.headers.get('set-cookie')!;
    expect(header).toContain('HttpOnly'); expect(header).toContain('Secure'); expect(header).toContain('SameSite=lax');
    expect(header).toContain('Path=/'); expect(header).toContain('Max-Age=600'); expect(header).not.toContain('Domain=');
    expect(header).not.toContain(begin.p_verifier);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(tablesRead).toEqual(['user_websites']);
    expect(mocks.owner).not.toHaveBeenCalled();
  });

  it.each([{ email: 'victim@example.invalid' }, { user_id: 'victim' }, { redirect: 'https://attacker.invalid' }, { verifier: 'chosen' }, { website_id: 'other-site' }])('rejects caller authority fields %j before Auth or database work', async body => {
    expect((await POST(request(body))).status).toBe(400);
    expect(tablesRead).toEqual([]); expect(mocks.authFetch).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('rejects cross-origin and noncanonical-host requests', async () => {
    expect((await POST(request({}, 'https://attacker.invalid'))).status).toBe(403);
    expect((await POST(request({}, 'https://attacker.invalid', 'https://attacker.invalid'))).status).toBe(403);
    expect(tablesRead).toEqual([]); expect(mocks.authFetch).not.toHaveBeenCalled();
  });

  it.each(['unpublished', 'disabled', 'wrong-tenant'])('requires published tenant onboarding readiness (%s)', async kind => {
    if (kind === 'unpublished') site.is_published = false;
    if (kind === 'disabled') site.site_config.meta.cleaningProviderOnboardingEnabled = false;
    if (kind === 'wrong-tenant') mocks.tenant.mockResolvedValue({ websiteId: 'another-site' });
    expect((await POST(request())).status).toBe(503);
    expect(mocks.authFetch).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each(['missing', 'unconfirmed', 'anonymous', 'claims-email'])('denies invalid current identity before dispatch (%s)', async kind => {
    if (kind === 'missing') user = null;
    if (kind === 'unconfirmed') user!.email_confirmed_at = null;
    if (kind === 'anonymous') user!.is_anonymous = true;
    if (kind === 'claims-email') signedClaims.email = 'changed@example.invalid';
    expect([401, 403]).toContain((await POST(request())).status);
    expect(mocks.authFetch).not.toHaveBeenCalled(); expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it('does not dispatch email or issue the browser nonce when server challenge storage fails', async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: 'storage unavailable' } });
    const response = await POST(request());
    expect(response.status).toBe(503); expect(response.headers.get('set-cookie')).toBeNull();
    expect(mocks.authFetch).not.toHaveBeenCalled();
    expect(await response.text()).not.toContain('storage unavailable');
  });

  it('preserves a safe mail rate-limit error and cancels its verifier without setting the nonce', async () => {
    mocks.authFetch.mockResolvedValue(new Response(JSON.stringify({ code: 'over_email_send_rate_limit', msg: 'sensitive upstream detail' }), { status: 429, headers: { 'content-type': 'application/json' } }));
    const response = await POST(request());
    expect(response.status).toBe(429); expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.json()).toEqual({ error: 'Please wait before requesting another verification email.' });
    expect(mocks.rpc).toHaveBeenCalledWith('cleaning_provider_proof_cancel', expect.objectContaining({ p_website_id: CLEANING_SITE, p_user_id: userId }));
  });
});

describe('fixed provider verification callback boundary', () => {
  it('accepts a same-browser Auth callback without an Origin/Referer and never requires applicant ownership', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const response = await GET(callback(`state=${state}&code=${code}&redirect=https://attacker.invalid&email=victim@example.invalid`));
    expect(response.status).toBe(303);
    expect(response.headers.get('location')).toBe(`${origin}/sites/2exclusive-platinum-cleaning/provider?provider_email_verification=success`);
    expect(mocks.complete).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ db, state, code, browserNonce: nonce }));
    expect(mocks.hosting).toHaveBeenCalledExactlyOnceWith('website-owner', db);
    expect(mocks.owner).not.toHaveBeenCalled();
    expect(tablesRead).toEqual(['user_websites']);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('referrer-policy')).toBe('no-referrer');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it.each(['expired', 'wrong_browser', 'failed'] as const)('preserves the pending nonce when %s occurs before a matching claim', async marker => {
    mocks.complete.mockRejectedValue(new ProviderVerificationFailure(marker));
    const response = await GET(callback());
    expect(new URL(response.headers.get('location')!).searchParams.get('provider_email_verification')).toBe(marker);
    expect(response.headers.get('set-cookie')).toBeNull();
    expect(await response.text()).not.toContain(nonce);
  });

  it.each(['expired', 'failed'] as const)('clears the spent nonce after a matching claim even when completion is %s', async marker => {
    mocks.complete.mockRejectedValue(new ProviderVerificationFailure(marker, true));
    const response = await GET(callback());
    expect(new URL(response.headers.get('location')!).searchParams.get('provider_email_verification')).toBe(marker);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('does not expose arbitrary Auth/database failures in a redirect', async () => {
    mocks.complete.mockRejectedValue(new Error('SECRET_PKCE_TOKEN_AND_EMAIL'));
    const response = await GET(callback());
    expect(response.headers.get('location')).toBe(`${origin}/sites/2exclusive-platinum-cleaning/provider?provider_email_verification=failed`);
    expect([...response.headers].join()).not.toContain('SECRET_PKCE');
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it.each(['state', 'code'])('rejects duplicate %s query values instead of choosing one', async field => {
    mocks.complete.mockRejectedValue(new ProviderVerificationFailure('expired'));
    const response = await GET(callback(`state=${state}&code=${code}&${field}=different`));
    expect(mocks.complete.mock.calls[0][0][field]).toBeNull();
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it.each(['unpublished', 'disabled', 'hosting-unavailable', 'wrong-host'])('rechecks fixed site availability before proof completion (%s)', async kind => {
    if (kind === 'unpublished') site.is_published = false;
    if (kind === 'disabled') site.site_config.meta.cleaningProviderOnboardingEnabled = false;
    if (kind === 'hosting-unavailable') mocks.hosting.mockResolvedValue({ allowed: false });
    const response = await GET(callback(undefined, nonce, kind === 'wrong-host' ? 'https://attacker.invalid' : origin));
    expect(new URL(response.headers.get('location')!).searchParams.get('provider_email_verification')).toBe('failed');
    expect(mocks.complete).not.toHaveBeenCalled();
    expect(response.headers.get('set-cookie')).toBeNull();
  });
});
