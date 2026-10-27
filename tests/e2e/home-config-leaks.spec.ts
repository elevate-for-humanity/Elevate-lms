import { test, expect } from '@playwright/test';

test.describe('Homepage PLATFORM_DEFAULTS leaks', () => {
  test('homepage HTML must not contain raw PLATFORM_DEFAULTS template text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const html = await page.content();
    expect(html).not.toContain('{PLATFORM_DEFAULTS.orgName}');
    expect(html).not.toContain('${PLATFORM_DEFAULTS.orgName}');
  });

  test('homepage featured shop image alt is human-readable', async ({ page }) => {
    await page.goto('/');
    // Career pathways now use decorative icons; verify the featured shop photographs.
    const pathwaySection = page.getByRole('region', { name: 'Real shops. Real experience.' });
    await expect(pathwaySection).toBeVisible();
    const img = pathwaySection.getByRole('img').first();
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt).not.toMatch(/PLATFORM_DEFAULTS/);
    expect(alt!.length).toBeGreaterThan(10);
  });
});
