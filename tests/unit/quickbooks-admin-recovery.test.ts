// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  rows: [] as { key: string; value: string }[],
  settingsError: null as null | { message: string },
  upsert: vi.fn(),
  rpc: vi.fn(),
}));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/admin/guards', () => ({
  apiRequireAdmin: vi.fn().mockResolvedValue({ user: { id: 'operator' } }),
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    rpc: state.rpc,
    from: () => ({
      select: () => ({ in: async () => ({ data: state.rows, error: state.settingsError }) }),
      upsert: state.upsert,
    }),
  }),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
import { verifyQuickBooksOAuthState } from '@/lib/integrations/quickbooks-oauth-state';
import { GET, POST } from '../../apps/admin/app/api/admin/integrations/quickbooks/route';

const statusRequest = () =>
  new NextRequest('https://admin.elevateforhumanity.org/api/admin/integrations/quickbooks');
const response = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
beforeEach(() => {
  vi.stubEnv('QB_ENVIRONMENT', 'production');
  vi.stubGlobal('fetch', vi.fn());
  state.rows = [
    'QB_CLIENT_ID',
    'QB_CLIENT_SECRET',
    'QB_ACCESS_TOKEN',
    'QB_REFRESH_TOKEN',
    'QB_REALM_ID',
  ].map((key) => ({ key, value: 'fixture-' + key }));
  state.settingsError = null;
  state.upsert.mockReset().mockResolvedValue({ error: null });
  state.rpc.mockReset().mockResolvedValue({ data: true, error: null });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Admin QuickBooks recovery through the production client', () => {
  it('recovers a missing access token using the saved refresh token', async () => {
    state.rows = state.rows.filter((row) => row.key !== 'QB_ACCESS_TOKEN');
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({ access_token: 'fresh', refresh_token: 'rotated' }))
      .mockResolvedValueOnce(response({ CompanyInfo: { CompanyName: 'Verified company' } }));
    expect(await (await GET(statusRequest())).json()).toMatchObject({
      connected: true,
      company_name: 'Verified company',
    });
    expect(state.rpc).toHaveBeenCalledExactlyOnceWith('rotate_quickbooks_authorization', {
      p_expected_refresh: 'fixture-QB_REFRESH_TOKEN', p_realm: 'fixture-QB_REALM_ID',
      p_access: 'fresh', p_refresh: 'rotated',
    });
    expect(state.upsert).not.toHaveBeenCalled();
  });
  it('does not report connection success when rotated tokens cannot be saved', async () => {
    state.rpc.mockResolvedValue({ data: null, error: { message: 'storage failed' } });
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response({ access_token: 'fresh', refresh_token: 'rotated' }))
      .mockResolvedValueOnce(response({ CompanyInfo: { CompanyName: 'Must not be reported' } }));
    expect(await (await GET(statusRequest())).json()).toMatchObject({
      connected: false,
      reason: 'token_persistence_failed',
    });
    expect(fetch).toHaveBeenCalledTimes(2);
  });
  it('keeps provider outages distinct from expired authorization', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({}, 503));
    expect(await (await GET(statusRequest())).json()).toMatchObject({
      connected: false,
      reason: 'provider_request_failed',
    });
    expect(fetch).toHaveBeenCalledOnce();
    expect(state.upsert).not.toHaveBeenCalled();
    expect(state.rpc).not.toHaveBeenCalled();
  });
  it('surfaces settings read failures without using stale deployment tokens', async () => {
    state.settingsError = { message: 'private database details' };
    vi.mocked(fetch).mockResolvedValue(response({ CompanyInfo: { CompanyName: 'Stale' } }));
    expect(await (await GET(statusRequest())).json()).toMatchObject({
      connected: false,
      reason: 'settings_lookup_failed',
    });
    expect(fetch).not.toHaveBeenCalled();
  });
  it('refreshes expired authorization during expense reads as well as health checks', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(response({}, 401))
      .mockResolvedValueOnce(response({ access_token: 'fresh', refresh_token: 'rotated' }))
      .mockResolvedValueOnce(response({ QueryResponse: { Purchase: [{ Id: '1' }] } }));
    const result = await POST(
      new NextRequest(statusRequest().url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'sync_expenses' }),
      }),
    );
    expect(result.status).toBe(200);
    expect(await result.json()).toMatchObject({ ok: true, synced: 1 });
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});

it('creates fresh uncached authorization at the moment Connect is followed', async () => {
  vi.stubEnv('QB_CLIENT_ID', 'fixture-QB_CLIENT_ID');
  vi.stubEnv('QB_CLIENT_SECRET', 'fixture-QB_CLIENT_SECRET');
  const request = () => new NextRequest('https://admin.elevateforhumanity.org/api/admin/integrations/quickbooks?action=connect');
  const first = await GET(request()), second = await GET(request());
  expect(first.status).toBe(303);
  expect(first.headers.get('cache-control')).toBe('private, no-store');
  const a = new URL(first.headers.get('location')!), b = new URL(second.headers.get('location')!);
  expect(a.origin).toBe('https://appcenter.intuit.com');
  expect(a.searchParams.get('scope')).toBe('com.intuit.quickbooks.accounting');
  expect(a.searchParams.get('state')).not.toBe(b.searchParams.get('state'));
  expect(verifyQuickBooksOAuthState(a.searchParams.get('state')!, 'fixture-QB_CLIENT_SECRET')).toBe(true);
  expect(fetch).not.toHaveBeenCalled();
});
it('returns failed connection starts to the dashboard with a safe visible cause', async () => {
  state.settingsError = {message:'private database detail'};
  const result = await GET(new NextRequest('https://admin.elevateforhumanity.org/api/admin/integrations/quickbooks?action=connect'));
  expect(result.status).toBe(303);
  expect(result.headers.get('location')).toBe('https://admin.elevateforhumanity.org/integrations/quickbooks?error=authorization_unavailable');
});
