// @vitest-environment node
import { NextRequest } from 'next/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  admin: vi.fn(), session: vi.fn(), tenant: vi.fn(), owner: vi.fn(), hosting: vi.fn(),
  authFetch: vi.fn(), complete: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.session }));
vi.mock('@/lib/tenant/resolve-public-tenant', () => ({ resolvePublishedTenantFromRequest: mocks.tenant }));
vi.mock('@/lib/websites/can-manage-hosted-website', () => ({ canManageHostedWebsite: mocks.owner }));
vi.mock('@/lib/apps/website-builder-access', () => ({ getWebsiteBuilderAccess: mocks.hosting }));
vi.mock('@/lib/supabase/public-config', () => ({ getServerPublicSupabaseConfig: () => ({ url: 'https://rate-proof.example.invalid', anonKey: 'public-test-key' }) }));
vi.mock('@/lib/supabase/timed-fetch', () => ({ timedFetch: mocks.authFetch }));
vi.mock('@/lib/cleaning/provider-email-verification', async importOriginal => ({
  ...await importOriginal<typeof import('@/lib/cleaning/provider-email-verification')>(),
  // Mailbox cryptography is exercised separately with the installed SDK. Here
  // the HTTP sequence uses the actual rate limiter's counters and expiry logic.
  completeProviderEmailVerification: mocks.complete,
}));

// Deliberately do not mock withRateLimit or rate-limit. With Redis unconfigured,
// their actual bounded fallback is the production code used by these requests.
import { applyRateLimit } from '@/lib/api/withRateLimit';
import { CLEANING_SITE } from '@/lib/cleaning/server';
import { ProviderVerificationFailure, providerVerificationCookie } from '@/lib/cleaning/provider-email-verification';
import { GET as profile, POST as save } from '@/apps/marketing/app/api/tenant-sites/cleaning/provider/route';
import { POST as send } from '@/apps/marketing/app/api/tenant-sites/cleaning/provider/verification/route';
import { GET as callback } from '@/apps/marketing/app/api/tenant-sites/cleaning/provider/verification/callback/route';

const origin = 'https://www.elevateforhumanity.org';
const profilePath = '/api/tenant-sites/cleaning/provider';
const verifyPath = `${profilePath}/verification`;
const leadId = '11111111-1111-4111-8111-111111111111';
type Row = Record<string, any>;
let counter = 0;
let visitor: string, user: Row, proof: boolean, provider: Row | null, db: Row;

function request(path = profilePath, body?: unknown, ip = visitor) {
  return new NextRequest(origin + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: {
      origin, referer: `${origin}/sites/2exclusive-platinum-cleaning/provider`,
      'x-real-ip': ip, 'content-type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv('REDIS_URL', ''); vi.stubEnv('UPSTASH_REDIS_REST_URL', ''); vi.stubEnv('UPSTASH_REDIS_REST_TOKEN', '');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-11-24T12:00:00Z'));
  counter++;
  visitor = `203.0.113.${counter}`;
  user = { id: `22222222-2222-4222-8222-${String(counter).padStart(12, '0')}`, email: `provider-${counter}@example.invalid`, email_confirmed_at: '2026-01-01T00:00:00Z' };
  proof = false; provider = null;
  const site = { id: CLEANING_SITE, user_id: 'site-owner', is_published: true, site_config: { meta: { cleaningProviderOnboardingEnabled: true, cleaningNetworkEnabled: false } } };
  db = {
    rpc: vi.fn(async (name: string) => ({
      data: name === 'cleaning_provider_proof_valid' ? proof :
        name === 'cleaning_provider_proof_begin' ? { challenge_id: 'challenge', expires_at: new Date(Date.now() + 600_000).toISOString() } : true,
      error: null,
    })),
    from(table: string) {
      let inserted: Row | undefined;
      let updated: Row | undefined;
      const result = (single = false) => {
        if (inserted) provider = { id: '33333333-3333-4333-8333-333333333333', eligibility: 'pending', ...inserted };
        if (updated && provider) Object.assign(provider, updated);
        const rows = table === 'user_websites' ? [site] : table === 'cleaning_providers' ? (provider ? [provider] : []) :
          table === 'tenant_site_leads' ? [{ id: leadId, website_id: CLEANING_SITE, name: 'Provider Contact', email: user.email, message: 'Company: Confirmed Cleaning Company', source_path: '/join-network' }] : [];
        return { data: single ? rows[0] ?? null : rows, error: null };
      };
      const query: any = {
        select: () => query, eq: () => query, in: () => query, like: () => query, order: () => query, limit: () => query,
        insert: (value: Row) => { inserted = value; return query; },
        update: (value: Row) => { updated = value; return query; },
        maybeSingle: async () => result(true),
        then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) => Promise.resolve(result()).then(resolve, reject),
      };
      return query;
    },
  };
  mocks.admin.mockResolvedValue(db);
  mocks.tenant.mockResolvedValue({ websiteId: CLEANING_SITE });
  mocks.owner.mockResolvedValue(false); mocks.hosting.mockResolvedValue({ allowed: true });
  mocks.session.mockImplementation(async () => ({ auth: {
    getUser: async () => ({ data: { user }, error: null }),
    getClaims: async () => {
      const now = Math.floor(Date.now() / 1000);
      return { data: { claims: { sub: user.id, email: user.email, session_id: 'session', role: 'authenticated', iat: now, exp: now + 3600, amr: [{ method: proof ? 'magiclink' : 'password', timestamp: now }] } }, error: null };
    },
  } }));
  mocks.authFetch.mockImplementation(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }));
  mocks.complete.mockImplementation(async () => { proof = true; });
});

