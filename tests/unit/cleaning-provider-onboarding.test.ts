import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  admin: vi.fn(), session: vi.fn(), claims: vi.fn(), tenant: vi.fn(), owner: vi.fn(), rateLimit: vi.fn(), invoice: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.session }));
vi.mock('@/lib/tenant/resolve-public-tenant', () => ({ resolvePublishedTenantFromRequest: mocks.tenant }));
vi.mock('@/lib/websites/can-manage-hosted-website', () => ({ canManageHostedWebsite: mocks.owner }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rateLimit }));
vi.mock('@/lib/cleaning/billing', () => ({ cleaningInvoice: mocks.invoice }));
vi.mock('@/lib/cleaning/outbox', () => ({ processCleaningOutbox: vi.fn() }));

import { GET, POST } from '@/apps/marketing/app/api/tenant-sites/cleaning/provider/route';
import { POST as checkout } from '@/apps/marketing/app/api/tenant-sites/cleaning/jobs/route';
import { GET as offer } from '@/apps/marketing/app/api/tenant-sites/cleaning/offers/route';
import { GET as manageGet, POST as managePost } from '@/apps/marketing/app/api/tenant-sites/cleaning/manage/route';
import { CLEANING_SITE } from '@/lib/cleaning/server';
import { postgresTextArray, providerIdentityRevision, providerReviewRevision } from '@/lib/cleaning/provider-snapshot';

type Row = Record<string, any>;
const origin = 'https://www.elevateforhumanity.org';
const email = 'provider@example.invalid';
const leadId = '00000000-0000-4000-8000-000000000001';
const providerId = '00000000-0000-4000-8000-000000000002';
const pending = () => ({
  id: providerId, website_id: CLEANING_SITE, lead_id: leadId, email,
  name: 'Verified Cleaning Company', hourly_cents: 3000, zips: ['46204'],
  services: ['commercial'], opted_in: false, eligibility: 'pending',
  review_note: '', reviewed_by: null, reviewed_at: null,
});
let tables: Record<string, Row[]>;
let calls: Array<{ table: string; operation: string; values?: Row; filters: Array<[string, unknown]> }>;
let failures: Record<string, { code?: string; message: string }>;
let raceInsert: Row | null;
let beforeUpdate: (() => void) | null;
let user: Row | null;
let claims: Row | null;

function database() {
  return {
    from(table: string) {
      const call = { table, operation: 'select', values: undefined as Row | undefined, filters: [] as Array<[string, unknown]> };
      calls.push(call);
      let columns = '*';
      let count = Infinity;
      const predicates: Array<(row: Row) => boolean> = [];
      const chain: any = {
        select(value: string) { columns = value; return chain; },
        eq(key: string, value: unknown) { call.filters.push([key, value]); predicates.push(row => Array.isArray(row[key]) ? postgresTextArray(row[key]) === value : row[key] === value); return chain; },
        is(key: string, value: unknown) { call.filters.push([key, value]); predicates.push(row => (row[key] ?? null) === value); return chain; },
        like(key: string, value: string) { call.filters.push([key, value]); predicates.push(row => String(row[key] || '').endsWith(value.slice(1))); return chain; },
        not(key: string, _operator: string, value: string) { predicates.push(row => !String(row[key] || '').toLowerCase().includes(value.replaceAll('%', '').toLowerCase())); return chain; },
        in(key: string, values: unknown[]) { predicates.push(row => values.includes(row[key])); return chain; },
        order() { return chain; },
        limit(value: number) { count = value; return chain; },
        insert(values: Row) { call.operation = 'insert'; call.values = values; return chain; },
        update(values: Row) { call.operation = 'update'; call.values = values; return chain; },
        async maybeSingle() { return execute(true); },
        async single() { return execute(true); },
        then(resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) { return Promise.resolve(execute(false)).then(resolve, reject); },
      };
      function execute(single: boolean) {
        const failure = failures[`${table}:${call.operation}`];
        if (failure) return { data: null, error: failure };
        if (call.operation === 'update' && beforeUpdate) { beforeUpdate(); beforeUpdate = null; }
        let selected = (tables[table] || []).filter(row => predicates.every(match => match(row))).slice(0, count);
        if (call.operation === 'insert') {
          if (raceInsert) { tables[table].push(raceInsert); raceInsert = null; }
          const duplicate = tables[table].some(row => row.lead_id === call.values!.lead_id || (row.website_id === call.values!.website_id && row.email === call.values!.email));
          if (duplicate) return { data: null, error: { code: '23505' } };
          const row = { id: providerId, eligibility: 'pending', opted_in: false, review_note: '', reviewed_by: null, reviewed_at: null, ...call.values };
          tables[table].push(row);
          selected = [row];
        } else if (call.operation === 'update') {
          selected.forEach(row => Object.assign(row, call.values));
        }
        const projected = selected.map(row => columns === '*' ? { ...row } : Object.fromEntries(columns.split(',').map(key => [key, row[key]])));
        return { data: single ? projected[0] || null : projected, error: null };
      }
      return chain;
    },
  };
}

