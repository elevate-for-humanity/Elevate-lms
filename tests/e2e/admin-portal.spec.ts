import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Admin Portal
 */

test.describe('Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', process.env.TEST_ADMIN_EMAIL || 'admin@example.com');
    await page.fill('input[name="password"]', process.env.TEST_ADMIN_PASSWORD || 'password123');
    await page.click('button[type="submit"]');
  });

  test('should display admin dashboard', async ({ page }) => {
    await page.goto('/admin');

    await expect(page.locator('h1:has-text("Admin")')).toBeVisible();
  });

  test('should manage users', async ({ page }) => {
    await page.goto('/admin/users');

    await expect(page.locator('text=Users')).toBeVisible();
  });

  test('should view analytics', async ({ page }) => {
    await page.goto('/admin/analytics');

    await expect(page.locator('text=Analytics')).toBeVisible();
  });

  test('should approve program holder applications', async ({ page }) => {
    await page.goto('/admin/program-holders');

    await expect(page.locator('text=Program Holder Applications')).toBeVisible();
  });
});
