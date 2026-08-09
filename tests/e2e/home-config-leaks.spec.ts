import { test, expect } from '@playwright/test';

test.describe('Homepage PLATFORM_DEFAULTS leaks', () => {
  test('homepage HTML must not contain raw PLATFORM_DEFAULTS template text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const html = await page.content();
    expect(html).not.toContain('{PLATFORM_DEFAULTS.orgName}');
    expect(html).not.toContain('${PLATFORM_DEFAULTS.orgName}');
  });

  test('employer strip image alt is human-readable', async ({ page }) => {
    await page.goto('/');
    const employerSection = page.locator('#employer-strip-heading');
    await expect(employerSection).toBeVisible();
    const img = page.locator('section[aria-labelledby="employer-strip-heading"] img').first();
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt).not.toMatch(/PLATFORM_DEFAULTS/);
    expect(alt!.length).toBeGreaterThan(10);
  });
});