const body = (extra: Row = {}) => ({ action: 'onboard', applicationId: leadId, confirmedBusinessName: 'Verified Cleaning Company', identityRevision: providerIdentityRevision(CLEANING_SITE, leadId, email, 'Verified Cleaning Company'), identityConfirmed: true, hourlyCents: 3500, zips: ['46204', '46201'], services: ['commercial'], optedIn: true, ...extra });
const consentBody = (optedIn: boolean, extra: Row = {}) => ({ action: 'consent', applicationId: leadId, confirmedBusinessName: body().confirmedBusinessName, identityRevision: body().identityRevision, identityConfirmed: true, optedIn, ...extra });
const reviewBody = (row: Row, extra: Row = {}) => ({ action: 'review', id: row.id, eligibility: 'eligible', reviewRevision: providerReviewRevision(row), note: 'Reviewed the provider business evidence and coverage.', verified: true, ...extra });
function request(payload?: unknown, path = 'provider', requestOrigin = origin) {
  return new NextRequest(`${origin}/api/tenant-sites/cleaning/${path}`, {
    method: payload === undefined ? 'GET' : 'POST',
    headers: { Origin: requestOrigin, 'Content-Type': 'application/json' },
    ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  });
}
const writes = () => calls.filter(call => call.operation !== 'select');

beforeEach(() => {
  vi.clearAllMocks(); calls = []; failures = {}; raceInsert = null; beforeUpdate = null;
  user = { id: 'verified-user', email, email_confirmed_at: '2026-11-24T12:00:00Z' };
  const now = Math.floor(Date.now() / 1000);
  claims = { sub: user.id, email, role: 'authenticated', session_id: 'verified-session', iat: now, exp: now + 3600, amr: [{ method: 'magiclink', timestamp: now }] };
  tables = {
    user_websites: [{ id: CLEANING_SITE, is_published: true, site_config: { meta: { cleaningProviderOnboardingEnabled: true, cleaningNetworkEnabled: false } } }],
    tenant_site_leads: [{ id: leadId, website_id: CLEANING_SITE, email, name: 'Verified Contact', source_path: '/sites/2exclusive-platinum-cleaning/join-network', message: 'Company name, if applicable: Verified Cleaning Company\nServices: commercial' }],
    cleaning_providers: [], cleaning_jobs: [],
  };
  mocks.admin.mockResolvedValue(database());
  mocks.claims.mockImplementation(async () => ({ data: claims ? { claims } : null, error: null }));
  mocks.session.mockImplementation(async () => ({ auth: { getUser: async () => ({ data: { user } }), getClaims: mocks.claims } }));
  mocks.tenant.mockResolvedValue({ websiteId: CLEANING_SITE });
  mocks.owner.mockResolvedValue(false);
  mocks.rateLimit.mockResolvedValue(null);
});

