import { test, expect } from '@playwright/test';

/**
 * Canonical application-flow regression tests.
 *
 * These tests intentionally do not create a real applicant. They verify the
 * production conversion path and API boundary with validation-only requests.
 * A separate controlled smoke test can exercise persistence against a test DB.
 */

test.describe('Canonical application flow', () => {
  test('homepage exposes a visible application path', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Elevate/i);

    const applyAction = page
      .locator('main a[href*="/apply"], main a:has-text("Apply"), main button:has-text("Apply")')
      .filter({ visible: true })
      .first();

    await expect(applyAction).toBeVisible();
  });

  test('program discovery uses visible main-content links', async ({ page }) => {
    await page.goto('/programs');
    await page.waitForLoadState('domcontentloaded');

    await expect(page.locator('main').first()).toBeVisible();
    const programLinks = page.locator('main a[href*="/programs/"]:visible');
    expect(await programLinks.count()).toBeGreaterThan(0);
  });

  test('apply page exposes the canonical intake form', async ({ page }) => {
    await page.goto('/apply');
    await expect(page).toHaveURL(/\/apply/);
    await expect(
      page.getByRole('heading', { name: 'Check Your Eligibility', level: 1 }),
    ).toBeVisible();

    const form = page.locator('main form, main #application, main [id*="form"]').first();
    await expect(form).toBeVisible();
    await expect(form.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(form.locator('input[type="tel"], input[name="phone"]').first()).toBeVisible();
    await expect(form.locator('button[type="submit"]').first()).toBeVisible();
  });

  test('apply page contains a visible program-selection path', async ({ page }) => {
    await page.goto('/apply');

    const visibleProgramPath = page
      .locator('main a[href*="/programs"], main a[href*="/apprenticeship"]')
      .filter({ visible: true })
      .first();

    // Program selection may be rendered as a select/radio group instead of a link.
    const programControl = page
      .locator(
        'main select[name*="program" i], main input[name*="program" i], main [role="combobox"]',
      )
      .first();

    const hasVisibleLink = await visibleProgramPath.isVisible().catch(() => false);
    const hasVisibleControl = await programControl.isVisible().catch(() => false);
    expect(hasVisibleLink || hasVisibleControl).toBeTruthy();
  });

  test('canonical applications API exists and validates required fields', async ({ request }) => {
    const response = await request.post('/api/applications', {
      data: {},
      failOnStatusCode: false,
    });

    expect(response.status()).not.toBe(404);
    expect(response.status()).toBeGreaterThanOrEqual(400);
    expect(response.status()).toBeLessThan(500);
  });

  test('compatibility apply API delegates to canonical validation', async ({ request }) => {
    const response = await request.post('/api/apply', {
      data: {},
      failOnStatusCode: false,
    });

    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(String(body.error || '')).toMatch(/required|missing/i);
  });

  test('barber apprenticeship has a working apply path', async ({ page }) => {
    await page.goto('/programs/barber-apprenticeship');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();

    const apply = page
      .locator(
        'main a[href*="/apply"]:visible, main a:has-text("Apply"):visible, main button:has-text("Apply"):visible',
      )
      .first();
    await expect(apply).toBeVisible();
  });

  test('Hairstylist technical route remains compatible', async ({ page }) => {
    await page.goto('/programs/cosmetology-apprenticeship');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('body')).toContainText(/Hairstylist|Cosmetology/i);
  });

  test('Esthetician apprenticeship has a working apply path', async ({ page }) => {
    await page.goto('/programs/esthetician-apprenticeship');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();

    const apply = page
      .locator('main a[href*="/apply"]:visible, main a:has-text("Apply"):visible')
      .first();
    await expect(apply).toBeVisible();
  });

  test('Manicurist apprenticeship has a working apply path', async ({ page }) => {
    await page.goto('/programs/nail-technician-apprenticeship');
    await page.waitForLoadState('domcontentloaded');
    await expect(page.locator('main').first()).toBeVisible();

    const apply = page
      .locator('main a[href*="/apply"]:visible, main a:has-text("Apply"):visible')
      .first();
    await expect(apply).toBeVisible();
  });

  test('login and onboarding destinations are present', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();

    const onboarding = await page.request.get('/onboarding/learner', {
      failOnStatusCode: false,
    });
    expect(onboarding.status()).not.toBe(404);
  });

  test('application tracking route is available', async ({ request }) => {
    const response = await request.get('/apply/track', { failOnStatusCode: false });
    expect(response.status()).not.toBe(404);
  });
});
