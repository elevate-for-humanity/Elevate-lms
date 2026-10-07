import { test, expect } from '@playwright/test';

test.describe('Homepage PLATFORM_DEFAULTS leaks', () => {
  test('homepage HTML must not contain raw PLATFORM_DEFAULTS template text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const html = await page.content();
    expect(html).not.toContain('{PLATFORM_DEFAULTS.orgName}');
    expect(html).not.toContain('${PLATFORM_DEFAULTS.orgName}');
  });

  test('featured homepage photographs have human-readable alt text', async ({ page }) => {
    await page.goto('/');
    const photographs = page.getByRole('region', { name: 'Real shops. Real experience.' });
    await expect(photographs).toBeVisible();
    const images = photographs.getByRole('img');
    await expect(images).toHaveCount(2);
    for (const image of await images.all()) {
      await expect(image).toBeVisible();
      const alt = await image.getAttribute('alt');
      expect(alt).toBeTruthy();
      expect(alt).not.toMatch(/PLATFORM_DEFAULTS|\.(?:webp|png|jpe?g)$/i);
      expect(alt!.length).toBeGreaterThan(10);
    }
  });
});
