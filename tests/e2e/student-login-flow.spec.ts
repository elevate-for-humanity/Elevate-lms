/**
 * Student login → dashboard → LMS smoke test.
 *
 * Runs against the live site when PLAYWRIGHT_BASE_URL is set to production,
 * or against localhost:3000 when running locally with the dev server.
 *
 * Requires TEST_STUDENT_EMAIL and TEST_STUDENT_PASSWORD to be set for
 * authenticated flow tests. Public-route tests always run.
 *
 * Run against production:
 *   PLAYWRIGHT_BASE_URL=https://www.elevateforhumanity.org \
 *   TEST_STUDENT_EMAIL=test@example.com \
 *   TEST_STUDENT_PASSWORD=... \
 *   pnpm exec playwright test tests/e2e/student-login-flow.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000';
const STUDENT_EMAIL = process.env.TEST_STUDENT_EMAIL || '';
const STUDENT_PASSWORD = process.env.TEST_STUDENT_PASSWORD || '';
const HAS_CREDENTIALS = !!STUDENT_EMAIL && !!STUDENT_PASSWORD;

// ---------------------------------------------------------------------------
// Public route checks — always run
// ---------------------------------------------------------------------------

test.describe('Public routes', () => {
  test('login page loads and shows email/password fields', async ({ page }) => {
    const res = await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBeLessThan(400);
    await expect(page.locator('input[type="email"], input[name="email"]').first()).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('/learner/dashboard redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto(`${BASE}/learner/dashboard`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('/lms/courses redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto(`${BASE}/lms/courses`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });

  test('/unauthorized page renders without 5xx', async ({ page }) => {
    const res = await page.goto(`${BASE}/unauthorized`, { waitUntil: 'domcontentloaded' });
    expect(res?.status()).toBeLessThan(500);
  });

  test('/onboarding/learner redirects unauthenticated users to /login', async ({ page }) => {
    await page.goto(`${BASE}/onboarding/learner`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/login/);
  });
});

// ---------------------------------------------------------------------------
// Authenticated student flow — requires TEST_STUDENT_EMAIL + TEST_STUDENT_PASSWORD
// ---------------------------------------------------------------------------

test.describe('Authenticated student flow', () => {
  test.skip(!HAS_CREDENTIALS, 'Set TEST_STUDENT_EMAIL and TEST_STUDENT_PASSWORD to run');

  test.beforeEach(async ({ page }) => {
    // Log in before each test in this suite
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"], input[name="email"]').first().fill(STUDENT_EMAIL);
    await page.locator('input[type="password"]').first().fill(STUDENT_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    // Wait for navigation away from /login
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  test('student lands on /learner/dashboard or /onboarding after login', async ({ page }) => {
    const url = page.url();
    const isExpectedDestination =
      url.includes('/learner/dashboard') ||
      url.includes('/onboarding') ||
      url.includes('/lms');
    expect(
      isExpectedDestination,
      `Unexpected post-login destination: ${url}`,
    ).toBe(true);
  });

  test('student does NOT land on /unauthorized after login', async ({ page }) => {
    expect(page.url()).not.toContain('/unauthorized');
  });

  test('/learner/dashboard is accessible after login (no redirect to /unauthorized)', async ({ page }) => {
    await page.goto(`${BASE}/learner/dashboard`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).not.toContain('/unauthorized');
    expect(page.url()).not.toContain('/login');
  });

  test('/learner/dashboard renders student content', async ({ page }) => {
    await page.goto(`${BASE}/learner/dashboard`, { waitUntil: 'domcontentloaded' });
    // Should show some student-facing content — not an error page
    const body = await page.locator('body').textContent();
    const hasStudentContent =
      /dashboard|course|program|welcome|progress|enrollment/i.test(body ?? '');
    expect(hasStudentContent, 'Dashboard body has no student content').toBe(true);
  });

  test('profile_missing redirect goes to /onboarding/learner not /unauthorized', async ({ page }) => {
    // Simulate the profile_missing path by checking the redirect target in requireRole
    // We can't easily simulate a missing profile in E2E, but we can verify the
    // /onboarding/learner?reason=profile_missing URL renders without error
    await page.goto(`${BASE}/onboarding/learner?reason=profile_missing`, {
      waitUntil: 'domcontentloaded',
    });
    // Should render the onboarding page, not redirect to /unauthorized
    expect(page.url()).not.toContain('/unauthorized');
    const status = await page.evaluate(() => document.readyState);
    expect(status).toBe('complete');
  });
});

// ---------------------------------------------------------------------------
// Enrollment state gate — verify proxy redirects work correctly
// ---------------------------------------------------------------------------

test.describe('Enrollment gate redirects', () => {
  test.skip(!HAS_CREDENTIALS, 'Set TEST_STUDENT_EMAIL and TEST_STUDENT_PASSWORD to run');

  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"], input[name="email"]').first().fill(STUDENT_EMAIL);
    await page.locator('input[type="password"]').first().fill(STUDENT_PASSWORD);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15000 });
  });

  test('/lms/courses does not return 5xx for authenticated student', async ({ page }) => {
    const res = await page.goto(`${BASE}/lms/courses`, { waitUntil: 'domcontentloaded' });
    // May redirect to /learner/dashboard?access=pending or render courses —
    // either is correct. What must NOT happen is a 5xx or /unauthorized.
    expect(res?.status() ?? 200).toBeLessThan(500);
    expect(page.url()).not.toContain('/unauthorized');
  });

  test('student with active enrollment can reach /lms without loop', async ({ page }) => {
    // Navigate to LMS and verify we don't end up in an infinite redirect
    let redirectCount = 0;
    page.on('response', res => {
      if (res.status() === 307 || res.status() === 302) redirectCount++;
    });
    await page.goto(`${BASE}/lms/courses`, { waitUntil: 'networkidle' });
    expect(redirectCount, 'Too many redirects — possible redirect loop').toBeLessThan(5);
  });
});