describe('pending cleaning provider onboarding', () => {
  it('loads the verified applicant without reading jobs and creates only a pending profile from the saved identity', async () => {
    const initial = await GET(request());
    expect(initial.status).toBe(200);
    expect(await initial.json()).toEqual({ provider: null, applications: [{ id: leadId, contactName: 'Verified Contact', name: 'Verified Cleaning Company', createdAt: null, identityRevision: body().identityRevision }], jobs: [], jobOffersEnabled: false });
    expect(calls.some(call => call.table === 'cleaning_jobs')).toBe(false);
    const result = await POST(request(body()));
    expect(result.status).toBe(201);
    expect((await result.json()).provider.eligibility).toBe('pending');
    expect(tables.cleaning_providers).toHaveLength(1);
    expect(tables.cleaning_providers[0]).toMatchObject({ email, lead_id: leadId, name: 'Verified Cleaning Company', hourly_cents: 3500, opted_in: true, eligibility: 'pending' });
    expect(writes()[0].values).not.toHaveProperty('eligibility');
    expect(writes()[0].values).not.toHaveProperty('reviewed_by');
    expect(mocks.invoice).not.toHaveBeenCalled();
  });

  it.each([null, { id: 'email-missing' }])('rejects a missing account or email before applicant reads (%j)', async identity => {
    user = identity;
    expect((await GET(request())).status).toBe(401);
    expect((await POST(request(body()))).status).toBe(401);
    expect(calls.every(call => call.table === 'user_websites')).toBe(true);
    expect(writes()).toHaveLength(0);
  });

  it('denies an unconfirmed current Auth user even when an older signed magic-link session exists', async () => {
    user!.email_confirmed_at = null;
    tables.cleaning_providers.push({ ...pending(), eligibility: 'eligible' });
    for (const payload of [undefined, body(), { hourlyCents: 4000 }]) {
      const response = payload === undefined ? await GET(request()) : await POST(request(payload));
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: 'Sign in with a verified account email to continue.' });
    }
    expect(calls.every(call => call.table === 'user_websites')).toBe(true);
    expect(writes()).toHaveLength(0);
    expect(tables.cleaning_providers[0].hourly_cents).toBe(3000);
  });

  it.each([
    ['automatically confirmed password session', { amr: [{ method: 'password', timestamp: 1 }] }],
    ['generic OTP, including SMS', { amr: [{ method: 'otp', timestamp: 1 }] }],
    ['automatic email signup', { amr: [{ method: 'email/signup', timestamp: 1 }] }],
    ['editable metadata claiming email verification', { amr: [], user_metadata: { email_verified: true, amr: [{ method: 'magiclink', timestamp: 1 }] } }],
    ['missing methods', { amr: undefined }],
    ['method without authenticated timestamp', { amr: ['magiclink'] }],
    ['another subject', { sub: 'another-user' }],
    ['another email', { email: 'other@example.invalid' }],
    ['missing email', { email: undefined }],
    ['missing session', { session_id: '' }],
    ['anonymous session', { is_anonymous: true }],
    ['service token', { role: 'service_role' }],
    ['expired proof', { exp: 1 }],
    ['future magic link', { amr: [{ method: 'magiclink', timestamp: Number.MAX_SAFE_INTEGER }] }],
  ])('denies %s before reading any application, provider or assignment', async (_reason, changes) => {
    claims = { ...claims, ...changes };
    tables.cleaning_providers.push({ ...pending(), eligibility: 'eligible' });
    for (const payload of [undefined, body(), { hourlyCents: 4000 }]) {
      const response = payload === undefined ? await GET(request()) : await POST(request(payload));
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual({
        error: 'Open a secure email sign-in link to access your cleaning provider profile.',
        code: 'provider_email_verification_required',
      });
    }
    expect(calls.every(call => call.table === 'user_websites')).toBe(true);
    expect(writes()).toHaveLength(0);
    expect(tables.cleaning_providers[0].hourly_cents).toBe(3000);
  });

  it.each(['missing', 'error', 'throws'])('fails closed when signature-verified claims are %s', async failure => {
    if (failure === 'missing') claims = null;
    if (failure === 'error') mocks.claims.mockResolvedValue({ data: { claims }, error: new Error('Invalid JWT signature') });
    if (failure === 'throws') mocks.claims.mockRejectedValue(new Error('Auth unavailable'));
    expect((await GET(request())).status).toBe(403);
    expect((await POST(request(body()))).status).toBe(403);
    expect(calls.every(call => call.table === 'user_websites')).toBe(true);
    expect(writes()).toHaveLength(0);
  });

  it('uses a verified email magic-link session even for an historically auto-confirmed account', async () => {
    user!.email_confirmed_at = '2020-01-01T00:00:00Z';
    user!.user_metadata = { role: 'admin', email_verified: false };
    claims!.email = email.toUpperCase();
    expect((await GET(request())).status).toBe(200);
    expect((await POST(request(body()))).status).toBe(201);
    expect(mocks.claims).toHaveBeenCalledTimes(2);
    expect(tables.cleaning_providers[0].eligibility).toBe('pending');
  });

  it('requires same-origin submission before any database work', async () => {
    expect((await POST(request(body(), 'provider', 'https://attacker.invalid'))).status).toBe(403);
    expect(mocks.admin).not.toHaveBeenCalled();
  });

  it.each(['tenant', 'unpublished', 'disabled'])('fails closed for %s provider enrollment', async reason => {
    if (reason === 'tenant') mocks.tenant.mockResolvedValue({ websiteId: 'other-site' });
    if (reason === 'unpublished') tables.user_websites[0].is_published = false;
    if (reason === 'disabled') tables.user_websites[0].site_config.meta.cleaningProviderOnboardingEnabled = false;
    expect((await GET(request())).status).toBe(503);
    expect((await POST(request(body()))).status).toBe(503);
    expect(writes()).toHaveLength(0);
  });

  it.each(['email', 'website_id', 'source_path'])('does not adopt a lead with mismatched %s', async key => {
    tables.tenant_site_leads[0][key] = key === 'source_path' ? '/contact' : 'someone-else';
    expect((await POST(request(body()))).status).toBe(409);
    expect(writes()).toHaveLength(0);
  });

  it.each([{ email: 'someone-else@example.invalid' }, { leadId: 'other' }, { name: 'Spoofed Company' }, { eligibility: 'eligible' }, { optedIn: undefined }])('rejects client-owned identity, approval or missing consent fields (%j)', async extra => {
    expect((await POST(request(body(extra)))).status).toBe(400);
    expect(writes()).toHaveLength(0);
  });

  it('records an explicit decline of job emails without treating profile submission as consent', async () => {
    expect((await POST(request(body({ optedIn: false })))).status).toBe(201);
    expect(tables.cleaning_providers[0].opted_in).toBe(false);
    expect(tables.cleaning_providers[0].eligibility).toBe('pending');
  });

  it.each(['cleaning_providers:select', 'tenant_site_leads:select', 'cleaning_providers:insert'])('reports %s database failure without a false success', async operation => {
    failures[operation] = { message: 'database unavailable' };
    expect((await POST(request(body()))).status).toBe(503);
    expect(tables.cleaning_providers).toHaveLength(0);
  });

  it('repeated saves update one pending profile, never create duplicate providers', async () => {
    expect((await POST(request(body()))).status).toBe(201);
    expect((await POST(request(body({ hourlyCents: 3800 })))).status).toBe(200);
    expect(tables.cleaning_providers).toHaveLength(1);
    expect(tables.cleaning_providers[0]).toMatchObject({ hourly_cents: 3800, eligibility: 'pending' });
    expect(writes()[1].filters).toContainEqual(['eligibility', 'pending']);
  });

  it('resolves a concurrent insert through the database uniqueness guard without modifying the winner', async () => {
    raceInsert = pending();
    const result = await POST(request(body()));
    expect(result.status).toBe(200);
    expect((await result.json()).alreadySubmitted).toBe(true);
    expect(tables.cleaning_providers).toHaveLength(1);
    expect(tables.cleaning_providers[0].hourly_cents).toBe(3000);
    expect(writes().filter(call => call.operation === 'update')).toHaveLength(0);
  });

  it('does not change reviewed coverage if an administrator approves during a pending profile save', async () => {
    tables.cleaning_providers.push(pending());
    beforeUpdate = () => { tables.cleaning_providers[0].eligibility = 'eligible'; };
    expect((await POST(request(body()))).status).toBe(409);
    expect(tables.cleaning_providers[0]).toMatchObject({ eligibility: 'eligible', hourly_cents: 3000, zips: ['46204'], opted_in: false });
  });

  it.each(['eligible', 'suspended'])('preserves %s eligibility while allowing the existing narrow hourly-rate update', async eligibility => {
    tables.cleaning_providers.push({ ...pending(), eligibility, reviewed_by: 'owner', reviewed_at: '2026-11-24', review_note: 'Evidence reviewed' });
    expect((await POST(request(body()))).status).toBe(409);
    expect((await POST(request({ hourlyCents: 4000 }))).status).toBe(200);
    expect(tables.cleaning_providers[0]).toMatchObject({ eligibility, reviewed_by: 'owner', hourly_cents: 4000, zips: ['46204'], opted_in: false });
    expect(writes().at(-1)?.values).toEqual({ hourly_cents: 4000 });
  });

  it('does not let onboarding enable customer checkout or private job offers', async () => {
    expect((await GET(request())).status).toBe(200);
    expect((await checkout(request({ action: 'checkout', id: leadId }, 'jobs'))).status).toBe(503);
    expect((await offer(request(undefined, `offers?id=${leadId}`))).status).toBe(503);
    expect(mocks.invoice).not.toHaveBeenCalled();
    expect(writes()).toHaveLength(0);
  });

  it('preserves provider access for an already enabled commerce site', async () => {
    tables.user_websites[0].site_config.meta = { cleaningNetworkEnabled: true };
    expect((await GET(request())).status).toBe(200);
  });
});

