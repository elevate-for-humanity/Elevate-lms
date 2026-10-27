import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSecret = vi.hoisted(() => vi.fn());
vi.mock('@/lib/secrets', () => ({ getSecret }));
import { getMetaOAuthConfig } from '@/lib/social/meta-oauth-config';

describe('Meta runtime configuration compatibility', () => {
  beforeEach(() => { getSecret.mockReset(); });
  it('resolves the legacy secret name copied from Northflank into Google', async () => {
    getSecret.mockImplementation(async (key: string) => ({ FACEBOOK_CLIENT_ID: 'test-app', Facebook_secret: 'test-secret' }[key]));
    const config = await getMetaOAuthConfig();
    expect(config.clientId).toEqual({ key: 'FACEBOOK_CLIENT_ID', value: 'test-app' });
    expect(config.clientSecret).toEqual({ key: 'Facebook_secret', value: 'test-secret' });
  });
  it('keeps canonical values ahead of the legacy alias', async () => {
    getSecret.mockImplementation(async (key: string) => ({ FACEBOOK_CLIENT_SECRET: 'canonical', Facebook_secret: 'legacy' }[key]));
    expect((await getMetaOAuthConfig()).clientSecret).toEqual({ key: 'FACEBOOK_CLIENT_SECRET', value: 'canonical' });
  });
  it('reports a missing secret without inventing a credential', async () => {
    getSecret.mockResolvedValue(undefined);
    expect((await getMetaOAuthConfig()).clientSecret).toEqual({ key: null, value: '' });
  });
});
