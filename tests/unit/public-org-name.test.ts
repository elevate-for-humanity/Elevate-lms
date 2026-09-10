import { describe, expect, it, vi, afterEach } from 'vitest';

describe('getPublicOrgName', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns fallback when env contains a PLATFORM_DEFAULTS placeholder', async () => {
    vi.stubEnv('NEXT_PUBLIC_ORG_NAME', '${PLATFORM_DEFAULTS.orgName}');
    const { getPublicOrgName } = await import('@/lib/config/public-org-name');
    expect(getPublicOrgName()).toBe('Elevate for Humanity');
  });

  it('returns a real org name when env is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_ORG_NAME', 'Elevate for Humanity');
    const { getPublicOrgName } = await import('@/lib/config/public-org-name');
    expect(getPublicOrgName()).toBe('Elevate for Humanity');
  });
});
