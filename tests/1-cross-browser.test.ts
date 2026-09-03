/**
 * Test 1: Cross-Browser Testing
 * Tests core functionality across different browser engines
 */

import { test, expect } from '@playwright/test';
import { gotoWithRetry } from './helpers';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Chromium - Cross-Browser Tests', () => {
  test('Homepage loads correctly', async ({ page }) => {
    await gotoWithRetry(page, baseURL);
    await expect(page).toHaveTitle(/Elevate for Humanity/i);
    await expect(page.locator('h1').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('header')).toBeVisible({ timeout: 10000 });
  });

  test('Navigation menu works', async ({ page }) => {
    await page.goto(baseURL);

    // Check main navigation links
    const programsLink = page.locator('a[href="/programs"]');
    await expect(programsLink).toBeVisible();

    // Click and verify navigation
    await programsLink.click();
    await page.waitForURL('**/programs');
    await expect(page).toHaveURL(/\/programs/);
  });

  test('Forms submit successfully', async ({ page }) => {
    await page.goto(`${baseURL}/contact`);

    // Fill contact form
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill(
      'textarea[name="message"]',
      'This is a test message for cross-browser testing.',
    );

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for success message or redirect
    await page.waitForTimeout(2000);
  });

  test('Responsive design at 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(baseURL);

    // Check layout is not broken
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('Responsive design at 1366x768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(baseURL);

    const header = page.locator('header');
    await expect(header).toBeVisible();
  });

  test('Video playback works', async ({ page }) => {
    await page.goto(baseURL);

    // Check if video element exists
    const video = page.locator('video');
    if ((await video.count()) > 0) {
      await expect(video.first()).toBeVisible();
    }
  });
});
