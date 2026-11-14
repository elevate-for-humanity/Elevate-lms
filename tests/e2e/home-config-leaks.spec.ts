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
    // Keep the accessible landmark aligned with the approved combined beauty section.
    const pathwaySection = page.getByRole('region', { name: 'Barber & Beauty Apprenticeships' });
    await expect(pathwaySection).toBeVisible();
    await expect(pathwaySection.getByRole('heading', { name: 'Meet our Host Shops' })).toBeVisible();
    const img = pathwaySection.locator('[data-featured-shops]').getByRole('img').first();
    const alt = await img.getAttribute('alt');
    expect(alt).toBeTruthy();
    expect(alt).not.toMatch(/PLATFORM_DEFAULTS/);
    expect(alt!.length).toBeGreaterThan(10);
  });
});
