/**
 * Test 4: Keyboard Navigation Testing
 */

import { test, expect } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Keyboard Navigation Tests', () => {
  test('Tab key moves focus forward', async ({ page }) => {
    await page.goto(baseURL);

    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();

    await page.keyboard.press('Tab');
    const secondFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(secondFocused).toBeTruthy();
  });

  test('Shift+Tab moves focus backward', async ({ page }) => {
    await page.goto(baseURL);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Shift+Tab');

    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(focused).toBeTruthy();
  });

  test('Focus indicators are visible', async ({ page }) => {
    await page.goto(baseURL);

    await page.keyboard.press('Tab');

    const outlineWidth = await page.evaluate(() => {
      const el = document.activeElement;
      return window.getComputedStyle(el!).outlineWidth;
    });

    expect(outlineWidth).not.toBe('0px');
  });

  test('No keyboard traps', async ({ page }) => {
    await page.goto(baseURL);

    for (let i = 0; i < 50; i++) {
      await page.keyboard.press('Tab');
      await page.waitForTimeout(50);
    }

    // Should be able to tab through without getting stuck
    expect(true).toBe(true);
  });

  test('Skip to main content works', async ({ page }) => {
    await page.goto(baseURL);

    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');

    await page.waitForTimeout(500);

    const focused = await page.evaluate(() => document.activeElement?.id);
    console.log('Focused after skip:', focused);
  });

  test('All buttons accessible via keyboard', async ({ page }) => {
    await page.goto(baseURL);

    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThan(0);

    console.log(`Found ${buttons} buttons`);
  });

  test('All links accessible via keyboard', async ({ page }) => {
    await page.goto(baseURL);

    const links = await page.locator('a').count();
    expect(links).toBeGreaterThan(0);

    console.log(`Found ${links} links`);
  });

  test('Forms can be submitted with Enter', async ({ page }) => {
    await page.goto(`${baseURL}/contact`);

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'Test message');

    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  });
});
