import { test, expect, type Page } from '@playwright/test';

/**
 * Browser acceptance for the unified Admin Studio command workspace.
 *
 * The legacy Lizzy dashboard container and Shell tab were retired. The same
 * governed capabilities now live at /studio behind the current Admin boundary.
 */
async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set');

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
}

test.describe('Unified Admin Studio', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.route('**/api/admin/dev-studio/conversations?summary=1', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ conversations: [] }),
      }),
    );
    await page.goto('/studio');
  });

  test('loads the governed command workspace', async ({ page }) => {
    await expect(page.getByText('Elevate Studio', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Chat', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Work', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Tools', exact: true })).toBeVisible();
  });

  test('opens the canonical Course Builder from Studio tools', async ({ page }) => {
    await page.route('**/api/admin/courses', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
    await page.route('**/api/admin/dev-studio/programs', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ data: [] }),
      }),
    );

    await page.getByRole('button', { name: 'Tools', exact: true }).click();
    const toolNavigation = page.getByRole('navigation', { name: 'Studio tools' });
    await expect(toolNavigation).toBeVisible();
    await toolNavigation.getByRole('button', { name: 'Course Builder', exact: true }).click();

    await expect(page.getByRole('region', { name: 'Active Studio tool' })).toContainText(
      'Course Builder',
    );
  });

  test('opens the isolated browser workspace from the current control plane', async ({ page }) => {
    const browserButton = page.getByRole('button', { name: 'Browser', exact: true }).first();
    await expect(browserButton).toBeVisible();
    await browserButton.click();

    await expect(page.getByRole('region', { name: 'Active Studio tool' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Browser', exact: true }).last()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('supports the desktop split-workspace control', async ({ page }) => {
    const split = page.getByRole('button', { name: 'Split screen', exact: true });
    await expect(split).toBeEnabled();
    await split.click();
    await expect(split).toHaveAttribute('aria-pressed', 'true');
  });

  test('keeps the protected dashboard return path', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Open admin dashboard' })).toHaveAttribute(
      'href',
      '/dashboard',
    );
    await expect(page.getByText('Upload files', { exact: true })).toBeVisible();
  });
});
