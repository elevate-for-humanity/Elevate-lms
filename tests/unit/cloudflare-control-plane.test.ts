import { afterEach, describe, expect, it, vi } from 'vitest';
const secret = vi.hoisted(() => vi.fn());
vi.mock('@/lib/secrets', () => ({ getSecret: secret }));
import { probeCloudflareControlPlane, purgeCloudflareCache } from '@/lib/control-plane/cloudflare';
const zone = 'a'.repeat(32);
afterEach(() => { vi.unstubAllGlobals(); vi.resetAllMocks(); });
describe('Cloudflare cache control', () => {
  it('requires credentials before issuing a request', async () => {
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    secret.mockResolvedValue(undefined);
    await expect(purgeCloudflareCache()).rejects.toThrow('requires');
    expect(fetch).not.toHaveBeenCalled();
  });
  it('uses the selected zone and returns the provider acceptance receipt', async () => {
    secret.mockImplementation(async key => key.endsWith('ZONE_ID') ? zone : 'private-token');
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,result:{id:'receipt'}})));
    vi.stubGlobal('fetch', fetch);
    await expect(purgeCloudflareCache()).resolves.toMatchObject({receipt_id:'receipt'});
    expect(fetch).toHaveBeenCalledWith(`https://api.cloudflare.com/client/v4/zones/${zone}/purge_cache`, expect.objectContaining({method:'POST',redirect:'error'}));
  });
  it('rejects failed HTTP responses even if their JSON claims success', async () => {
    secret.mockImplementation(async key => key.endsWith('ZONE_ID') ? zone : 'private-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,result:{id:'receipt'}}),{status:403})));
    await expect(purgeCloudflareCache()).rejects.toThrow('HTTP 403');
  });
});

describe('Cloudflare control-plane connection evidence',()=>{
 it('does not reuse a Workers AI token as zone control authorization',async()=>{
  secret.mockImplementation(async key=>key==='CLOUDFLARE_AI_API_TOKEN'?'ai-only':undefined);
  const fetch=vi.fn();vi.stubGlobal('fetch',fetch);
  expect(await probeCloudflareControlPlane()).toMatchObject({configured:false,reachable:false,status:'not_configured'});
  expect(fetch).not.toHaveBeenCalled();
 });
 it.each([
  [403,{success:false}],
  [200,{success:false,result:{id:zone,account:{id:'account'}}}],
  [200,{success:true,result:{id:'b'.repeat(32),account:{id:'account'}}}],
  [200,{success:true,result:{id:zone,account:{id:'other-account'}}}],
 ])('rejects denied or mismatched zone access (%s)',async(status,body)=>{
  secret.mockImplementation(async key=>key.endsWith('ZONE_ID')?zone:key.endsWith('ACCOUNT_ID')?'account':'private-token');
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response(JSON.stringify(body),{status})));
  expect(await probeCloudflareControlPlane()).toMatchObject({configured:true,reachable:false,writeVerified:false});
 });
 it('verifies the exact zone without claiming write permission or issuing mutations',async()=>{
  secret.mockImplementation(async key=>key.endsWith('ZONE_ID')?' '+zone+' ':key.endsWith('ACCOUNT_ID')?'account':'private-token');
  const fetch=vi.fn().mockResolvedValue(new Response(JSON.stringify({success:true,result:{id:zone,account:{id:'account'}}})));
  vi.stubGlobal('fetch',fetch);
  expect(await probeCloudflareControlPlane()).toMatchObject({configured:true,reachable:true,writeVerified:false});
  expect(fetch).toHaveBeenCalledWith(`https://api.cloudflare.com/client/v4/zones/${zone}`,expect.objectContaining({redirect:'error',cache:'no-store'}));
  expect(fetch.mock.calls[0][1].method).toBeUndefined();
 });
 it('does not expose private upstream errors',async()=>{
  secret.mockResolvedValue('a'.repeat(32));
  vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('private credential')));
  const result=await probeCloudflareControlPlane();
  expect(result.reachable).toBe(false);
  expect(JSON.stringify(result)).not.toContain('private credential');
 });
});