afterEach(() => { vi.useRealTimers(); vi.unstubAllEnvs(); });

describe('provider flow through the actual application rate limiter', () => {
  it('allows first visit, verification send, callback, profile reload and explicit save within one minute', async () => {
    expect((await profile(request())).status).toBe(403);
    const sent = await send(request(verifyPath, {}));
    expect(sent.status).toBe(200);
    const nonce = sent.cookies.get(providerVerificationCookie().name)!.value;
    const returned = request(`${verifyPath}/callback?state=${'a'.repeat(64)}&code=valid-code`);
    returned.cookies.set(providerVerificationCookie().name, nonce);
    expect((await callback(returned)).headers.get('location')).toContain('provider_email_verification=success');
    const loaded = await profile(request());
    expect(loaded.status).toBe(200);
    const application = (await loaded.json()).applications[0];
    const saved = await save(request(profilePath, {
      action: 'onboard', applicationId: application.id, confirmedBusinessName: application.name,
      identityRevision: application.identityRevision, identityConfirmed: true,
      hourlyCents: 4000, zips: ['46201'], services: ['standard'], optedIn: true,
    }));
    expect(saved.status).toBe(201);
    expect((await saved.json()).provider).toMatchObject({ eligibility: 'pending', opted_in: true });
    expect(mocks.authFetch).toHaveBeenCalledTimes(1);
  });

  it('keeps the strict three-per-minute email budget independent from profile and callback work', async () => {
    for (let i = 0; i < 3; i++) expect((await send(request(verifyPath, {}))).status).toBe(200);
    const blocked = await send(request(verifyPath, {}));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBe('60');
    expect(blocked.headers.get('set-cookie')).toBeNull();
    expect(mocks.authFetch).toHaveBeenCalledTimes(3);
    proof = true;
    expect((await profile(request())).status).toBe(200);
    expect((await callback(request(`${verifyPath}/callback?state=invalid`))).headers.get('location')).toContain('provider_email_verification=success');
    vi.setSystemTime(Date.now() + 60_001);
    expect((await send(request(verifyPath, {}))).status).toBe(200);
  });

  it('limits repeated sends by the verified user even if the visitor address changes', async () => {
    for (let i = 0; i < 3; i++) expect((await send(request(verifyPath, {}, `198.51.100.${10 + i}`))).status).toBe(200);
    expect((await send(request(verifyPath, {}, '198.51.100.30'))).status).toBe(429);
    expect(mocks.authFetch).toHaveBeenCalledTimes(3);
  });

  it('limits repeated sends by the visitor even across different verified accounts', async () => {
    for (let i = 0; i < 4; i++) {
      user = { ...user, id: `${user.id}-${i}`, email: `other-${counter}-${i}@example.invalid` };
      expect((await send(request(verifyPath, {}))).status).toBe(i < 3 ? 200 : 429);
    }
    expect(mocks.authFetch).toHaveBeenCalledTimes(3);
  });

  it('retains a separate finite callback budget without spending the email or profile budgets', async () => {
    mocks.complete.mockRejectedValue(new ProviderVerificationFailure('expired'));
    for (let i = 0; i < 20; i++) {
      expect((await callback(request(`${verifyPath}/callback?state=invalid`))).headers.get('location')).toContain('provider_email_verification=expired');
    }
    const blocked = await callback(request(`${verifyPath}/callback?state=invalid`));
    expect(blocked.headers.get('location')).toContain('provider_email_verification=failed');
    expect(blocked.headers.get('Retry-After')).toBe('60');
    expect(blocked.headers.get('set-cookie')).toBeNull();
    expect(mocks.complete).toHaveBeenCalledTimes(20);
    expect((await send(request(verifyPath, {}))).status).toBe(200);
    proof = true;
    expect((await profile(request())).status).toBe(200);
  });

  it('retains a finite profile budget independent from ordinary contact requests', async () => {
    for (let i = 0; i < 3; i++) expect(await applyRateLimit(request('/api/inquiry', {}), 'contact')).toBeNull();
    expect((await applyRateLimit(request('/api/inquiry', {}), 'contact'))?.status).toBe(429);
    proof = true;
    for (let i = 0; i < 180; i++) expect((await profile(request())).status).toBe(200);
    const blocked = await profile(request());
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get('Retry-After')).toBe('60');
  });

  it('does not let invalid identity requests spend the verified-user mail budget', async () => {
    const confirmed = user.email_confirmed_at;
    user.email_confirmed_at = null;
    for (let i = 0; i < 3; i++) expect((await send(request(verifyPath, {}))).status).toBe(401);
    expect(mocks.authFetch).not.toHaveBeenCalled();
    user.email_confirmed_at = confirmed;
    for (let i = 0; i < 3; i++) expect((await send(request(verifyPath, {}))).status).toBe(200);
  });

  it('does not bypass provider send budgets for an internal-address visitor', async () => {
    for (let i = 0; i < 4; i++) {
      user = { ...user, id: `${user.id}-${i}`, email: `internal-${counter}-${i}@example.invalid` };
      expect((await send(request(verifyPath, {}, '10.22.33.44'))).status).toBe(i < 3 ? 200 : 429);
    }
    expect(mocks.authFetch).toHaveBeenCalledTimes(3);
  });
});
