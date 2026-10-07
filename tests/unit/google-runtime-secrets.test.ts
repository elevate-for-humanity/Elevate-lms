import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCachedSecret, getDecryptedPlatformSecret, getSecret, getSecrets,
  hydrateProcessEnv, refreshSecrets,
} from '../../lib/secrets';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('Google runtime secret delivery', () => {
  it('uses the deployed value without reaching a shared secret store', async () => {
    vi.stubEnv('QUICKBOOKS_CLIENT_SECRET', 'service-owned-value');
    const request = vi.fn(() => { throw new Error('Remote secrets access forbidden'); });
    vi.stubGlobal('fetch', request);
    await hydrateProcessEnv();
    await refreshSecrets();
    expect(await getSecret('QUICKBOOKS_CLIENT_SECRET')).toBe('service-owned-value');
    expect(await getDecryptedPlatformSecret('QUICKBOOKS_CLIENT_SECRET')).toBe('service-owned-value');
    expect(getCachedSecret('QUICKBOOKS_CLIENT_SECRET')).toBe('service-owned-value');
    expect(request).not.toHaveBeenCalled();
  });

  it('does not manufacture a credential absent from this service', async () => {
    vi.stubEnv('TELNYX_API_KEY', undefined);
    vi.stubEnv('QUICKBOOKS_CLIENT_SECRET', 'service-owned-value');
    expect(await getSecrets(['TELNYX_API_KEY', 'QUICKBOOKS_CLIENT_SECRET'])).toEqual({
      TELNYX_API_KEY: undefined, QUICKBOOKS_CLIENT_SECRET: 'service-owned-value',
    });
    expect(process.env.TELNYX_API_KEY).toBeUndefined();
  });

  it('never resolves retired Northflank credentials', async () => {
    vi.stubEnv('NORTHFLANK_API_TOKEN', 'retired-value');
    vi.stubEnv('NF_API_TOKEN', 'retired-value');
    expect(await getSecret('NORTHFLANK_API_TOKEN')).toBeUndefined();
    expect(await getDecryptedPlatformSecret('NF_API_TOKEN')).toBeUndefined();
  });
});
