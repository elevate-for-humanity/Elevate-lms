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
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Confirm Password', { exact: true })).toBeVisible();
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
      await expect(page.getByText('My Dashboard', { exact: true }).first()).toBeVisible();
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
      const courses = page.getByRole('link', { name: 'My Courses', exact: true }).filter({ visible: true }).first();
      await expect(courses).toBeVisible();
      const target = new URL((await courses.getAttribute('href')) ?? '', lmsOrigin);
      expect(target.origin).toBe(new URL(lmsOrigin).origin);
      expect(target.pathname).toBe('/lms/courses');
      await courses.click();
      await expect(page).toHaveURL(url => url.origin === target.origin && url.pathname === '/lms/courses');
      await expect(page.getByRole('heading', { name: 'My Courses', exact: true })).toBeVisible();
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

    test('unknown credential does not render a verified record', async ({ page }) => {
      const response = await page.goto('/verify/INVALID-CODE-1234');
      expect([200, 404]).toContain(response?.status());
      await expect(page.getByRole('heading', { name: /get you back on the right path/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: /Certificate Verified/ })).toBeHidden();
    });
  });

  // ==========================================
  // API ENDPOINT TESTS
  // ==========================================

  test.describe('API Endpoints', () => {
    test('public outcomes methodology is available', async ({ page }) => {
      const response = await page.goto('/outcomes');
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'Outcomes & Methodology' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'How We Calculate Outcomes' })).toBeVisible();
    });

    test('checkout gateway rejects an invalid request before calling a payment provider', async ({ request }) => {
      const response = await request.post('/api/checkout', { data: {} });
      expect(response.status()).toBe(400);
      expect(await response.json()).toMatchObject({ error: 'Invalid checkout request.', issues: expect.any(Array) });
    });

    test('learner enrollment API rejects an unauthenticated request', async ({ request }) => {
      const response = await request.get(`${lmsOrigin}/api/enrollments/me`, { maxRedirects: 0 });
      expect(response.status()).toBe(401);
      expect(await response.json()).toMatchObject({ error: 'Unauthorized' });
    });
  });

  // ==========================================
  // PAYMENT FLOW TESTS
  // ==========================================

  test.describe('Payment Flow', () => {
    test('tuition page shows pricing', async ({ page }) => {
      await page.goto('/tuition-fees');

      const hvac = page.getByRole('row', { name: /^HVAC Technician / });
      await expect(hvac.getByRole('cell', { name: 'HVAC Technician', exact: true })).toBeVisible();
      await expect(hvac.getByRole('cell', { name: '$5,000', exact: true }).nth(0)).toBeVisible();
      await expect(hvac.getByRole('cell', { name: '$5,000', exact: true }).nth(1)).toBeVisible();
    });

    test('funding page shows verified HVAC funding options', async ({ page }) => {
      await page.goto('/funding');

      const hvac = page.getByRole('article').filter({
        has: page.getByRole('heading', { name: 'HVAC Certification', exact: true }),
      });
      await expect(hvac.getByText('WIOA', { exact: true })).toBeVisible();
      await expect(hvac.getByRole('link', { name: 'Review program' })).toHaveAttribute('href', '/programs/hvac-technician');
    });
  });

  // ==========================================
  // RESPONSIVE DESIGN TESTS
  // ==========================================

  test.describe('Responsive Design', () => {
    test('mobile navigation works', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const menuButton = page.getByRole('button', { name: 'Open menu', exact: true });
      await expect(menuButton).toBeEnabled();
      await menuButton.click();
      const navigation = page.getByRole('navigation', { name: 'Site navigation' });
      await expect(navigation).toBeVisible();
      const programs = navigation.getByRole('button', { name: 'Programs', exact: true });
      await programs.click();
      await expect(programs).toHaveAttribute('aria-expanded', 'true');
      await expect(navigation.locator('a[href="/programs"]').first()).toBeVisible();
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

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { level: 1, name: 'Train for your next career.' })).toBeVisible();
      await expect(page.locator('.skip-to-main')).toHaveAttribute('data-interactive', 'true');

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
      await page.goto('/programs/barber-apprenticeship');
      await expect(page).toHaveTitle(/Barber Apprenticeship/i);
      const barberTitle = await page.title();

      await page.goto('/programs/cdl-training');
      await expect(page).toHaveTitle(/CDL/i);
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
