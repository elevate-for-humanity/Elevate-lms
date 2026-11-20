import { test, expect } from '@playwright/test';
import { peerOrigin } from './helpers/app-origins';

const lmsOrigin = peerOrigin('lms');

test.describe('Critical User Flows', () => {
  test.describe('Homepage', () => {
    test('should load homepage successfully', async ({ page }) => {
      await page.goto('/');
      await expect(page).toHaveTitle(/Elevate for Humanity/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    });

    test('should have working navigation', async ({ page }) => {
      await page.goto('/');

      const mainNavigation = page.getByRole('navigation', { name: 'Main navigation' });
      await expect(
        mainNavigation.getByRole('link', { name: 'Programs', exact: true }),
      ).toHaveAttribute('href', '/programs');
      await expect(
        mainNavigation.getByRole('link', { name: 'About', exact: true }),
      ).toHaveAttribute('href', '/about');
      await expect(page.getByRole('link', { name: 'Contact Us', exact: true })).toHaveAttribute(
        'href',
        '/contact',
      );
    });

    test('should have CTA buttons', async ({ page }) => {
      await page.goto('/');

      await expect(page.getByRole('link', { name: 'Apply', exact: true })).toHaveAttribute(
        'href',
        '/apply',
      );
    });
  });

  test.describe('Programs Page', () => {
    test('should display program listings', async ({ page }) => {
      await page.goto('/programs');

      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
      const hvac = main.getByRole('article').filter({ hasText: 'HVAC Certification' });
      await expect(hvac).toBeVisible();
      await expect(hvac.getByRole('link', { name: 'View Program' })).toHaveAttribute(
        'href',
        '/programs/hvac-technician',
      );
    });

    test('should navigate to individual program', async ({ page }) => {
      await page.goto('/programs');
      await page
        .getByRole('main')
        .locator('a[href="/programs/hvac-technician"]')
        .filter({ visible: true })
        .first()
        .click();

      await expect(page).toHaveURL(/\/programs\/hvac-technician(?:[?#].*)?$/);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('a[href^="/apply"]').filter({ visible: true }).first()).toBeVisible();
    });
  });

  test.describe('Contact Form', () => {
    test('should display contact form', async ({ page }) => {
      await page.goto('/contact');

      await expect(page.getByLabel(/name/i)).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/message/i)).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto('/contact');

      const submitButton = page.getByRole('button', { name: /submit|send/i });
      await submitButton.click();
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });
  });

  test.describe('Apply Page', () => {
    test('should display the canonical application form', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');

      await expect(page.getByRole('textbox', { name: 'First Name', exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Last Name', exact: true })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Email', exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
    });
  });

  test.describe('Authentication Pages', () => {
    test('should display login page', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test('should display signup page on the LMS service', async ({ page }) => {
      await page.goto(`${lmsOrigin}/signup`);
      await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
    });

    test('should have link to reset password', async ({ page }) => {
      await page.goto('/login');
      const resetLink = page.getByRole('link', { name: /forgot|reset/i });
      await expect(resetLink).toBeVisible();
    });
  });

  test.describe('Blog', () => {
    test('should display blog posts', async ({ page }) => {
      await page.goto('/blog');

      await expect(
        page.getByRole('heading', { name: 'Practical guidance for your next step.' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', {
          name: /How Indianapolis Barbershops Can Build an Apprentice Talent Pipeline/,
        }),
      ).toBeVisible();
    });
  });

  test.describe('Store', () => {
    test('should display store page', async ({ page }) => {
      await page.goto('/store');
      await expect(page).toHaveTitle(/Store/i);
    });

    test('should have cart page', async ({ page }) => {
      await page.goto('/store/cart');
      await expect(page).toHaveURL(/cart/);
    });
  });

  test.describe('LMS', () => {
    test('should display LMS landing page', async ({ page }) => {
      await page.goto('/lms');
      await expect(page).toHaveTitle(/LMS|Learning/i);
    });

    test('should have courses page', async ({ page }) => {
      await page.goto('/lms/courses');
      await expect(page).toHaveURL(/courses/);
    });
  });

  test.describe('API Health', () => {
    test('should return the current healthy service contract', async ({ request }) => {
      const response = await request.get('/api/health');
      expect(response.ok()).toBeTruthy();

      const data = await response.json();
      expect(data).toMatchObject({
        service: 'marketing',
        status: 'healthy',
        healthy: true,
        ready: true,
        configuration: { ok: true },
      });
    });
  });

  test.describe('Canonical authentication routes', () => {
    test('marketing sign-in points to the LMS login', async ({ page }) => {
      await page.goto('/');
      await expect(page.getByRole('link', { name: 'Sign In', exact: true })).toHaveAttribute(
        'href',
        `${lmsOrigin}/login`,
      );
    });

    test('the LMS reset-password page is available', async ({ page }) => {
      await page.goto(`${lmsOrigin}/reset-password`);
      await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Email' })).toBeVisible();
    });

    test('/for-employers should redirect to /employers', async ({ page }) => {
      await page.goto('/for-employers');
      await expect(page).toHaveURL(/employers/);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should be responsive on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const bodyWidth = await page.locator('body').evaluate((element) => element.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);
    });
  });
});
