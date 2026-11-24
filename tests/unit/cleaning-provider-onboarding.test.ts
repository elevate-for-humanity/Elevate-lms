import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mocks = vi.hoisted(() => ({
  admin: vi.fn(), session: vi.fn(), tenant: vi.fn(), owner: vi.fn(), rateLimit: vi.fn(), invoice: vi.fn(),
}));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: mocks.admin }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.session }));
vi.mock('@/lib/tenant/resolve-public-tenant', () => ({ resolvePublishedTenantFromRequest: mocks.tenant }));
vi.mock('@/lib/websites/can-manage-hosted-website', () => ({ canManageHostedWebsite: mocks.owner }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: mocks.rateLimit }));
vi.mock('@/lib/cleaning/billing', () => ({ cleaningInvoice: mocks.invoice }));

import { GET, POST } from '@/apps/marketing/app/api/tenant-sites/cleaning/provider/route';
import { POST as checkout } from '@/apps/marketing/app/api/tenant-sites/cleaning/jobs/route';
import { GET as offer } from '@/apps/marketing/app/api/tenant-sites/cleaning/offers/route';
import { CLEANING_SITE } from '@/lib/cleaning/server';

type Row = Record<string, any>;
const origin = 'https://www.elevateforhumanity.org';
const email = 'provider@example.invalid';
const leadId = '00000000-0000-4000-8000-000000000001';
const pending = () => ({
  id: 'provider', website_id: CLEANING_SITE, lead_id: leadId, email,
  name: 'Verified Cleaning Company', hourly_cents: 3000, zips: ['46204'],
  services: ['commercial'], opted_in: false, eligibility: 'pending',
});
let tables: Record<string, Row[]>;
let calls: Array<{ table: string; operation: string; values?: Row; filters: Array<[string, unknown]> }>;
let failures: Record<string, { code?: string; message: string }>;
let raceInsert: Row | null;
let beforeUpdate: (() => void) | null;
let user: Row | null;

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
        eq(key: string, value: unknown) { call.filters.push([key, value]); predicates.push(row => row[key] === value); return chain; },
        like(key: string, value: string) { call.filters.push([key, value]); predicates.push(row => String(row[key] || '').endsWith(value.slice(1))); return chain; },
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
          const row = { id: 'provider', eligibility: 'pending', opted_in: false, ...call.values };
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

const body = (extra: Row = {}) => ({ action: 'onboard', hourlyCents: 3500, zips: ['46204', '46201'], services: ['commercial'], optedIn: true, ...extra });
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
  tables = {
    user_websites: [{ id: CLEANING_SITE, is_published: true, site_config: { meta: { cleaningProviderOnboardingEnabled: true, cleaningNetworkEnabled: false } } }],
    tenant_site_leads: [{ id: leadId, website_id: CLEANING_SITE, email, name: 'Verified Contact', source_path: '/sites/2exclusive-platinum-cleaning/join-network', message: 'Company name, if applicable: Verified Cleaning Company\nServices: commercial' }],
    cleaning_providers: [], cleaning_jobs: [],
  };
  mocks.admin.mockResolvedValue(database());
  mocks.session.mockImplementation(async () => ({ auth: { getUser: async () => ({ data: { user } }) } }));
  mocks.tenant.mockResolvedValue({ websiteId: CLEANING_SITE });
  mocks.owner.mockResolvedValue(false);
  mocks.rateLimit.mockResolvedValue(null);
});

describe('pending cleaning provider onboarding', () => {
  it('loads the verified applicant without reading jobs and creates only a pending profile from the saved identity', async () => {
    const initial = await GET(request());
    expect(initial.status).toBe(200);
    expect(await initial.json()).toEqual({ provider: null, application: { name: 'Verified Contact' }, jobs: [], jobOffersEnabled: false });
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

  it.each([null, { id: 'unverified', email }])('rejects a missing or unverified email session before applicant reads (%j)', async identity => {
    user = identity;
    expect((await GET(request())).status).toBe(401);
    expect((await POST(request(body()))).status).toBe(401);
    expect(calls.every(call => call.table === 'user_websites')).toBe(true);
    expect(writes()).toHaveLength(0);
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
