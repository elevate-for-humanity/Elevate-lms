import { test, expect } from '@playwright/test';

const PATHS = [
  '/',
  '/blog',
  '/skilled-trades-training-indiana',
  '/programs/skilled-trades',
  '/cna-training-indianapolis',
  '/hvac-training-indianapolis',
  '/cdl-training-indianapolis',
  '/programs/culinary-apprenticeship',
  '/programs/cdl-training',
  '/programs/hvac-technician',
  '/programs/cna',
  '/programs/bookkeeping',
  '/programs',
  '/employers',
];

test.describe('PLATFORM_DEFAULTS must not leak in public HTML', () => {
  for (const path of PATHS) {
    test(`no raw placeholders on ${path}`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.status()).toBeLessThan(400);
      await page.waitForLoadState('domcontentloaded');
      const html = await page.content();
      expect(html).not.toContain('{PLATFORM_DEFAULTS.orgName}');
      expect(html).not.toContain('${PLATFORM_DEFAULTS.orgName}');
      expect(html).not.toContain('alt={PLATFORM_DEFAULTS.orgName}');
    });
  }
});
