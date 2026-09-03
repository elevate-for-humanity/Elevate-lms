import { test, expect } from '@playwright/test';

test.describe('Live Production Smoke', () => {
  test('homepage responds and renders core navigation', async ({ page, baseURL }) => {
    const response = await page.goto(baseURL || '/', { waitUntil: 'domcontentloaded' });
    expect(response).toBeTruthy();
    expect(response!.status()).toBeLessThan(400);

    await expect(page.locator('body')).toContainText(/Elevate|Humanity/i);
    const linkCount = await page.locator('a[href]').count();
    expect(linkCount).toBeGreaterThan(5);
  });

  test('public API health endpoints are not 5xx', async ({ request }) => {
    const root =
      process.env.PLAYWRIGHT_SMOKE_API_ROOT || 'https://www.elevateforhumanity.org';
    const candidates = ['/api/public/metrics'];

    for (const path of candidates) {
      const res = await request.get(`${root}${path}`);
      expect(res.status(), `${path} returned ${res.status()}`).toBeLessThan(500);
    }
  });
});
