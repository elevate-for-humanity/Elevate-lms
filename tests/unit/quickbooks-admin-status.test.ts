// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '@/apps/admin/app/api/admin/integrations/quickbooks/route';

const { upsert } = vi.hoisted(() => ({ upsert: vi.fn() }));
vi.mock('@/lib/admin/guards', () => ({ apiRequireAdmin: async () => ({}) }));
vi.mock('@/lib/api/withRateLimit', () => ({ applyRateLimit: async () => null }));
vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: async () => undefined }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: async () => ({ from: () => ({
  select: () => ({ in: async () => ({ data: [
    { key: 'QB_ACCESS_TOKEN', value: 'old-access' },
    { key: 'QB_REFRESH_TOKEN', value: 'old-refresh' },
    { key: 'QB_REALM_ID', value: 'company' },
  ], error: null }) }), upsert,
}) }) }));
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.clearAllMocks(); });

it('never reports connected when refreshed authorization cannot be persisted', async () => {
  vi.stubEnv('QB_CLIENT_ID', 'app');
  vi.stubEnv('QB_CLIENT_SECRET', 'secret');
  upsert.mockResolvedValue({ error: { message: 'storage unavailable' } });
  const request = vi.fn().mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'expired' })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ CompanyInfo: { CompanyName: 'Elevate' } }) });
  vi.stubGlobal('fetch', request);
  const response = await GET(new NextRequest('https://admin.example/api/admin/integrations/quickbooks'));
  expect((await response.json()).connected).toBe(false);
  expect(request).toHaveBeenCalledTimes(2);
});

it('verifies company information only after refreshed tokens have been stored', async () => {
  vi.stubEnv('QB_CLIENT_ID', 'app');
  vi.stubEnv('QB_CLIENT_SECRET', 'secret');
  let saved = false;
  upsert.mockImplementation(async () => { saved = true; return { error: null }; });
  const request = vi.fn().mockResolvedValueOnce({ ok: false, status: 401 })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }) })
    .mockImplementationOnce(async () => {
      expect(saved).toBe(true);
      return { ok: true, json: async () => ({ CompanyInfo: { CompanyName: 'Elevate' } }) };
    });
  vi.stubGlobal('fetch', request);
  const response = await GET(new NextRequest('https://admin.example/api/admin/integrations/quickbooks'));
  expect(await response.json()).toMatchObject({ connected: true, company_name: 'Elevate' });
  expect(upsert).toHaveBeenCalledOnce();
});

it('does not rotate credentials for a company permission failure', async () => {
  const request = vi.fn().mockResolvedValue({ ok: false, status: 403, text: async () => 'denied' });
  vi.stubGlobal('fetch', request);
  const response = await GET(new NextRequest('https://admin.example/api/admin/integrations/quickbooks'));
  expect((await response.json()).connected).toBe(false);
  expect(request).toHaveBeenCalledOnce();
  expect(upsert).not.toHaveBeenCalled();
});
