// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';

vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn().mockResolvedValue(undefined) }));
beforeEach(() => { vi.stubEnv('QB_ENVIRONMENT','production'); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const config = { clientId: 'app', clientSecret: 'secret', accessToken: 'old-access', refreshToken: 'old-refresh', realmId: 'company' };
const settingsDb = (result: unknown) => ({ from: vi.fn(() => ({ select: () => ({ in: async () => result }) })) });

describe('QuickBooks runtime authorization', () => {
  it.each(['sandbox','invalid',''])('rejects unverified production environment %s before any provider request or token rotation',async environment=>{
    vi.stubEnv('QB_ENVIRONMENT',environment);const fetchMock=vi.fn();vi.stubGlobal('fetch',fetchMock);
    await expect(quickBooksRequest({},config,'companyinfo/company')).rejects.toMatchObject({reason:'production_environment_unverified'});
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('uses canonical static credentials and the latest stored rotating tokens', async () => {
    for (const key of ['QB_CLIENT_ID', 'QB_CLIENT_SECRET', 'QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID']) vi.stubEnv(key, 'deployment-'+key);
    const db = settingsDb({ data: ['QB_CLIENT_ID', 'QB_CLIENT_SECRET', 'QB_ACCESS_TOKEN', 'QB_REFRESH_TOKEN', 'QB_REALM_ID'].map(key => ({ key, value: 'stored-'+key })), error: null });
    expect(await loadQuickBooksConfig(db)).toEqual({ clientId: 'deployment-QB_CLIENT_ID', clientSecret: 'deployment-QB_CLIENT_SECRET', accessToken: 'stored-QB_ACCESS_TOKEN', refreshToken: 'stored-QB_REFRESH_TOKEN', realmId: 'stored-QB_REALM_ID' });
  });

  it('surfaces unreadable settings instead of using stale deployment tokens', async () => {
    await expect(loadQuickBooksConfig(settingsDb({ data: null, error: { message: 'private-database-detail' } }))).rejects.toThrow('QuickBooks connection settings could not be loaded.');
  });

  it('does not persist an invalid refresh response or retry the API request', async () => {
    const upsert = vi.fn();
    const fetchMock = vi.fn().mockResolvedValueOnce({ status: 401 }).mockResolvedValueOnce({ ok: true, json: async () => ({ refresh_token: 'new-refresh' }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(quickBooksRequest({ from: () => ({ upsert }) }, config, 'companyinfo/company')).rejects.toThrow('invalid authorization response');
    expect(upsert).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('requires both rotated tokens to be saved before retrying the original request', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'private-storage-error' } });
    const fetchMock = vi.fn().mockResolvedValueOnce({ status: 401 }).mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(quickBooksRequest({ from: () => ({ upsert }) }, config, 'companyinfo/company')).rejects.toThrow('could not be saved');
    expect(upsert).toHaveBeenCalledWith([expect.objectContaining({ key: 'QB_ACCESS_TOKEN', value: 'new-access' }), expect.objectContaining({ key: 'QB_REFRESH_TOKEN', value: 'new-refresh' })], { onConflict: 'key' });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries a read with the refreshed token after durable storage succeeds', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    const fetchMock = vi.fn().mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ CompanyInfo: { Id: 'company' } }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await quickBooksRequest({ from: () => ({ upsert }) }, config, 'companyinfo/company')).toEqual({ CompanyInfo: { Id: 'company' } });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(fetchMock.mock.calls[2][1].headers.authorization).toBe('Bearer new-access');
    expect(upsert).toHaveBeenCalledOnce();
  });
});

it.each([
  [400, 'invalid_grant', 'oauth_reauthorization_required'],
  [401, 'invalid_client', 'oauth_client_rejected'],
  [429, 'rate_limit', 'provider_rate_limited'],
  [503, 'server_error', 'provider_unavailable'],
  [400, 'invalid_request', 'oauth_refresh_failed'],
])('classifies Intuit refresh failure %s/%s without falsely requesting consent', async (status, error, reason) => {
  const upsert = vi.fn();
  vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({status:401}).mockResolvedValueOnce(Response.json({error}, {status})));
  await expect(quickBooksRequest({from:()=>({upsert})}, config, 'companyinfo/company')).rejects.toMatchObject({reason});
  expect(upsert).not.toHaveBeenCalled();
});
