import { test, expect } from '@playwright/test';

const APP_URL = process.env.APP_URL || 'http://localhost:3000';

test.describe('Barber apprenticeship apply page', () => {
  test('deposit field is typeable and calculator updates', async ({ page }) => {
    await page.goto(`${APP_URL}/programs/barber-apprenticeship/apply?type=apprentice`);

    const depositInput = page
      .locator('input[name="customAmount"], input[inputmode="numeric"]')
      .first();
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

  test('funding section shows consolidated BNPL card', async ({ page }) => {
    await page.goto(`${APP_URL}/programs/barber-apprenticeship`);

    await expect(page.getByRole('heading', { name: /Buy Now, Pay Later/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /Compare BNPL providers/i }).first(),
    ).toHaveAttribute('href', /\/programs\/barber-apprenticeship\/payment\/bnpl/);
  });

  test('BNPL compare page lists checkout providers', async ({ page }) => {
    await page.goto(`${APP_URL}/programs/barber-apprenticeship/payment/bnpl`);

    await expect(page.getByRole('heading', { name: /Pay with BNPL/i })).toBeVisible();
    await expect(page.getByText(/Affirm/i).first()).toBeVisible();
    await expect(page.getByText(/Klarna/i).first()).toBeVisible();
  });
});
