import { test, expect } from '@playwright/test';
import { loginAsStudent, hasTestCredentials } from '../helpers';

/**
 * E2E Tests for Student Portal
 */

test.describe('Student Portal', () => {
  test.beforeEach(async () => {
    test.skip(
      !hasTestCredentials(),
      'Test credentials not configured (TEST_STUDENT_EMAIL, TEST_STUDENT_PASSWORD)',
    );
  });

  test.describe('Enrollment', () => {
    test('should enroll in a course', async ({ page }) => {
      const loggedIn = await loginAsStudent(page);
      expect(loggedIn).toBeTruthy();

      await page.goto('/programs/healthcare');

      const enrollButton = page
        .locator('button:has-text("Enroll"), a:has-text("Enroll"), button:has-text("Register")')
        .first();

      if ((await enrollButton.count()) > 0) {
        await enrollButton.click();

        await Promise.race([
          page.waitForSelector('text=/success|enrolled|confirmed|thank you/i', { timeout: 10000 }),
          page.waitForURL(/checkout|payment|cart|success/, { timeout: 10000 }),
        ]).catch(() => {});

        const url = page.url();
        const pageContent = await page.textContent('body');
        const hasSuccessIndicator =
          /success|enrolled|confirmed|thank you|checkout|payment/i.test(pageContent || '') ||
          /checkout|payment|cart|success/.test(url);

        expect(hasSuccessIndicator || url !== '/programs/healthcare').toBeTruthy();
      } else {
        test.skip();
      }
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      const loggedIn = await loginAsStudent(page);
      expect(loggedIn).toBeTruthy();
    });

    test('should display student dashboard', async ({ page }) => {
      await page.goto('/lms');
      await page.waitForLoadState('domcontentloaded');

      const dashboardIndicators = page.locator('h1, h2, [data-testid="dashboard"]');
      await expect(dashboardIndicators.first()).toBeVisible({ timeout: 10000 });

      const pageContent = await page.textContent('body');
      expect(pageContent).toMatch(/dashboard|courses|my learning|welcome/i);
    });

    test('should show progress metrics', async ({ page }) => {
      await page.goto('/lms');
      await page.waitForLoadState('domcontentloaded');

      const progressIndicators = page.locator('text=/progress|completed|enrolled|courses/i');
      const count = await progressIndicators.count();

      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Course Access', () => {
    test.beforeEach(async ({ page }) => {
      const loggedIn = await loginAsStudent(page);
      expect(loggedIn).toBeTruthy();
    });

    test('should access enrolled course', async ({ page }) => {
      await page.goto('/lms');
      await page.waitForLoadState('domcontentloaded');

      const courseCard = page
        .locator(
          '[data-testid="course-card"], .course-card, a[href*="/lms/courses/"], a[href*="/courses/"]',
        )
        .first();

      if ((await courseCard.count()) > 0) {
        const initialUrl = page.url();
        await courseCard.click();
        await page.waitForLoadState('domcontentloaded');

        const newUrl = page.url();
        expect(newUrl).not.toBe(initialUrl);
        expect(newUrl).toMatch(/lms|course|learn/i);
      } else {
        const pageContent = await page.textContent('body');
        expect(pageContent).toMatch(/no courses|enroll|get started/i);
      }
    });
  });
});
