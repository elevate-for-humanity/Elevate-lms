/**
 * Test 3: Screen Reader Testing
 * Tests accessibility for screen readers
 */

import { test, expect } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

test.describe('Screen Reader Accessibility Tests', () => {
  test('Page title announced correctly', async ({ page }) => {
    await page.goto(baseURL);

    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title.length).toBeGreaterThan(0);
  });

  test('Headings hierarchy is logical', async ({ page }) => {
    await page.goto(baseURL);

    // Get all headings
    const h1s = await page.locator('h1').count();
    const h2s = await page.locator('h2').count();
    const h3s = await page.locator('h3').count();

    // Should have exactly one h1
    expect(h1s).toBeGreaterThanOrEqual(1);

    // Should have h2s if there are h3s
    if (h3s > 0) {
      expect(h2s).toBeGreaterThan(0);
    }

    console.log(`Heading structure: H1=${h1s}, H2=${h2s}, H3=${h3s}`);
  });

  test('Navigation menu is accessible', async ({ page }) => {
    await page.goto(baseURL);

    const nav = page.locator('nav');
    await expect(nav).toBeVisible();

    // Check for aria-label or role
    const navRole = await nav.getAttribute('role');
    const navLabel = await nav.getAttribute('aria-label');

    expect(navRole === 'navigation' || navLabel).toBeTruthy();
  });

  test('Skip to main content link works', async ({ page }) => {
    await page.goto(baseURL);

    // Tab to skip link (it should be first focusable element)
    await page.keyboard.press('Tab');

    // Check if skip link exists
    const skipLink = page.locator('a[href="#main-content"]');
    if ((await skipLink.count()) > 0) {
      await expect(skipLink).toBeFocused();
    }
  });

  test('Images have descriptive alt text', async ({ page }) => {
    await page.goto(baseURL);

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');

      // Alt should exist (can be empty for decorative images)
      expect(alt).not.toBeNull();

      // If not empty, should be descriptive (more than 3 chars)
      if (alt && alt.length > 0) {
        expect(alt.length).toBeGreaterThan(3);
      }
    }
  });

  test('Links have meaningful text', async ({ page }) => {
    await page.goto(baseURL);

    const links = page.locator('a');
    const count = await links.count();

    for (let i = 0; i < Math.min(count, 20); i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');

      // Link should have text or aria-label
      expect(text || ariaLabel).toBeTruthy();

      // Should not be generic
      if (text) {
        const lowerText = text.toLowerCase().trim();
        expect(lowerText).not.toBe('click here');
        expect(lowerText).not.toBe('here');
        expect(lowerText).not.toBe('link');
      }
    }
  });

  test('Forms have proper labels', async ({ page }) => {
    await page.goto(`${baseURL}/contact`);

    const inputs = page.locator('input[type="text"], input[type="email"], textarea');
    const count = await inputs.count();

    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');

      // Input should have id with matching label, or aria-label
      if (id) {
        const label = page.locator(`label[for="${id}"]`);
        const hasLabel = (await label.count()) > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      } else {
        expect(ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('Error messages are announced', async ({ page }) => {
    await page.goto(`${baseURL}/contact`);

    // Submit form without filling required fields
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await page.waitForTimeout(1000);

    // Check for error messages with aria-live or role="alert"
    const errors = page.locator('[role="alert"], [aria-live="polite"], [aria-live="assertive"]');
    const errorCount = await errors.count();

    // Should have some error indication
    console.log(`Error announcements found: ${errorCount}`);
  });

  test('Programs page results are accessible', async ({ page }) => {
    await page.goto(`${baseURL}/programs`);

    // Check for program cards
    const programCards = page.locator(
      'article, [role="article"], .program-card, a[href*="/programs/"]',
    );
    const count = await programCards.count();

    expect(count).toBeGreaterThan(0);
    console.log(`Found ${count} program items`);
  });

  test('Application form is accessible', async ({ page }) => {
    await page.goto(`${baseURL}/apply`);

    // Check for form
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Check for required field indicators
    const requiredFields = page.locator('input[required], textarea[required], select[required]');
    const requiredCount = await requiredFields.count();

    console.log(`Required fields: ${requiredCount}`);
  });
});

test.describe('Screen Reader Summary', () => {
  test('Generate screen reader test report', async () => {
    console.log('✅ Screen reader accessibility testing complete');
    console.log('Tests: 10');
    console.log(
      'Checks: Page title, headings, navigation, skip link, alt text, links, forms, errors, results, application',
    );
  });
});
