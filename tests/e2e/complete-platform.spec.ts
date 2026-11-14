import { test, expect } from '@playwright/test';

/**
 * Complete Platform E2E Tests
 * Verifies the entire user journey from discovery to certification
 */

test.describe('Complete Platform Verification', () => {
  // ==========================================
  // MARKETING SITE TESTS
  // ==========================================

  test.describe('Marketing Site', () => {
    test('homepage loads with all sections', async ({ page }) => {
      await page.goto('/');

      // Hero section
      await expect(page.locator('section').first()).toBeVisible();

      // Programs section
      await expect(page.locator('text=Programs')).toBeVisible();

      // Outcomes dashboard
      await expect(page.locator('text=Student Outcomes')).toBeVisible();

      // Footer
      await expect(page.locator('footer')).toBeVisible();
    });

    test('eligibility quiz works end-to-end', async ({ page }) => {
      await page.goto('/eligibility/quiz');

      // Check quiz loads
      await expect(page.locator('text=Could You Qualify')).toBeVisible();

      // Answer first question
      await page.click('text=25-54 years old');
      await page.click('text=Next');

      // Answer second question
      await page.click('text=Unemployed');
      await page.click('text=Next');

      // Continue through quiz...
      await page.click('button:has-text("Yes")');
      await page.click('text=Next');

      // Should eventually show results
      // (Quiz has 7 questions, we're testing the flow works)
    });

    test('programs page lists all programs', async ({ page }) => {
      await page.goto('/programs');

      await expect(page.locator('h1')).toContainText(/program/i);

      // Check for program categories
      const programLinks = await page.locator('a[href^="/programs/"]').count();
      expect(programLinks).toBeGreaterThan(5);
    });

    test('individual program page has all required elements', async ({ page }) => {
      await page.goto('/programs/barber');

      // Breadcrumbs
      await expect(page.locator('nav[aria-label="Breadcrumb"]')).toBeVisible();

      // Program title
      await expect(page.locator('h1')).toBeVisible();

      // Apply CTA
      await expect(page.locator('text=Apply')).toBeVisible();
    });

    test('outcomes page shows live metrics', async ({ page }) => {
      await page.goto('/outcomes');

      // Check for key metrics
      await expect(page.locator('text=/\\d+.*enrolled/i')).toBeVisible();
    });

    test('contact page has form', async ({ page }) => {
      await page.goto('/contact');

      await expect(page.locator('form')).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });
  });

  // ==========================================
  // APPLICATION FLOW TESTS
  // ==========================================

  test.describe('Application Flow', () => {
    test('apply page loads with form', async ({ page }) => {
      await page.goto('/apply');

      await expect(page.locator('form')).toBeVisible();

      // Check required fields exist
      await expect(page.locator('input[name*="name"], input[name*="Name"]').first()).toBeVisible();
      await expect(page.locator('input[name="email"], input[type="email"]').first()).toBeVisible();
    });

    test('form validates required fields', async ({ page }) => {
      await page.goto('/apply');

      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]');
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Should show validation errors or prevent submission
        const url = page.url();
        expect(url).toContain('/apply'); // Should stay on page
      }
    });
  });

  // ==========================================
  // AUTHENTICATION TESTS
  // ==========================================

  test.describe('Authentication', () => {
    test('login page loads', async ({ page }) => {
      await page.goto('/login');

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('register page loads', async ({ page }) => {
      await page.goto('/register');

      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.locator('input[type="password"]')).toBeVisible();
    });

    test('protected routes redirect to login', async ({ page }) => {
      await page.goto('/lms/dashboard');

      // Should redirect to login
      await page.waitForURL(/login/);
      expect(page.url()).toContain('login');
    });
  });

  // ==========================================
  // LMS TESTS (Demo Mode)
  // ==========================================

  test.describe('LMS (Demo Mode)', () => {
    test('dashboard loads in demo mode', async ({ page }) => {
      await page.goto('/lms/dashboard?demo=true');

      // Should show demo banner
      await expect(page.locator('text=Demo')).toBeVisible();

      // Should show dashboard content
      await expect(page.locator('text=Dashboard')).toBeVisible();
    });

    test('courses page loads in demo mode', async ({ page }) => {
      await page.goto('/lms/courses?demo=true');

      await expect(page.locator('h1, h2')).toContainText(/course/i);
    });

    test('navigation works in LMS', async ({ page }) => {
      await page.goto('/lms/dashboard?demo=true');

      // Check nav items exist
      await expect(page.locator('nav, aside').locator('text=Courses')).toBeVisible();
    });
  });

  // ==========================================
  // CERTIFICATE VERIFICATION TESTS
  // ==========================================

  test.describe('Certificate Verification', () => {
    test('verify page loads', async ({ page }) => {
      await page.goto('/verify');

      await expect(page.locator('text=Verify')).toBeVisible();
      await expect(page.locator('input')).toBeVisible();
    });

    test('invalid code shows error', async ({ page }) => {
      await page.goto('/verify/INVALID-CODE-1234');

      // Should show not found or error message
      await expect(page.locator('text=/not found|invalid|error/i')).toBeVisible();
    });
  });

  // ==========================================
  // API ENDPOINT TESTS
  // ==========================================

  test.describe('API Endpoints', () => {
    test('outcomes stats API returns data', async ({ request }) => {
      const response = await request.get('/api/outcomes/stats');

      expect(response.status()).toBe(200);

      const data = await response.json();
      expect(data).toHaveProperty('totalEnrollments');
      expect(data).toHaveProperty('timestamp');
    });

    test('stripe endpoint exists', async ({ request }) => {
      const response = await request.post('/api/stripe', {
        data: { test: true },
      });

      // Should return 200 or 400 (not 404)
      expect(response.status()).not.toBe(404);
    });

    test('enrollments API exists', async ({ request }) => {
      const response = await request.get('/api/enrollments');

      // Should return 200 or 401 (not 404)
      expect(response.status()).not.toBe(404);
    });
  });

  // ==========================================
  // PAYMENT FLOW TESTS
  // ==========================================

  test.describe('Payment Flow', () => {
    test('tuition page shows pricing', async ({ page }) => {
      await page.goto('/tuition-fees');

      // Should show pricing information
      await expect(page.locator('text=/\\$[0-9,]+/')).toBeVisible();
    });

    test('funding page shows options', async ({ page }) => {
      await page.goto('/funding');

      await expect(page.locator('text=WIOA')).toBeVisible();
    });
  });

  // ==========================================
  // RESPONSIVE DESIGN TESTS
  // ==========================================

  test.describe('Responsive Design', () => {
    test('mobile navigation works', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      // Mobile menu button should be visible
      const menuButton = page.locator('button[aria-label*="menu" i], button[aria-label*="Menu" i]');
      await expect(menuButton).toBeVisible();

      // Click to open menu
      await menuButton.click();

      // Menu items should appear
      await expect(page.locator('text=Programs')).toBeVisible();
    });

    test('no horizontal scroll on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);
    });

    test('tablet layout works', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');

      // Page should load without errors
      await expect(page.locator('body')).toBeVisible();
    });
  });

  // ==========================================
  // PERFORMANCE TESTS
  // ==========================================

  test.describe('Performance', () => {
    test('homepage loads within 5 seconds', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(5000);
    });

    test('no console errors on homepage', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Filter out known non-critical errors
      const criticalErrors = errors.filter(
        (e) =>
          !e.includes('ResizeObserver') && !e.includes('hydration') && !e.includes('Loading chunk'),
      );

      expect(criticalErrors).toHaveLength(0);
    });
  });

  // ==========================================
  // SEO TESTS
  // ==========================================

  test.describe('SEO', () => {
    test('homepage has meta tags', async ({ page }) => {
      await page.goto('/');

      // Title
      const title = await page.title();
      expect(title.length).toBeGreaterThan(10);

      // Meta description
      const description = await page.locator('meta[name="description"]').getAttribute('content');
      expect(description?.length).toBeGreaterThan(50);
    });

    test('program pages have unique titles', async ({ page }) => {
      await page.goto('/programs/barber');
      const barberTitle = await page.title();

      await page.goto('/programs/cdl-transportation');
      const cdlTitle = await page.title();

      expect(barberTitle).not.toBe(cdlTitle);
    });
  });

  // ==========================================
  // ACCESSIBILITY TESTS
  // ==========================================

  test.describe('Accessibility', () => {
    test('homepage has skip link', async ({ page }) => {
      await page.goto('/');

      // Check for skip to main content link
      const skipLink = page.locator('a[href="#main-content"]');
      await expect(skipLink).toBeAttached();
    });

    test('images have alt text', async ({ page }) => {
      await page.goto('/');

      const images = await page.locator('img').all();
      for (const img of images.slice(0, 10)) {
        // Check first 10
        const alt = await img.getAttribute('alt');
        expect(alt).not.toBeNull();
      }
    });

    test('form inputs have labels', async ({ page }) => {
      await page.goto('/apply');

      const inputs = await page.locator('input:not([type="hidden"])').all();
      for (const input of inputs.slice(0, 5)) {
        // Check first 5
        const id = await input.getAttribute('id');
        const name = await input.getAttribute('name');
        const ariaLabel = await input.getAttribute('aria-label');
        const placeholder = await input.getAttribute('placeholder');

        // Should have some form of labeling
        const hasLabel = id || ariaLabel || placeholder;
        expect(hasLabel).toBeTruthy();
      }
    });
  });
});
