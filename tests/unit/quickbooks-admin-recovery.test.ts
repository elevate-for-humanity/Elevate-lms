// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  rows: [] as { key: string; value: string }[],
  settingsError: null as null | { message: string },
  upsert: vi.fn(),
}));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn().mockResolvedValue(undefined) }));
vi.mock('@/lib/admin/guards', () => ({
  apiRequireAdmin: vi.fn().mockResolvedValue({ user: { id: 'operator' } }),
}));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: vi.fn().mockResolvedValue(null) }));
vi.mock('@/lib/supabase/admin', () => ({
  requireAdminClient: async () => ({
    from: () => ({
      select: () => ({ in: async () => ({ data: state.rows, error: state.settingsError }) }),
      upsert: state.upsert,
    }),
  }),
}));
vi.mock('@/lib/logger', () => ({ logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() } }));
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
    expect(state.upsert).toHaveBeenCalledOnce();
  });
  it('does not report connection success when rotated tokens cannot be saved', async () => {
    state.upsert.mockResolvedValue({ error: { message: 'storage failed' } });
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
