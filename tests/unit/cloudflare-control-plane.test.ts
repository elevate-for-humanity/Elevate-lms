import { afterEach, describe, expect, it, vi } from 'vitest';
const secret = vi.hoisted(() => vi.fn());
vi.mock('@/lib/secrets', () => ({ getSecret: secret }));
import { purgeCloudflareCache } from '@/lib/control-plane/cloudflare';
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
