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

  test('apply page exposes and advances the canonical multi-step intake form', async ({ page }) => {
    await page.goto('/apply');
    await expect(page).toHaveURL(/\/apply\/student/);

    const form = page.locator('main form').first();
    await expect(form).toBeVisible();
    await expect(form.locator('input[name="email"]')).toBeVisible();
    await expect(form.locator('input[name="phone"]')).toBeVisible();
    await expect(form.getByRole('button', { name: 'Continue' })).toBeVisible();

    await form.locator('input[name="firstName"]').fill('Smoke');
    await form.locator('input[name="lastName"]').fill('Tester');
    await form.locator('input[name="dateOfBirth"]').fill('1990-01-01');
    await form.locator('input[name="email"]').fill('smoke.tester@example.com');
    await form.locator('input[name="phone"]').fill('3175550100');
    await form.locator('input[name="address"]').fill('100 Test Street');
    await form.locator('input[name="city"]').fill('Indianapolis');
    await form.locator('input[name="state"]').fill('Indiana');
    await form.locator('input[name="zipCode"]').fill('46204');

    await form.getByRole('button', { name: 'Continue' }).click();
    await expect(form.getByText('Program and training preferences')).toBeVisible();
    await expect(form.locator('select[name="program"]')).toBeVisible();
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
    await page.goto('/login');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    const onboarding = await request.get('/onboarding/learner', { failOnStatusCode: false });
    expect(onboarding.status()).not.toBe(404);
    const tracking = await request.get('/apply/track', { failOnStatusCode: false });
    expect(tracking.status()).not.toBe(404);
  });
});
