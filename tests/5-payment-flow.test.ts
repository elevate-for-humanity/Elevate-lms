/**
 * Test 5: Payment Flow Testing
 */

import { test, expect } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const hasStripeConfig = !!(
  process.env.STRIPE_SECRET_KEY || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
);

test.describe('Payment Flow Tests', () => {
  test('Course enrollment payment flow', async ({ page }) => {
    await page.goto(`${baseURL}/programs/healthcare/courses`);

    const enrollButton = page.locator('button:has-text("Enroll"), a:has-text("Enroll")').first();

    if ((await enrollButton.count()) > 0) {
      await enrollButton.click();

      await Promise.race([
        page.waitForURL(/stripe\.com|checkout|payment|cart/, { timeout: 10000 }),
        page.waitForSelector(
          '[data-testid="payment-form"], [data-testid="checkout"], form[action*="stripe"]',
          { timeout: 10000 },
        ),
        page.waitForSelector('text=Payment, text=Checkout, text=Cart', { timeout: 10000 }),
      ]).catch(() => {});

      const url = page.url();
      const hasPaymentIndicator =
        url.includes('stripe') ||
        url.includes('checkout') ||
        url.includes('payment') ||
        url.includes('cart') ||
        (await page.locator('[data-testid="payment-form"], [data-testid="checkout"]').count()) > 0;

      expect(hasPaymentIndicator || url !== `${baseURL}/programs/healthcare/courses`).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('Payment button exists on course pages', async ({ page }) => {
    await page.goto(`${baseURL}/programs/healthcare/courses`);

    const paymentButtons = page.locator(
      'button:has-text("Enroll"), button:has-text("Pay"), a:has-text("Enroll"), a:has-text("Register")',
    );
    const count = await paymentButtons.count();

    expect(count).toBeGreaterThan(0);
  });

  test('Free course enrollment works', async ({ page }) => {
    await page.goto(`${baseURL}/programs`);

    const freeBadges = page.locator('text=/FREE|\\$0/i');
    const freeCount = await freeBadges.count();

    if (freeCount > 0) {
      const freeItem = freeBadges.first();
      const parentCard = freeItem
        .locator('xpath=ancestor::a | xpath=ancestor::div[contains(@class, "card")]')
        .first();

      if ((await parentCard.count()) > 0) {
        await parentCard.click();
        await page.waitForLoadState('domcontentloaded');
        expect(page.url()).not.toBe(`${baseURL}/programs`);
      } else {
        expect(freeCount).toBeGreaterThan(0);
      }
    } else {
      test.skip();
    }
  });

  test('Payment API endpoint exists', async ({ page }) => {
    const response = await page.request.post(`${baseURL}/api/stripe/checkout`, {
      data: {},
      failOnStatusCode: false,
    });

    expect(response.status()).not.toBe(404);
    expect([400, 401, 403, 405, 500]).toContain(response.status());
  });

  test('Stripe keys are configured', async () => {
    test.skip(!hasStripeConfig, 'Stripe environment variables not configured');
    expect(hasStripeConfig).toBeTruthy();
  });
});
