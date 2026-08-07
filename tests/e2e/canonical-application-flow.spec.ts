import { test, expect } from '@playwright/test';

test.describe('Canonical application flow', () => {
  test('homepage exposes a visible application path', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Elevate/i);
    await expect(
      page.locator('main a[href*="/apply"], main a:has-text("Apply"), main button:has-text("Apply")').filter({ visible: true }).first(),
    ).toBeVisible();
  });

  test('program discovery uses visible main-content links', async ({ page }) => {
    await page.goto('/programs');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();
    expect(await page.locator('main a[href*="/programs/"]:visible').count()).toBeGreaterThan(0);
  });

  test('apply page exposes canonical intake form', async ({ page }) => {
    await page.goto('/apply');
    await expect(page).toHaveURL(/\/apply/);
    const form = page.locator('main form, main #application, main [id*="form"]').first();
    await expect(form).toBeVisible();
    await expect(form.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(form.locator('input[type="tel"], input[name="phone"]').first()).toBeVisible();
    await expect(form.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('canonical applications API validates missing fields', async ({ request }) => {
    const response = await request.post('/api/applications', { data: {}, failOnStatusCode: false });
    expect(response.status()).not.toBe(404);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('compatibility apply API validates missing fields', async ({ request }) => {
    const response = await request.post('/api/apply', { data: {}, failOnStatusCode: false });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(String(body.error || '')).toMatch(/required|missing/i);
  });

  for (const route of [
    '/programs/barber-apprenticeship',
    '/programs/cosmetology-apprenticeship',
    '/programs/esthetician-apprenticeship',
    '/programs/nail-technician-apprenticeship',
  ]) {
    test(`${route} exposes an application path`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');
      await expect(page.locator('main').first()).toBeVisible();
      await expect(
        page.locator('main a[href*="/apply"]:visible, main a:has-text("Apply"):visible, main button:has-text("Apply"):visible').first(),
      ).toBeVisible();
    });
  }

  test('login, onboarding and tracking routes exist', async ({ page, request }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    const onboarding = await request.get('/onboarding/learner', { failOnStatusCode: false });
    expect(onboarding.status()).not.toBe(404);
    const tracking = await request.get('/apply/track', { failOnStatusCode: false });
    expect(tracking.status()).not.toBe(404);
  });
});
