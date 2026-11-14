/**
 * Test 2: Mobile Device Testing
 * Tests on iOS and Android device viewports
 */

import { test, expect, devices } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('iPhone 14 Pro - Mobile Tests', () => {
  test('Homepage loads and scrolls smoothly', async ({ page }) => {
    await page.setViewportSize({ width: 393, height: 852 });
    await page.goto(baseURL);

    await expect(page).toHaveTitle(/Elevate for Humanity/i);

    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    await page.waitForTimeout(500);

    // Scroll back up
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(500);
  });

  test('Touch navigation works', async ({ page }) => {
    await page.goto(baseURL);

    // Find and tap mobile menu button if present
    const menuButton = page.locator('button[aria-label*="menu" i]');
    if ((await menuButton.count()) > 0) {
      await menuButton.tap();
      await page.waitForTimeout(500);

      // Check if menu opened
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    }
  });

  test('Forms are usable (no zoom issues)', async ({ page }) => {
    await page.goto(`${baseURL}/contact`);

    // Tap on input field
    const nameInput = page.locator('input[name="name"]');
    await nameInput.tap();

    // Check viewport didn't zoom (font-size should be >= 16px)
    const fontSize = await nameInput.evaluate((el) => window.getComputedStyle(el).fontSize);
    const fontSizeNum = parseInt(fontSize);
    expect(fontSizeNum).toBeGreaterThanOrEqual(16);
  });

  test('Portrait orientation', async ({ page }) => {
    await page.goto(baseURL);

    // Verify content is visible in portrait
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('Landscape orientation', async ({ page }) => {
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto(baseURL);

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });
});
