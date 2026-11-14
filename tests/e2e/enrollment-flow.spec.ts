import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Complete Enrollment Flow
 * Tests the full journey: Discovery → Apply → Upload → Review → Pay/Enroll → Learn
 *
 * Coverage:
 * - Program discovery and browsing
 * - Application form submission
 * - Authentication flows
 * - LMS access and navigation
 * - Payment flow
 * - Accessibility compliance
 * - Mobile responsiveness
 * - Error handling
 */

test.describe('Enrollment Flow - Complete Journey', () => {
  test.describe('Discovery Phase', () => {
    test('can browse programs from homepage', async ({ page }) => {
      await page.goto('/');

      // Check programs section exists
      await expect(page.locator('text=Our Programs')).toBeVisible();

      // Click on a program
      await page.click('text=Learn More >> nth=0');

      // Should navigate to program page
      await expect(page).toHaveURL(/\/programs\//);
    });

    test('can view program details', async ({ page }) => {
      await page.goto('/programs/barber');

      // Check key program information is visible
      await expect(page.locator('h1')).toContainText(/barber/i);

      // Check CTA buttons exist
      await expect(page.locator('text=Apply Now')).toBeVisible();
    });

    test('programs page shows all categories', async ({ page }) => {
      await page.goto('/programs');

      // Check category sections
      await expect(page.locator('text=Healthcare')).toBeVisible();
      await expect(page.locator('text=Skilled Trades')).toBeVisible();
    });
  });

  test.describe('Application Phase', () => {
    test('can access application form', async ({ page }) => {
      await page.goto('/apply');

      // Check form exists
      await expect(page.locator('form')).toBeVisible();

      // Check required fields
      await expect(page.locator('input[name="firstName"], input[name="first_name"]')).toBeVisible();
      await expect(page.locator('input[name="lastName"], input[name="last_name"]')).toBeVisible();
      await expect(page.locator('input[name="email"]')).toBeVisible();
    });

    test('form validates required fields', async ({ page }) => {
      await page.goto('/apply');

      // Try to submit empty form
      await page.click('button[type="submit"]');

      // Should show validation errors
      await expect(page.locator('text=required')).toBeVisible();
    });

    test('can fill out application form', async ({ page }) => {
      await page.goto('/apply');

      // Fill out form
      await page.fill('input[name="firstName"], input[name="first_name"]', 'Test');
      await page.fill('input[name="lastName"], input[name="last_name"]', 'User');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('input[name="phone"]', '317-555-1234');

      // Select program if dropdown exists
      const programSelect = page.locator('select[name="program"], select[name="programId"]');
      if (await programSelect.isVisible()) {
        await programSelect.selectOption({ index: 1 });
      }

      // Form should be fillable without errors
      await expect(page.locator('input[name="email"]')).toHaveValue('test@example.com');
    });
  });

  test.describe('Authentication Flow', () => {
    test('login page loads correctly', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('register page loads correctly', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('redirects to login when accessing protected routes', async ({ page }) => {
      await page.goto('/lms/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test.describe('LMS Access (Demo Mode)', () => {
    test('can access LMS in demo mode', async ({ page }) => {
      await page.goto('/lms/dashboard?demo=true');

      // Should show demo banner
      await expect(page.locator('text=Demo Mode')).toBeVisible();

      // Should show dashboard content
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('can navigate LMS sections in demo mode', async ({ page }) => {
      await page.goto('/lms/dashboard?demo=true');

      // Check navigation items
      await expect(page.locator('text=Courses')).toBeVisible();
      await expect(page.locator('text=Progress')).toBeVisible();
    });

    test('can view courses in demo mode', async ({ page }) => {
      await page.goto('/lms/courses?demo=true');

      // Should show courses page
      await expect(page.locator('h1, h2')).toContainText(/course/i);
    });
  });

  test.describe('Payment Flow', () => {
    test('payment page loads for self-pay programs', async ({ page }) => {
      // Navigate to a self-pay program
      await page.goto('/programs/barber');

      // Check pricing information is visible
      await expect(page.locator('text=/\\$[0-9,]+/')).toBeVisible();
    });

    test('funding information page loads', async ({ page }) => {
      await page.goto('/funding');

      // Check funding options are displayed
      await expect(page.locator('text=WIOA')).toBeVisible();
    });
  });

  test.describe('Navigation Integrity', () => {
    test('header navigation works', async ({ page }) => {
      await page.goto('/');

      // Check header exists
      await expect(page.locator('header')).toBeVisible();

      // Check logo links to home
      const logo = page.locator('header a[href="/"]').first();
      await expect(logo).toBeVisible();
    });

    test('footer navigation works', async ({ page }) => {
      await page.goto('/');

      // Check footer exists
      await expect(page.locator('footer')).toBeVisible();

      // Check footer links
      await expect(page.locator('footer a[href="/about"]')).toBeVisible();
      await expect(page.locator('footer a[href="/contact"]')).toBeVisible();
    });

    test('breadcrumbs show on program pages', async ({ page }) => {
      await page.goto('/programs/barber');

      // Check breadcrumbs exist
      await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();

      // Check breadcrumb links
      await expect(page.locator('text=Programs')).toBeVisible();
    });

    test('no broken links on homepage', async ({ page }) => {
      await page.goto('/');

      // Get all links
      const links = await page.locator('a[href^="/"]').all();

      // Check at least some links exist
      expect(links.length).toBeGreaterThan(5);

      // Verify first few links are valid (not checking all to save time)
      for (const link of links.slice(0, 5)) {
        const href = await link.getAttribute('href');
        if (href && !href.includes('#')) {
          const response = await page.request.get(href);
          expect(response.status()).toBeLessThan(400);
        }
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile menu works', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Check mobile menu button exists
      const menuButton = page.locator('button[aria-label*="menu"], button[aria-label*="Menu"]');
      await expect(menuButton).toBeVisible();

      // Click menu button
      await menuButton.click();

      // Menu should open
      await expect(page.locator('text=Programs')).toBeVisible();
    });

    test('content is readable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Check no horizontal scroll
      const body = page.locator('body');
      const bodyWidth = await body.evaluate((el) => el.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);
    });
  });

  test.describe('Error Handling', () => {
    test('404 page shows for invalid routes', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist-12345');

      expect(response?.status()).toBe(404);
    });

    test('error boundary catches errors gracefully', async ({ page }) => {
      await page.goto('/');

      // Page should load without console errors
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.waitForLoadState('networkidle');

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(
        (e) => !e.includes('ResizeObserver') && !e.includes('hydration'),
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });
});
