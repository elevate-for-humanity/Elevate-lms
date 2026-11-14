import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Admin Portal
 */

test.describe('Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@example.com');
    await page.fill('input[type="password"]', process.env.TEST_ADMIN_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30000 });
  });

  test('should display admin dashboard', async ({ page }) => {
    await page.goto('/dashboard');

    await expect(page.locator('h1:has-text("Admin")')).toBeVisible();
  });

  test('should manage users', async ({ page }) => {
    await page.goto('/users');

    await expect(page.locator('text=Users')).toBeVisible();
  });

  test('should view analytics', async ({ page }) => {
    await page.goto('/analytics');

    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should approve program holder applications', async ({ page }) => {
    await page.goto('/program-holder-applications');

    await expect(page.locator('text=Program Holder Applications')).toBeVisible();
  });
});
