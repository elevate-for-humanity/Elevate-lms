import { test, expect } from '@playwright/test';
import { peerOrigin } from './helpers/app-origins';

const lmsOrigin = peerOrigin('lms');

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

      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(main.getByRole('link', { name: /Explore programs/ })).toHaveAttribute('href', '/programs');
      await expect(main.getByRole('heading', { name: /Barber & Beauty Apprenticeships/ })).toBeVisible();
      await expect(main.getByRole('heading', { name: /Apply and get started/ })).toBeVisible();
      await expect(page.getByRole('contentinfo')).toBeVisible();
    });

    test('eligibility quiz works end-to-end', async ({ page }) => {
      await page.goto('/eligibility/quiz');
      await expect(page.getByRole('heading', { name: /WorkOne funding conversation/ })).toBeVisible();

      const questions = page.getByRole('main').getByRole('group');
      await expect(questions).toHaveCount(5);
      await expect(page.getByRole('heading', { name: /Your next step is an agency eligibility review/ })).toBeHidden();
      for (const question of await questions.all()) {
        await question.getByRole('button', { name: 'Yes', exact: true }).click();
      }
      await expect(page.getByRole('heading', { name: /Your next step is an agency eligibility review/ })).toBeVisible();
      await expect(page.getByText(/You answered yes to 5 of 5 screening questions/)).toBeVisible();
    });

    test('programs page lists the published QA programs', async ({ page }) => {
      await page.goto('/programs');
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
      for (const slug of ['barber-apprenticeship', 'business-administration', 'cdl-training', 'hvac-technician']) {
        await expect(main.locator(`a[href="/programs/${slug}"]`).filter({ visible: true }).first()).toBeVisible();
      }
    });

    test('individual program page has its title and application link', async ({ page }) => {
      await page.goto('/programs/barber-apprenticeship');
      await expect(page.getByRole('heading', { level: 1, name: 'Learn the trade where the work happens.' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Apply for Barber Apprenticeship' })).toBeVisible();
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
    test('standard intake page loads with form', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');
      await expect(page.getByRole('textbox', { name: 'First Name', exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible();
    });

    test('form validates required fields', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expect(page.getByText('Complete your name, date of birth, email, and phone number.')).toBeVisible();
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
      await page.goto(`${lmsOrigin}/signup`);
      await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible();

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
  // LMS TESTS
  // ==========================================

  test.describe('Authenticated LMS', () => {
    test.beforeEach(async ({ page }) => {
      const email = process.env.E2E_LEARNER_EMAIL;
      const password = process.env.E2E_LEARNER_PASSWORD;
      if (!email || !password) throw new Error('The isolated QA learner credentials are required');
      await page.goto(`${lmsOrigin}/login?redirect=%2Flms%2Fdashboard`);
      await page.getByLabel('Email address', { exact: true }).fill(email);
      await page.getByLabel('Password', { exact: true }).fill(password);
      await page.locator('button[type="submit"]').click();
      await expect(page).toHaveURL(/\/lms\/dashboard(?:[?#].*)?$/, { timeout: 60_000 });
      await expect(page.locator('[data-elevate-dashboard-content]:visible')).toBeVisible();
    });

    test('dashboard loads for the learner', async ({ page }) => {
      await expect(page.getByText('My Dashboard', { exact: true }).first()).toBeVisible();
    });

    test('courses page loads for the learner', async ({ page }) => {
      await page.goto(`${lmsOrigin}/lms/courses`);
      await expect(page).toHaveURL(/\/lms\/courses(?:[?#].*)?$/);
      await expect(page.getByRole('heading', { name: 'My Courses', exact: true })).toBeVisible();
    });

    test('navigation works in LMS', async ({ page }) => {
      await page.locator('a[href="/lms/courses"]').filter({ visible: true }).first().click();
      await expect(page).toHaveURL(/\/lms\/courses(?:[?#].*)?$/);
    });
  });

  // ==========================================
  // CERTIFICATE VERIFICATION TESTS
  // ==========================================

  test.describe('Certificate Verification', () => {
    test('verify page loads', async ({ page }) => {
      await page.goto('/verify');

      await expect(page.getByRole('heading', { name: 'Verify Credentials' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'How to Verify a Credential' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'info@elevateforhumanity.org' }).first()).toHaveAttribute('href', 'mailto:info@elevateforhumanity.org');
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
