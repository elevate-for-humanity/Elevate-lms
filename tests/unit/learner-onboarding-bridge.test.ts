// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { learnerOnboardingBridge } from '@/lib/routing/learner-onboarding-bridge';
import { LMS_HOST, MARKETING_HOST } from '@/lib/routing/portal-map';
import { renderToStaticMarkup } from 'react-dom/server';
import { siteUrls } from '@/lib/utils/site-urls';

const auth = vi.hoisted(() => ({ getUser: vi.fn(), createClient: vi.fn(), admin: vi.fn() }));
vi.mock('@/lib/supabase/server', () => ({ createClient: auth.createClient }));
vi.mock('@/lib/supabase/admin', () => ({ requireAdminClient: auth.admin }));
vi.mock('next/navigation', () => ({
  redirect: (url: string) => { throw new Error('REDIRECT:' + url); },
  notFound: () => { throw new Error('NOT_FOUND'); },
}));
import Page from '@/apps/lms/app/onboarding/learner/[[...path]]/page';
import Completion from '@/apps/marketing/app/onboarding/learner/complete/page';

const origins = { marketingHost: 'https://www.elevateforhumanity.org', lmsHost: 'https://lms.elevateforhumanity.org' };
const context = (path?: string[], searchParams: Record<string, string | string[] | undefined> = {}) => ({ params: Promise.resolve({ path }), searchParams: Promise.resolve(searchParams) });

beforeEach(() => {
  vi.clearAllMocks();
  auth.createClient.mockResolvedValue({ auth: { getUser: auth.getUser } });
  auth.getUser.mockResolvedValue({ data: { user: { id: 'current-user' } }, error: null });
});

describe('legacy LMS learner onboarding bridge', () => {
  it.each([undefined, ['agreements'], ['complete'], ['documents'], ['funding'], ['handbook'], ['orientation'], ['schedule'], ['verify-identity']].map(path => ({ path })))('maps only the existing Marketing checklist route %j', ({ path }) => {
    const suffix = path ? '/' + path[0] : '';
    expect(learnerOnboardingBridge({ ...origins, path })).toEqual({
      returnPath: '/onboarding/learner' + suffix,
      destination: origins.marketingHost + '/onboarding/learner' + suffix,
    });
  });

  it.each([['..'], ['%2e%2e'], ['//untrusted.invalid'], ['documents', 'delete'], ['unknown']].map(path => ({ path })))('rejects an arbitrary or traversing child route %j', ({ path }) => {
    expect(learnerOnboardingBridge({ ...origins, path })).toBeNull();
  });

  it('preserves known query values and excludes return URLs, duplicate values, and unsupported flags', () => {
    const bridge = learnerOnboardingBridge({ ...origins, searchParams: {
      checkout: 'success', reason: 'profile_missing', step: 'verification', status: 'submitted', funding: 'pending-review',
      next: 'https://untrusted.invalid', redirect: '//untrusted.invalid', token: 'not-forwarded',
    } })!;
    const target = new URL(bridge.destination);
    expect(Object.fromEntries(target.searchParams)).toEqual({ checkout: 'success', reason: 'profile_missing', step: 'verification', status: 'submitted', funding: 'pending-review' });
    expect(learnerOnboardingBridge({ ...origins, searchParams: { checkout: ['success', 'success'], reason: 'admin', step: '../admin', status: 'approved', funding: 'approved' } })?.returnPath).toBe('/onboarding/learner');
  });

  it('uses the configured Marketing origin and rejects a configuration that would loop', () => {
    expect(learnerOnboardingBridge({ marketingHost: 'http://localhost:3000', lmsHost: 'http://localhost:3002', path: ['orientation'] })?.destination).toBe('http://localhost:3000/onboarding/learner/orientation');
    for (const marketingHost of ['https://lms.elevateforhumanity.org', 'https://user:password@www.elevateforhumanity.org', 'https://www.elevateforhumanity.org?next=bad', 'https://www.elevateforhumanity.org/path', 'javascript:alert(1)']) {
      expect(() => learnerOnboardingBridge({ ...origins, marketingHost })).toThrow();
    }
  });

  it('requires current Auth even if the page is invoked without middleware', async () => {
    auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(Page(context(undefined, { reason: 'profile_missing', redirect: '//untrusted.invalid' }))).rejects.toThrow('REDIRECT:/login?redirect=%2Fonboarding%2Flearner%3Freason%3Dprofile_missing');
    expect(auth.getUser).toHaveBeenCalledTimes(1);
  });

  it('fails closed on an expired or rejected Auth session', async () => {
    auth.getUser.mockResolvedValue({ data: { user: { id: 'stale-user' } }, error: new Error('Session revoked') });
    await expect(Page(context(['documents']))).rejects.toThrow('REDIRECT:/login?redirect=%2Fonboarding%2Flearner%2Fdocuments');
  });

  it('hands an authenticated account to the owning page without requiring or granting a profile', async () => {
    await expect(Page(context(undefined, { reason: 'profile_missing' }))).rejects.toThrow('REDIRECT:' + new URL('/onboarding/learner?reason=profile_missing', MARKETING_HOST).toString());
    expect(auth.createClient).toHaveBeenCalledTimes(1);
    expect(auth.getUser).toHaveBeenCalledTimes(1);
    expect(new URL(MARKETING_HOST).origin).not.toBe(new URL(LMS_HOST).origin);
    expect(auth.admin).not.toHaveBeenCalled();
  });

  it('rejects an unknown route without sending it to a different application', async () => {
    await expect(Page(context(['unknown']))).rejects.toThrow('NOT_FOUND');
    expect(auth.createClient).not.toHaveBeenCalled();
  });

  it.each([false, true])('retains the Marketing completion guard and returns completed learners to the configured LMS (completed=%s)', async complete => {
    auth.admin.mockResolvedValue({ from: (table: string) => {
      const query: any = {
        select: () => query, eq: () => query, order: () => query, limit: () => query,
        maybeSingle: async () => ({ data: table === 'profiles' ? { orientation_completed: complete, first_name: 'Learner' } : { funding_source: 'self_pay' }, error: null }),
      };
      return query;
    } });
    if (!complete) {
      await expect(Completion()).rejects.toThrow('REDIRECT:/onboarding/learner/orientation');
    } else {
      const html = renderToStaticMarkup(await Completion());
      expect(html).toContain('href="' + siteUrls.dashboard + '"');
      expect(html).not.toContain('href="' + MARKETING_HOST + '/onboarding/learner"');
      expect(new URL(siteUrls.dashboard).origin).toBe(new URL(LMS_HOST).origin);
    }
  });

  it.each(['student-login-flow.spec.ts', 'jordan-magic-link.spec.ts'])('starts both owning local apps when the onboarding browser spec %s runs alone', async spec => {
    const argv = process.argv;
    for (const key of ['PLAYWRIGHT_APPS', 'PLAYWRIGHT_BASE_URL', 'PLAYWRIGHT_LMS_URL', 'PLAYWRIGHT_MARKETING_URL', 'PLAYWRIGHT_ADMIN_URL']) vi.stubEnv(key, '');
    try {
      process.argv = ['node', 'playwright', 'test', 'tests/e2e/' + spec];
      vi.resetModules();
      const { default: config } = await import('../../playwright.config');
      const servers = Array.isArray(config.webServer) ? config.webServer : [config.webServer];
      expect(servers.map(server => new URL(server!.url!).port).sort()).toEqual(['3000', '3002']);
    } finally {
      process.argv = argv;
      vi.unstubAllEnvs();
    }
  });
});
