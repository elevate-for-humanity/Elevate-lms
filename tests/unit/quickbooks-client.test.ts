// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadQuickBooksConfig, quickBooksRequest } from '@/lib/integrations/quickbooks-client';

vi.mock('@/lib/secrets', () => ({ hydrateProcessEnv: vi.fn().mockResolvedValue(undefined) }));
beforeEach(() => { vi.stubEnv('QB_ENVIRONMENT','production'); Object.assign(config, {accessToken:'old-access',refreshToken:'old-refresh'}); });
afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const config = { clientId: 'app', clientSecret: 'secret', accessToken: 'old-access', refreshToken: 'old-refresh', realmId: 'company' };
const currentSettings = () => ({ data: Object.entries({QB_CLIENT_ID:'app',QB_CLIENT_SECRET:'secret',QB_ACCESS_TOKEN:'old-access',QB_REFRESH_TOKEN:'old-refresh',QB_REALM_ID:'company'}).map(([key,value])=>({key,value})), error:null });
const settingsFrom = () => ({select:()=>({in:async()=>currentSettings()})});
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
    await expect(quickBooksRequest({ from: settingsFrom, rpc: upsert }, config, 'companyinfo/company')).rejects.toThrow('invalid authorization response');
    expect(upsert).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('requires both rotated tokens to be saved before retrying the original request', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: { message: 'private-storage-error' } });
    const fetchMock = vi.fn().mockResolvedValueOnce({ status: 401 }).mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }) });
    vi.stubGlobal('fetch', fetchMock);
    await expect(quickBooksRequest({ from: settingsFrom, rpc: upsert }, config, 'companyinfo/company')).rejects.toThrow('could not be saved');
    expect(upsert).toHaveBeenCalledWith('rotate_quickbooks_authorization', {p_expected_refresh:'old-refresh',p_realm:'company',p_access:'new-access',p_refresh:'new-refresh'});
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries a read with the refreshed token after durable storage succeeds', async () => {
    const upsert = vi.fn().mockResolvedValue({ data: true, error: null });
    const fetchMock = vi.fn().mockResolvedValueOnce({ status: 401 })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ access_token: 'new-access', refresh_token: 'new-refresh' }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ CompanyInfo: { Id: 'company' } }) });
    vi.stubGlobal('fetch', fetchMock);
    expect(await quickBooksRequest({ from: settingsFrom, rpc: upsert }, config, 'companyinfo/company')).toEqual({ CompanyInfo: { Id: 'company' } });
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
  await expect(quickBooksRequest({from:settingsFrom}, config, 'companyinfo/company')).rejects.toMatchObject({reason});
  expect(upsert).not.toHaveBeenCalled();
});

it('shares concurrent refreshes instead of rotating the same grant twice', async () => {
  const rpc = vi.fn().mockResolvedValue({data:true,error:null});
  const request = vi.fn().mockImplementation(async (_url, init) => {
    if (init.method === 'POST') return Response.json({access_token:'new-access',refresh_token:'new-refresh'});
    return init.headers.authorization === 'Bearer old-access'
      ? Response.json({}, {status:401}) : Response.json({CompanyInfo:{Id:'company'}});
  });
  vi.stubGlobal('fetch',request);
  const first={...config}, second={...config};
  await Promise.all([quickBooksRequest({rpc,from:settingsFrom},first,'companyinfo/company'),quickBooksRequest({rpc,from:settingsFrom},second,'companyinfo/company')]);
  expect([first.refreshToken,second.refreshToken]).toEqual(['new-refresh','new-refresh']);
  expect(request.mock.calls.filter(([,init])=>init.method==='POST')).toHaveLength(1);
  expect(rpc).toHaveBeenCalledTimes(1);
});

