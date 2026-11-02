// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe('canonical LMS links', () => {
  it.each([
    [undefined, undefined, 'https://lms.elevateforhumanity.org'],
    [undefined, 'https://app.elevateforhumanity.org/', 'https://lms.elevateforhumanity.org'],
    ['https://lms.elevateforhumanity.org/', 'https://app.elevateforhumanity.org', 'https://lms.elevateforhumanity.org'],
    ['http://localhost:3002/', 'https://preview.example.org', 'http://localhost:3002'],
    [undefined, 'https://preview.example.org/', 'https://preview.example.org'],
    ['  ', ' https://preview.example.org/ ', 'https://preview.example.org'],
  ])('resolves LMS=%s and legacy APP=%s to %s', async (lms, app, expected) => {
    vi.stubEnv('NEXT_PUBLIC_LMS_URL', lms);
    vi.stubEnv('NEXT_PUBLIC_APP_URL', app);
    vi.resetModules();
    const { siteUrls } = await import('@/lib/utils/site-urls');
    const { LMS_HOST } = await import('@/lib/routing/portal-map');
    expect(siteUrls.app).toBe(expected);
    expect(siteUrls.lms).toBe(LMS_HOST);
    expect(siteUrls.login).toBe(`${LMS_HOST}/login`);
    expect(siteUrls.dashboard).toBe(`${LMS_HOST}/lms/dashboard`);
    expect(siteUrls.employerPortal).toBe(`${LMS_HOST}/employer/dashboard`);
  });
});
