
/** @vitest-environment node */
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
const state = vi.hoisted(() => ({ upsert: vi.fn(), accessToken: 'old-access' }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: async () => ({}) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => undefined }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({
  from: () => ({
    select: () => ({ in: async () => ({ data: [
      { key: 'QB_ACCESS_TOKEN', value: state.accessToken },
      { key: 'QB_REFRESH_TOKEN', value: 'old-refresh' },
      { key: 'QB_REALM_ID', value: 'company' },
    ], error: null }) }),
    upsert: state.upsert,
  }),
}) }));
import { GET } from '@/apps/admin/app/api/admin/integrations/quickbooks/route';

beforeEach(() => {
  state.accessToken = 'old-access';
  state.upsert.mockReset().mockResolvedValue({ error: null });
  vi.stubEnv('QB_ENVIRONMENT', 'production');
  vi.stubEnv('QB_CLIENT_ID', 'app');
  vi.stubEnv('QB_CLIENT_SECRET', 'secret');
  vi.stubEnv('QB_ACCESS_TOKEN', '');
});
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });
const status = () => GET(new NextRequest('https://admin.example/api/admin/integrations/quickbooks'));

it('does not report connected or retry company data when refreshed tokens cannot be saved', async () => {
  state.upsert.mockResolvedValue({ error: { message: 'storage unavailable' } });
  const request = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }) });
  vi.stubGlobal('fetch', request);
  expect(await (await status()).json()).toMatchObject({ connected: false, reason: 'token_persistence_failed' });
  expect(request).toHaveBeenCalledTimes(2);
});

it('persists refreshed tokens before retrying company verification', async () => {
  let saved = false;
  state.upsert.mockImplementation(async () => { saved = true; return { error: null }; });
  const request = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }) })
    .mockImplementationOnce(async () => {
      expect(saved).toBe(true);
      return { ok: true, json: async () => ({ CompanyInfo: { CompanyName: 'Elevate' } }) };
    });
  vi.stubGlobal('fetch', request);
  expect(await (await status()).json()).toMatchObject({ connected: true, company_name: 'Elevate' });
  expect(state.upsert).toHaveBeenCalledOnce();
});

it('does not rotate credentials for a company permission failure', async () => {
  const request = vi.fn().mockResolvedValue({ ok: false, status: 403 });
  vi.stubGlobal('fetch', request);
  expect(await (await status()).json()).toMatchObject({ connected: false, reason: 'provider_access_denied' });
  expect(request).toHaveBeenCalledOnce();
  expect(state.upsert).not.toHaveBeenCalled();
});

it('recovers a missing access token only through a persisted valid refresh', async () => {
  state.accessToken = '';
  const request = vi.fn().mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ CompanyInfo: { CompanyName: 'Elevate' } }) });
  vi.stubGlobal('fetch', request);
  expect(await (await status()).json()).toMatchObject({ connected: true });
  expect(state.upsert).toHaveBeenCalledOnce();
  expect(request).toHaveBeenCalledTimes(2);
});

it('retains the production-environment guard before any provider request', async () => {
  vi.stubEnv('QB_ENVIRONMENT', 'sandbox');
  const request = vi.fn();
  vi.stubGlobal('fetch', request);
  expect(await (await status()).json()).toMatchObject({ connected: false, reason: 'production_environment_unverified' });
  expect(request).not.toHaveBeenCalled();
});
