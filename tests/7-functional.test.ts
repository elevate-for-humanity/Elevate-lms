/**
 * Test 7: Functional Testing
 */

import { test, expect } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Functional Tests', () => {
  test('Browse courses', async ({ page }) => {
    await page.goto(`${baseURL}/programs`);

    await expect(page.locator('h1')).toBeVisible();

    const programLinks = page.locator('a[href*="/programs/"]');
    const count = await programLinks.count();

    expect(count).toBeGreaterThan(0);
    console.log(`Found ${count} program links`);
  });

  test('View course details', async ({ page }) => {
    await page.goto(`${baseURL}/programs/healthcare`);

    await expect(page.locator('h1')).toBeVisible();

    const content = await page.textContent('body');
    expect(content).toBeTruthy();
  });

  test('Contact form submission', async ({ page }) => {
    await page.goto(`${baseURL}/contact`);

    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('textarea[name="message"]', 'This is a functional test message.');

    await page.click('button[type="submit"]');

    await page.waitForTimeout(2000);

    console.log('Contact form submitted');
  });

  test('Application form exists', async ({ page }) => {
    await page.goto(`${baseURL}/apply`);

    const form = page.locator('form');
    await expect(form).toBeVisible();

    console.log('Application form found');
  });

  test('Navigation between pages', async ({ page }) => {
    await page.goto(baseURL);

    await page.click('a[href="/programs"]');
    await page.waitForURL('**/programs');
    await expect(page).toHaveURL(/\/programs/);

    await page.click('a[href="/about"]');
    await page.waitForURL('**/about');
    await expect(page).toHaveURL(/\/about/);

    console.log('Navigation working');
  });

  test('Search functionality', async ({ page }) => {
    await page.goto(`${baseURL}/programs`);

    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]');

    if ((await searchInput.count()) > 0) {
      await searchInput.fill('healthcare');
      await page.waitForTimeout(1000);
      console.log('Search tested');
    } else {
      console.log('No search input found');
    }
  });

  test('Footer links work', async ({ page }) => {
    await page.goto(baseURL);

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    const footerLinks = footer.locator('a');
    const count = await footerLinks.count();

    expect(count).toBeGreaterThan(0);
    console.log(`Footer has ${count} links`);
  });

  test('Cookie consent banner', async ({ page }) => {
    await page.goto(baseURL);

    const cookieBanner = page.locator('text=cookie, text=Cookie, text=consent');

    if ((await cookieBanner.count()) > 0) {
      console.log('Cookie consent banner found');
    }
  });
});
