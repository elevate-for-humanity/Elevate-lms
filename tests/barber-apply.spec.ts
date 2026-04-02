import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

test.describe('Barber apprenticeship apply page', () => {
  test('deposit field is typeable and calculator updates', async ({ page }) => {
    await page.goto(`${APP_URL}/programs/barber-apprenticeship/apply?type=apprentice`);

    const depositInput = page.locator('input[name="customAmount"], input[inputmode="numeric"]').first();
    await expect(depositInput).toBeVisible();

    await depositInput.click();
    await depositInput.fill('');
    await expect(depositInput).toHaveValue('');

    await depositInput.type('800', { delay: 30 });
    await expect(depositInput).toHaveValue(/800/);

    const estimate = page.locator('text=Your Payment Estimate').locator('..');
    await estimate.scrollIntoViewIfNeeded();

    await expect(estimate.locator('text=Down payment today').locator('..')).toContainText('$800');
    await expect(estimate.locator('text=Weekly payment').locator('..')).not.toContainText('—');
    await expect(estimate.locator('text=Remaining balance').locator('..')).not.toContainText('—');
  });

  test('all BNPL options render on page', async ({ page }) => {
    await page.goto(`${APP_URL}/programs/barber-apprenticeship`);

    await expect(page.getByRole('link', { name: /Affirm/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Sezzle/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Klarna/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Afterpay/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Zip/i })).toBeVisible();
  });

  test('BNPL links route with provider querystring', async ({ page }) => {
    await page.goto(`${APP_URL}/programs/barber-apprenticeship`);

    const providers = ['affirm', 'sezzle', 'klarna', 'afterpay', 'zip'];

    for (const provider of providers) {
      const link = page.locator(`a[href*="payment=${provider}"]`).first();
      await expect(link).toBeVisible();
      const href = await link.getAttribute('href');
      expect(href).toContain(`/programs/barber-apprenticeship/apply`);
      expect(href).toContain(`payment=${provider}`);
    }
  });
});
