import { test, expect } from '@playwright/test';
import { siteUrls } from '../../lib/utils/site-urls';

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

  test('apply page exposes the canonical PARIS intake and standard-form fallback', async ({ page }) => {
    await page.goto('/apply');
    await expect(page).toHaveURL(/\/apply\/student\/interview/);
    await expect(page.getByRole('heading', { name: /Talk with PARIS/i })).toBeVisible();
    await expect(page.getByPlaceholder(/Type your answer|Escriba su respuesta/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('button', { name: /Speak answer|Escuchar/i })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Use standard form instead' })).toBeVisible();
  });

  test('canonical applications API validates missing fields', async ({ request }) => {
    const response = await request.post('/api/applications', { data: {}, failOnStatusCode: false });
    expect(response.status()).not.toBe(404);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('retired compatibility apply API is not an active submit surface', async ({ request }) => {
    const response = await request.post('/api/apply', { data: {}, failOnStatusCode: false });
    expect([404, 405, 410]).toContain(response.status());
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
    // This suite runs Marketing only. Verify its redirect without requiring the
    // separately deployed LMS to be online or changing canonical portal routing.
    const login = await request.get('/login?next=%2Flms&reason=session', {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(login.status()).toBe(307);
    const target = new URL(login.headers().location);
    expect(target.origin).toBe(new URL(siteUrls.app).origin);
    expect(target.pathname).toBe('/login');
    expect(target.searchParams.get('next')).toBe('/lms');
    expect(target.searchParams.get('reason')).toBe('session');

    const onboarding = await request.get('/onboarding/learner', { failOnStatusCode: false });
    expect(onboarding.status()).not.toBe(404);
    const tracking = await request.get('/apply/track', { failOnStatusCode: false });
    expect(tracking.status()).not.toBe(404);
  });
});