describe('explicit provider identity and applicant-controlled consent', () => {
  it('pins the chosen application even if a newer public submission uses the same mailbox', async () => {
    const forged = { ...tables.tenant_site_leads[0], id: '00000000-0000-4000-8000-000000000003', name: 'Other Contact', message: 'Company name, if applicable: Other Company', created_at: '2026-11-24T18:00:00Z' };
    tables.tenant_site_leads.unshift(forged);
    const loaded = await (await GET(request())).json();
    expect(loaded.applications.map((application: Row) => application.id)).toEqual([forged.id, leadId]);
    expect(loaded.provider).toBeNull();
    expect((await POST(request(body()))).status).toBe(201);
    expect(tables.cleaning_providers[0]).toMatchObject({ lead_id: leadId, name: 'Verified Cleaning Company' });
    const existing = await (await GET(request())).json();
    expect(existing.applications).toEqual([]);
    expect(existing.provider).toMatchObject({ lead_id: leadId, name: 'Verified Cleaning Company', identityRevision: body().identityRevision });
  });

  it.each([
    [{ applicationId: undefined }, 400],
    [{ identityConfirmed: undefined }, 400],
    [{ identityConfirmed: false }, 400],
    [{ applicationId: '00000000-0000-4000-8000-000000000099' }, 409],
    [{ confirmedBusinessName: 'A substituted business' }, 409],
    [{ identityRevision: 'f'.repeat(64) }, 409],
  ])('requires the selected identity and explicit confirmation (%j)', async (extra, status) => {
    expect((await POST(request(body(extra)))).status).toBe(status);
    expect(writes()).toHaveLength(0);
  });

  it('refuses a changed selected application rather than silently adopting its new name', async () => {
    await GET(request());
    tables.tenant_site_leads[0].message = 'Company name, if applicable: Changed Company';
    expect((await POST(request(body()))).status).toBe(409);
    expect(writes()).toHaveLength(0);
  });

  it.each(['lead_id', 'name'])('does not silently bind a different concurrent provider %s', async field => {
    raceInsert = { ...pending(), [field]: field === 'lead_id' ? '00000000-0000-4000-8000-000000000003' : 'Other Company' };
    const result = await POST(request(body()));
    expect(result.status).toBe(409);
    expect(await result.json()).not.toHaveProperty('provider');
    expect(tables.cleaning_providers).toHaveLength(1);
    expect(writes().filter(call => call.operation === 'update')).toHaveLength(0);
  });

  it('requires confirmation before a pending owner-imported profile can give consent', async () => {
    tables.cleaning_providers.push(pending());
    expect((await POST(request(body({ identityConfirmed: false })))).status).toBe(400);
    expect((await POST(request(consentBody(true)))).status).toBe(409);
    expect(tables.cleaning_providers[0].opted_in).toBe(false);
    expect((await POST(request(body()))).status).toBe(200);
    expect(tables.cleaning_providers[0]).toMatchObject({ eligibility: 'pending', opted_in: true });
  });

  it('confirms a legacy imported name exactly without stranding trailing whitespace', async () => {
    const name = 'Verified Cleaning Company \r';
    tables.cleaning_providers.push({ ...pending(), name });
    const response = await POST(request(body({ confirmedBusinessName: name, identityRevision: providerIdentityRevision(CLEANING_SITE, leadId, email, name) })));
    expect(response.status).toBe(200);
    expect(tables.cleaning_providers[0]).toMatchObject({ name, opted_in: true });
  });

  it.each(['eligible', 'suspended'])('lets the verified %s provider withdraw consent without changing reviewed coverage or status', async eligibility => {
    tables.cleaning_providers.push({ ...pending(), eligibility, opted_in: true, review_note: 'Reviewed evidence', reviewed_by: 'owner', reviewed_at: '2026-11-24T12:00:00Z' });
    expect((await POST(request(consentBody(false)))).status).toBe(200);
    expect(writes().at(-1)?.values).toEqual({ opted_in: false });
    expect(tables.cleaning_providers[0]).toMatchObject({ eligibility, opted_in: false, hourly_cents: 3000, zips: ['46204'], review_note: 'Reviewed evidence', reviewed_by: 'owner' });
  });

  it('does not let suspension of an imported profile bypass the applicant identity confirmation', async () => {
    tables.cleaning_providers.push({ ...pending(), eligibility: 'suspended' });
    expect((await POST(request(consentBody(true, { identityConfirmed: false })))).status).toBe(400);
    expect((await POST(request(consentBody(true, { confirmedBusinessName: 'Other Company' })))).status).toBe(409);
    expect(tables.cleaning_providers[0].opted_in).toBe(false);
    expect(writes()).toHaveLength(0);
  });
});

