import { test, expect } from '@playwright/test';

/**
 * Lizzy container smoke — admin dashboard control plane tabs.
 * Requires admin auth storage state when E2E_ADMIN_EMAIL is set in CI.
 */
test.describe('Lizzy container', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/dashboard');
  });

  test('loads Lizzy with deploy strip and command panel', async ({ page }) => {
    await expect(page.getByText('Lizzy', { exact: false }).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('GitHub → Northflank')).toBeVisible();
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
