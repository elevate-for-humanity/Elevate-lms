import { test, expect } from '@playwright/test';

// Read-only rendering checks. Production application submission is intentionally
// excluded: it requires a controlled test account and database cleanup contract.
for (const route of ['/', '/programs', '/programs/bookkeeping', '/programs/hvac-technician', '/apply/student', '/partners/host-shop/apply', '/funding/workone-intake']) {
  test(`${route}: readable, responsive, working images`, async ({ page }, testInfo) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 90000 });
    expect(response?.status()).toBeLessThan(400);
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    const geometry = await page.evaluate(() => {
      const root = document.documentElement;
      return { viewport: innerWidth, content: root.scrollWidth, heading: getComputedStyle(document.querySelector('h1')!).fontSize };
    });
    expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(parseFloat(geometry.heading)).toBeGreaterThanOrEqual(24);
    await page.locator('footer').scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator('main img').evaluateAll(images => images.filter(image => {
      const img = image as HTMLImageElement;
      return img.complete && img.naturalWidth === 0;
    }).length)).toBe(0);
    await page.screenshot({ path: testInfo.outputPath('render.png'), fullPage: true });
  });
}
