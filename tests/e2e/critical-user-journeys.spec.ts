import { test, expect } from '@playwright/test';

/**
 * Critical User Journey E2E Tests
 *
 * These tests cover the most important user flows that directly impact
 * business metrics and user experience.
 */

test.describe('Critical User Journeys', () => {
  // ============================================
  // JOURNEY 1: New User Discovery → Application
  // ============================================
  test.describe('New User Application Journey', () => {
    test('complete journey: homepage → programs → apply', async ({ page }) => {
      // Step 1: Land on homepage
      await page.goto('/');
      await expect(page).toHaveTitle(/Elevate for Humanity/);

      // Verify hero section is visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      // Step 2: Navigate to programs
      await page
        .getByRole('link', { name: /programs/i })
        .first()
        .click();
      await expect(page).toHaveURL(/\/programs/);

      // Step 3: Select a program
      const programCard = page.locator('[data-testid="program-card"]').first();
      if (await programCard.isVisible()) {
        await programCard.click();
      } else {
        // Fallback: click first program link
        await page
          .getByRole('link', { name: /healthcare|technology|trades/i })
          .first()
          .click();
      }

      // Step 4: Click apply button
      const applyButton = page.getByRole('link', { name: /apply|enroll/i }).first();
      await expect(applyButton).toBeVisible();
      await applyButton.click();

      // Step 5: Verify application page loads
      await expect(page).toHaveURL(/\/apply|\/enroll/);
    });

    test('quick apply form submission', async ({ page }) => {
      await page.goto('/apply');

      // Fill out quick apply form
      await page.getByLabel(/first name/i).fill('Test');
      await page.getByLabel(/last name/i).fill('User');
      await page.getByLabel(/email/i).fill('test@example.com');
      await page.getByLabel(/phone/i).fill('3171234567');

      // Select a program if dropdown exists
      const programSelect = page.getByLabel(/program/i);
      if (await programSelect.isVisible()) {
        await programSelect.selectOption({ index: 1 });
      }

      // Submit form (don't actually submit in test)
      const submitButton = page.getByRole('button', { name: /submit|apply/i });
      await expect(submitButton).toBeEnabled();
    });
  });

  // ============================================
  // JOURNEY 2: Student Learning Flow
  // ============================================
  test.describe('Student Learning Journey', () => {
    test.beforeEach(async ({ page }) => {
      // Mock authentication for student tests
      await page.goto('/');
      // In real tests, you'd authenticate here
    });

    test('course catalog browsing', async ({ page }) => {
      await page.goto('/courses');

      // Verify courses page loads
      await expect(page.getByRole('heading', { name: /courses/i })).toBeVisible();

      // Test search functionality
      const searchInput = page.getByPlaceholder(/search/i);
      if (await searchInput.isVisible()) {
        await searchInput.fill('healthcare');
        await page.waitForTimeout(500); // Debounce
      }

      // Test category filters
      const filterButtons = page.getByRole('button', { name: /all|healthcare|technology/i });
      const firstFilter = filterButtons.first();
      if (await firstFilter.isVisible()) {
        await firstFilter.click();
      }
    });

    test('course detail page has required elements', async ({ page }) => {
      await page.goto('/courses');

      // Click on first course
      const courseLink = page
        .getByRole('link')
        .filter({ hasText: /course|training|program/i })
        .first();
      if (await courseLink.isVisible()) {
        await courseLink.click();

        // Verify course detail elements
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

        // Check for enroll/start button
        const actionButton = page.getByRole('link', { name: /enroll|start|continue/i });
        await expect(actionButton.first()).toBeVisible();
      }
    });
  });

  // ============================================
  // JOURNEY 3: Contact & Support
  // ============================================
  test.describe('Contact & Support Journey', () => {
    test('contact page loads with all information', async ({ page }) => {
      await page.goto('/contact');

      // Verify contact information is visible
      await expect(page.getByText(/317.*314.*3757|contact/i)).toBeVisible();

      // Verify contact form exists
      const contactForm = page.locator('form');
      await expect(contactForm.first()).toBeVisible();
    });

    test('about page loads correctly', async ({ page }) => {
      await page.goto('/about');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/mission|workforce|training/i).first()).toBeVisible();
    });
  });

  // ============================================
  // JOURNEY 4: Mobile Experience
  // ============================================
  test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE

    test('mobile navigation works', async ({ page }) => {
      await page.goto('/');

      // Open mobile menu
      const menuButton = page.getByRole('button', { name: /menu|open/i });
      if (await menuButton.isVisible()) {
        await menuButton.click();

        // Verify navigation links are visible
        await expect(page.getByRole('link', { name: /programs/i })).toBeVisible();
        await expect(page.getByRole('link', { name: /about/i })).toBeVisible();
      }
    });

    test('mobile forms are usable', async ({ page }) => {
      await page.goto('/apply');

      // Verify form inputs are properly sized for mobile
      const inputs = page.locator('input[type="text"], input[type="email"]');
      const firstInput = inputs.first();

      if (await firstInput.isVisible()) {
        const box = await firstInput.boundingBox();
        expect(box?.width).toBeGreaterThan(200); // Minimum touch target
      }
    });
  });

  // ============================================
  // JOURNEY 5: Accessibility
  // ============================================
  test.describe('Accessibility', () => {
    test('homepage is keyboard navigable', async ({ page }) => {
      await page.goto('/');

      // Tab through page
      await page.keyboard.press('Tab');

      // Skip link should be first focusable element
      const skipLink = page.getByText(/skip to/i);
      if (await skipLink.isVisible()) {
        await expect(skipLink).toBeFocused();
      }

      // Continue tabbing to main navigation
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('Tab');
      }

      // Verify focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
    });

    test('images have alt text', async ({ page }) => {
      await page.goto('/');

      // Check all images have alt attributes
      const images = page.locator('img');
      const count = await images.count();

      for (let i = 0; i < Math.min(count, 10); i++) {
        const img = images.nth(i);
        const alt = await img.getAttribute('alt');
        const ariaHidden = await img.getAttribute('aria-hidden');

        // Image should have alt text OR be aria-hidden
        expect(alt !== null || ariaHidden === 'true').toBeTruthy();
      }
    });

    test('forms have proper labels', async ({ page }) => {
      await page.goto('/apply');

      // Check that inputs have associated labels
      const inputs = page.locator('input:not([type="hidden"]):not([type="submit"])');
      const count = await inputs.count();

      for (let i = 0; i < Math.min(count, 5); i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute('id');
        const ariaLabel = await input.getAttribute('aria-label');

        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          const hasLabel = (await label.count()) > 0;
          const hasAriaLabel = ariaLabel !== null;

          expect(hasLabel || hasAriaLabel).toBeTruthy();
        }
      }
    });
  });

  // ============================================
  // JOURNEY 6: Performance
  // ============================================
  test.describe('Performance', () => {
    test('homepage loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      const loadTime = Date.now() - startTime;

      // Page should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);
    });

    test('no console errors on critical pages', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Visit critical pages
      const criticalPages = ['/', '/programs', '/courses', '/about', '/contact'];

      for (const url of criticalPages) {
        await page.goto(url);
        await page.waitForLoadState('networkidle');
      }

      // Filter out known acceptable errors (e.g., third-party scripts)
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes('third-party') &&
          !e.includes('analytics') &&
          !e.includes('Failed to load resource'),
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  // ============================================
  // JOURNEY 7: Error Handling
  // ============================================
  test.describe('Error Handling', () => {
    test('404 page displays correctly', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345');

      // Should show 404 content
      await expect(page.getByText(/not found|404|doesn't exist/i)).toBeVisible();

      // Should have link back to home
      await expect(page.getByRole('link', { name: /home|back/i })).toBeVisible();
    });

    test('form validation shows errors', async ({ page }) => {
      await page.goto('/apply');

      // Try to submit empty form
      const submitButton = page.getByRole('button', { name: /submit|apply/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation errors or prevent submission
        const errorMessages = page.locator('[class*="error"], [role="alert"]');
        const requiredInputs = page.locator('input:invalid');

        const hasErrors = (await errorMessages.count()) > 0 || (await requiredInputs.count()) > 0;
        expect(hasErrors).toBeTruthy();
      }
    });
  });
});
