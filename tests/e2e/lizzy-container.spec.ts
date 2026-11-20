import { test, expect, type Page } from '@playwright/test';

/**
 * Lizzy container smoke — admin dashboard control plane tabs.
 */
async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set');

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
}

test.describe('Lizzy container', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
  });

  test('loads Lizzy with deploy strip and command panel', async ({ page }) => {
    await expect(page.getByText('Lizzy', { exact: false }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('GitHub → Google Cloud Run')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Command' })).toBeVisible();
  });

  const tabs = ['Shell', 'Upload', 'Files', 'Operations', 'Health', 'Errors', 'Video'] as const;

  for (const tab of tabs) {
    test(`opens ${tab} panel`, async ({ page }) => {
      await page.getByRole('button', { name: tab }).click();
      await page.waitForTimeout(500);
      // Panel-specific anchors
      if (tab === 'Upload') {
        await expect(page.getByText('Upload documents')).toBeVisible();
      }
      if (tab === 'Operations') {
        await expect(page.getByText('Operations — live intake')).toBeVisible();
      }
      if (tab === 'Errors') {
        await expect(page.getByText('Errors & monitoring')).toBeVisible();
      }
    });
  }
});
