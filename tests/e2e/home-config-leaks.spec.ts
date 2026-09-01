import { test, expect } from '@playwright/test';

test.describe('Homepage PLATFORM_DEFAULTS leaks', () => {
  test('homepage HTML must not contain raw PLATFORM_DEFAULTS template text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const html = await page.content();
    expect(html).not.toContain('{PLATFORM_DEFAULTS.orgName}');
    expect(html).not.toContain('${PLATFORM_DEFAULTS.orgName}');
  });

  test('homepage pathway image alt is human-readable', async ({ page }) => {
    await page.goto('/');
    const pathwaySection = page.getByRole('region', { name: 'Choose where you want to go next.' });
    await expect(pathwaySection).toBeVisible();
    const img = pathwaySection.getByRole('img').first();
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt).not.toMatch(/PLATFORM_DEFAULTS/);
    expect(alt!.length).toBeGreaterThan(10);
  });
});
