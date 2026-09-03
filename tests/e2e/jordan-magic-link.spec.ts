/**
 * Jordan White — authenticated student flow via magic link.
 *
 * Uses a pre-generated magic link token to authenticate as Jordan
 * and verify the full student portal access path.
 *
 * Run:
 *   PLAYWRIGHT_BASE_URL=https://www.elevateforhumanity.org \
 *   MAGIC_LINK_URL="<generated_url>" \
 *   pnpm exec playwright test tests/e2e/jordan-magic-link.spec.ts
 */

import { test, expect } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://www.elevateforhumanity.org';
const MAGIC_LINK = process.env.MAGIC_LINK_URL || '';

test.describe('Jordan White — student portal access', () => {
  test.skip(!MAGIC_LINK, 'Set MAGIC_LINK_URL to run');

  test.beforeEach(async ({ page }) => {
    // Follow the magic link — Supabase verifies the token and redirects to /auth/callback
    // then the callback route redirects to the final destination.
    // Use networkidle to wait for the full redirect chain to settle.
    await page.goto(MAGIC_LINK, { waitUntil: 'networkidle', timeout: 30000 });
  });

  test('1. login does not land on /unauthorized', async ({ page }) => {
    expect(page.url()).not.toContain('/unauthorized');
  });

  test('2. login lands on /learner/dashboard or /lms', async ({ page }) => {
    const url = page.url();
    const isExpected =
      url.includes('/learner/dashboard') ||
      url.includes('/lms') ||
      url.includes('/onboarding');
    expect(isExpected, `Unexpected destination: ${url}`).toBe(true);
  });

  test('3. /learner/dashboard is accessible without redirect to /unauthorized', async ({ page }) => {
    await page.goto(`${BASE}/learner/dashboard`, { waitUntil: 'domcontentloaded' });
    expect(page.url()).not.toContain('/unauthorized');
    expect(page.url()).not.toContain('/login');
  });

  test('4. /learner/dashboard renders student content', async ({ page }) => {
    await page.goto(`${BASE}/learner/dashboard`, { waitUntil: 'domcontentloaded' });
    const body = await page.locator('body').textContent();
    expect(/dashboard|course|program|welcome|progress|enrollment|barber/i.test(body ?? ''))
      .toBe(true);
  });

  test('5. /lms/courses is accessible (no 5xx, no /unauthorized)', async ({ page }) => {
    const res = await page.goto(`${BASE}/lms/courses`, { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);
    expect(page.url()).not.toContain('/unauthorized');
  });

  test('6. /lms/programs is accessible (no 5xx, no /unauthorized)', async ({ page }) => {
    const res = await page.goto(`${BASE}/lms/programs`, { waitUntil: 'domcontentloaded' });
    expect(res?.status() ?? 200).toBeLessThan(500);
    expect(page.url()).not.toContain('/unauthorized');
  });

  test('7. no redirect loop on /lms/courses', async ({ page }) => {
    let redirectCount = 0;
    page.on('response', res => {
      if (res.status() === 307 || res.status() === 302) redirectCount++;
    });
    await page.goto(`${BASE}/lms/courses`, { waitUntil: 'networkidle' });
    expect(redirectCount, 'Redirect loop detected').toBeLessThan(5);
  });

  test('8. /onboarding/learner?reason=profile_missing renders (not /unauthorized)', async ({ page }) => {
    await page.goto(`${BASE}/onboarding/learner?reason=profile_missing`, {
      waitUntil: 'domcontentloaded',
    });
    expect(page.url()).not.toContain('/unauthorized');
  });
});