it('uses newer saved consent when a stale refresh loses its compare-and-set', async () => {
  const latest = {...config,accessToken:'consented-access',refreshToken:'consented-refresh'};
  const rpc=vi.fn().mockResolvedValue({data:false,error:null});
  let reads=0;
  const db={rpc,from:()=>({select:()=>({in:async()=>++reads === 1 ? currentSettings() : ({data:[['QB_CLIENT_ID','app'],['QB_CLIENT_SECRET','secret'],['QB_ACCESS_TOKEN',latest.accessToken],['QB_REFRESH_TOKEN',latest.refreshToken],['QB_REALM_ID','company']].map(([key,value])=>({key,value})),error:null})})})};
  const request=vi.fn().mockResolvedValueOnce(Response.json({}, {status:401}))
    .mockResolvedValueOnce(Response.json({access_token:'stale-access',refresh_token:'stale-refresh'}))
    .mockResolvedValueOnce(Response.json({CompanyInfo:{Id:'company'}}));
  vi.stubGlobal('fetch',request);
  await quickBooksRequest(db,config,'companyinfo/company');
  expect(request.mock.calls[2][1].headers.authorization).toBe('Bearer consented-access');
});

it('retains rotated tokens for sequential requests using the same connection snapshot', async () => {
  const snapshot = {...config};
  const rpc = vi.fn().mockResolvedValue({data:true,error:null});
  const request = vi.fn().mockImplementation(async (_url, init) => {
    if (init.method === 'POST') return Response.json({access_token:'new-access',refresh_token:'new-refresh'});
    return init.headers.authorization === 'Bearer old-access' ? Response.json({}, {status:401}) : Response.json({ok:true});
  });
  vi.stubGlobal('fetch',request);
  await quickBooksRequest({rpc,from:settingsFrom},snapshot,'companyinfo/company');
  await quickBooksRequest({rpc,from:settingsFrom},snapshot,'query?query=select%20Id%20from%20Invoice');
  expect(snapshot.refreshToken).toBe('new-refresh');
  expect(request.mock.calls.filter(([,init])=>init.method==='POST')).toHaveLength(1);
});
it('does not resurrect deployment tokens after the saved connection is removed', async () => {
  for (const key of ['QB_ACCESS_TOKEN','QB_REFRESH_TOKEN','QB_REALM_ID']) vi.stubEnv(key,'retired');
  const loaded=await loadQuickBooksConfig(settingsDb({data:[],error:null}));
  expect([loaded.accessToken,loaded.refreshToken,loaded.realmId]).toEqual(['','','']);
});
it('rejects a partial runtime credential pair rather than mixing OAuth apps', async () => {
  vi.stubEnv('QB_CLIENT_ID','runtime-app'); vi.stubEnv('QB_CLIENT_SECRET','');
  await expect(loadQuickBooksConfig(settingsDb({data:[{key:'QB_CLIENT_SECRET',value:'other-app-secret'}],error:null}))).rejects.toMatchObject({reason:'oauth_configuration_missing'});
});

it('uses a newer grant saved by another replica without refreshing the obsolete grant', async () => {
  const rpc=vi.fn();
  const db={rpc,...settingsDb({data:Object.entries({QB_CLIENT_ID:'app',QB_CLIENT_SECRET:'secret',QB_ACCESS_TOKEN:'replica-access',QB_REFRESH_TOKEN:'replica-refresh',QB_REALM_ID:'company'}).map(([key,value])=>({key,value})),error:null})};
  const request=vi.fn().mockResolvedValueOnce(Response.json({}, {status:401})).mockResolvedValueOnce(Response.json({ok:true}));
  vi.stubGlobal('fetch',request);
  await quickBooksRequest(db,{...config},'companyinfo/company');
  expect(rpc).not.toHaveBeenCalled();
  expect(request.mock.calls[1][1].headers.authorization).toBe('Bearer replica-access');
});

it('recovers when another replica saves new consent during a rejected refresh', async () => {
  let reads=0;
  const latest={...currentSettings(),data:currentSettings().data.map(row=>({...row,value:row.key==='QB_ACCESS_TOKEN'?'other-access':row.key==='QB_REFRESH_TOKEN'?'other-refresh':row.value}))};
  const db={from:()=>({select:()=>({in:async()=>++reads===1?currentSettings():latest})})};
  const request=vi.fn().mockResolvedValueOnce(Response.json({}, {status:401}))
    .mockResolvedValueOnce(Response.json({error:'invalid_grant'}, {status:400}))
    .mockResolvedValueOnce(Response.json({ok:true}));
  vi.stubGlobal('fetch',request);
  await quickBooksRequest(db,{...config},'companyinfo/company');
  expect(request.mock.calls[2][1].headers.authorization).toBe('Bearer other-access');
});