describe('owner review compares the displayed provider snapshot atomically', () => {
  beforeEach(() => { mocks.owner.mockResolvedValue(true); });

  it('returns the full displayed review revision and approves without writing applicant consent', async () => {
    const row = { ...pending(), opted_in: true };
    tables.cleaning_providers.push(row);
    const loaded = await (await manageGet(request(undefined, 'manage'))).json();
    expect(loaded.providers[0].reviewRevision).toBe(providerReviewRevision(row));
    const response = await managePost(request(reviewBody(row), 'manage'));
    expect(response.status).toBe(200);
    expect(row).toMatchObject({ eligibility: 'eligible', opted_in: true, reviewed_by: user!.id });
    const update = writes().at(-1)!;
    expect(update.values).not.toHaveProperty('opted_in');
    expect(update.filters).toEqual(expect.arrayContaining([
      ['website_id', CLEANING_SITE], ['id', providerId], ['lead_id', leadId],
      ['opted_in', true], ['eligibility', 'pending'], ['zips', '{"46204"}'],
      ['services', '{"commercial"}'], ['reviewed_at', null], ['reviewed_by', null],
    ]));
  });

  it('rejects old review clients that try to supply consent or omit the displayed revision', async () => {
    const row = { ...pending(), opted_in: true };
    tables.cleaning_providers.push(row);
    expect((await managePost(request(reviewBody(row, { optedIn: true }), 'manage'))).status).toBe(400);
    expect((await managePost(request(reviewBody(row, { reviewRevision: undefined }), 'manage'))).status).toBe(400);
    expect(writes()).toHaveLength(0);
  });

  it('does not approve a pending imported applicant who has not given consent', async () => {
    const row = pending();
    tables.cleaning_providers.push(row);
    expect((await managePost(request(reviewBody(row), 'manage'))).status).toBe(409);
    expect(writes()).toHaveLength(0);
    expect(row).toMatchObject({ eligibility: 'pending', opted_in: false });
  });

  it('rejects a stale displayed snapshot after the applicant saves new coverage and withdraws consent', async () => {
    const row = { ...pending(), opted_in: true };
    tables.cleaning_providers.push(row);
    const oldReview = reviewBody(row);
    expect((await POST(request(body({ optedIn: false })))).status).toBe(200);
    expect((await managePost(request(oldReview, 'manage'))).status).toBe(409);
    expect(row).toMatchObject({ eligibility: 'pending', opted_in: false, hourly_cents: 3500, zips: ['46204', '46201'] });
    expect(writes()).toHaveLength(1);
  });

  it.each([
    ['id', '00000000-0000-4000-8000-000000000099'],
    ['lead_id', '00000000-0000-4000-8000-000000000099'],
    ['name', 'Changed business'], ['email', 'changed@example.invalid'],
    ['hourly_cents', 3900], ['zips', ['46201']], ['services', ['deep']],
    ['opted_in', false], ['eligibility', 'suspended'], ['review_note', 'Concurrent new review'],
    ['reviewed_by', 'other-owner'], ['reviewed_at', '2026-11-24T18:01:00Z'],
  ])('rejects a %s change between the review read and UPDATE', async (field, value) => {
    const row: Row = { ...pending(), opted_in: true };
    tables.cleaning_providers.push(row);
    const input = reviewBody(row);
    beforeUpdate = () => { row[field as string] = value; };
    const result = await managePost(request(input, 'manage'));
    expect(result.status).toBe(409);
    expect(await result.json()).not.toHaveProperty('reviewed');
    expect(row[field as string]).toEqual(value);
    expect(row.review_note).toBe(field === 'review_note' ? value : '');
  });

  it('preserves an owner review that wins the race and lets the applicant withdraw through the consent action', async () => {
    const row = { ...pending(), opted_in: true };
    tables.cleaning_providers.push(row);
    expect((await managePost(request(reviewBody(row), 'manage'))).status).toBe(200);
    expect((await POST(request(body({ optedIn: false })))).status).toBe(409);
    expect(row).toMatchObject({ eligibility: 'eligible', hourly_cents: 3000, zips: ['46204'], opted_in: true });
    expect((await POST(request(consentBody(false)))).status).toBe(200);
    expect(row).toMatchObject({ eligibility: 'eligible', opted_in: false });
  });

  it('rejects a competing same-state suspension review instead of overwriting its evidence', async () => {
    const row = { ...pending(), eligibility: 'suspended', opted_in: false, review_note: 'Earlier hold evidence', reviewed_by: 'owner', reviewed_at: '2026-11-24T12:00:00Z' };
    tables.cleaning_providers.push(row);
    const oldReview = reviewBody(row, { eligibility: 'suspended' });
    beforeUpdate = () => { row.review_note = 'Other reviewer new evidence'; row.reviewed_at = '2026-11-24T18:00:00Z'; };
    expect((await managePost(request(oldReview, 'manage'))).status).toBe(409);
    expect(row).toMatchObject({ eligibility: 'suspended', opted_in: false, review_note: 'Other reviewer new evidence' });
  });

  it('imports normalized identity as pending and opted out until the applicant confirms and consents', async () => {
    tables.tenant_site_leads[0].message = 'Company name, if applicable: Verified Cleaning Company  \r\nServices: commercial';
    const imported = await managePost(request({ action: 'import', leadId, hourlyCents: 3000, zips: ['46204'], services: ['commercial'] }, 'manage'));
    expect(imported.status).toBe(200);
    const row = tables.cleaning_providers[0];
    expect(row).toMatchObject({ name: 'Verified Cleaning Company', eligibility: 'pending', opted_in: false });
    const oldReview = reviewBody(row);
    expect((await POST(request(body()))).status).toBe(200);
    expect((await managePost(request(oldReview, 'manage'))).status).toBe(409);
    expect((await managePost(request(reviewBody(row), 'manage'))).status).toBe(200);
    expect(row).toMatchObject({ eligibility: 'eligible', opted_in: true });
  });

  it('rejects an import with no usable business or contact name', async () => {
    tables.tenant_site_leads[0].name = '  ';
    tables.tenant_site_leads[0].message = 'Company name, if applicable: \r\n';
    expect((await managePost(request({ action: 'import', leadId, hourlyCents: 3000, zips: ['46204'], services: ['commercial'] }, 'manage'))).status).toBe(409);
    expect(writes()).toHaveLength(0);
  });

  it.each(['select', 'update'])('reports a review %s failure without marking it saved', async operation => {
    const row = { ...pending(), opted_in: true };
    tables.cleaning_providers.push(row);
    failures['cleaning_providers:' + operation] = { message: 'database unavailable' };
    expect((await managePost(request(reviewBody(row), 'manage'))).status).toBe(503);
    expect(row.eligibility).toBe('pending');
  });

  it('requires the site owner and same-site provider even with a correct revision', async () => {
    const row = { ...pending(), opted_in: true };
    tables.cleaning_providers.push(row);
    mocks.owner.mockResolvedValue(false);
    expect((await managePost(request(reviewBody(row), 'manage'))).status).toBe(403);
    mocks.owner.mockResolvedValue(true);
    row.website_id = 'another-site';
    expect((await managePost(request(reviewBody(row), 'manage'))).status).toBe(404);
    expect(writes()).toHaveLength(0);
  });
});
