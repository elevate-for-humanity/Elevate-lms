import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Regression: each deployed app owns its authentication boundary. The retired
 * root proxy is not a portal authority in the multi-app architecture.
 */
describe('deployed portal middleware auth coverage', () => {
  const lms = readFileSync(resolve(process.cwd(), 'apps/lms/middleware.ts'), 'utf8');
  const marketing = readFileSync(resolve(process.cwd(), 'apps/marketing/middleware.ts'), 'utf8');
  const marketingHome = readFileSync(resolve(process.cwd(), 'apps/marketing/app/page.tsx'), 'utf8');
  const homeHero = readFileSync(resolve(process.cwd(), 'components/ui/HomeHeroVideo.tsx'), 'utf8');

  const lmsProtectedPrefixes = [
    '/learner',
    '/lms/dashboard',
    '/lms/courses',
    '/apprentice',
    '/host-shop/dashboard',
    '/parent-portal/dashboard',
    '/employer',
    '/workforce',
    '/program-holder',
    '/creator',
  ];

  it.each(lmsProtectedPrefixes)('LMS PROTECTED_PREFIXES includes %s', (prefix) => {
    expect(lms).toContain(`'${prefix}'`);
  });

  it.each(['/case-manager', '/workforce-board', '/provider'])(
    'Marketing PROTECTED_PORTAL_PREFIXES includes %s',
    (prefix) => {
      expect(marketing).toContain(`'${prefix}'`);
    },
  );

  it('validates the Supabase user before protected LMS rendering', () => {
    expect(lms).toContain('supabase.auth.getUser()');
    expect(lms).toMatch(/protectedPath\s*&&\s*\(error\s*\|\|\s*!user\)/);
    expect(lms).toContain("X-Robots-Tag', 'noindex, nofollow, noarchive'");
  });

  it('does not refresh Supabase sessions on public LMS entry points', () => {
    expect(lms).toMatch(/if \(protectedPath\) \{[\s\S]*supabase\.auth\.getUser\(\)/);
    expect(lms).not.toContain('hasSupabaseSession || protectedPath');
  });

  it('renders the marketing homepage before loading the optional database hero', () => {
    expect(marketingHome).not.toContain('getApprovedHomeHeroAsset');
    expect(marketingHome).toContain('<HomeHeroVideo banner={heroBanners.home} />');
    expect(homeHero).toContain("fetch('/api/public/home-hero'");
  });

  it('validates the Supabase user before protected Marketing portal rendering', () => {
    expect(marketing).toContain('supabase.auth.getUser()');
    expect(marketing).toMatch(/if \(error \|\| !user\)/);
    expect(marketing).toContain(
      "response.headers.set('Cache-Control', 'private, no-store, max-age=0')",
    );
  });
});
