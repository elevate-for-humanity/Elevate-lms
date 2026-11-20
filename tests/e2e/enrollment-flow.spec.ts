import { test, expect, type Page } from '@playwright/test';
import { peerOrigin } from './helpers/app-origins';

const lmsOrigin = peerOrigin('lms');

async function dismissCookiePreferences(page: Page) {
  const close = page.getByRole('button', {
    name: 'Close and use necessary cookies only',
    exact: true,
  });
  if (await close.isVisible().catch(() => false)) await close.click();
}

async function signInLearner(page: Page) {
  const email = process.env.E2E_LEARNER_EMAIL;
  const password = process.env.E2E_LEARNER_PASSWORD;
  if (!email || !password) throw new Error('The isolated QA learner credentials are required');

  await page.goto(lmsOrigin + '/login?redirect=%2Flms%2Fdashboard');
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/lms\/dashboard(?:[?#].*)?$/, { timeout: 60_000 });
  await expect(page.getByText('My Dashboard', { exact: true }).first()).toBeVisible({
    timeout: 60_000,
  });
}

/**
 * Canonical enrollment journey: discover a published program, open the
 * application, authenticate as the isolated approved learner, and enter LMS.
 */
test.describe('Enrollment Flow - Complete Journey', () => {
  test.describe('Discovery Phase', () => {
    test('can browse programs from homepage', async ({ page }) => {
      await page.goto('/');
      await dismissCookiePreferences(page);

      const programs = page
        .getByRole('link', { name: 'Explore Career Training', exact: true })
        .first();
      await expect(programs).toHaveAttribute('href', '/programs');
      await programs.click();
      await expect(page).toHaveURL(/\/programs(?:[?#].*)?$/);
    });

    test('can view program details', async ({ page }) => {
      await page.goto('/programs/barber-apprenticeship');

      await expect(
        page.getByRole('heading', { level: 1, name: 'Learn the trade where the work happens.' }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Apply for Barber Apprenticeship' }),
      ).toBeVisible();
    });

    test('programs page shows current training pathways', async ({ page }) => {
      await page.goto('/programs');

      const main = page.getByRole('main');
      await expect(
        main.getByRole('heading', { level: 1, name: 'Train for your next career.' }),
      ).toBeVisible();
      await expect(main.getByText('Skilled Trades', { exact: true }).first()).toBeVisible();
      for (const slug of ['hvac-technician', 'cdl-training', 'barber-apprenticeship']) {
        await expect(
          main.locator('a[href="/programs/' + slug + '"]').filter({ visible: true }).first(),
        ).toBeVisible();
      }
    });
  });

  test.describe('Application Phase', () => {
    test('can access application form', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');

      for (const name of ['First Name', 'Last Name', 'Email', 'Phone']) {
        await expect(page.getByRole('textbox', { name, exact: true })).toBeVisible();
      }
    });

    test('form validates required fields', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();

      await expect(
        page.getByText('Complete your name, date of birth, email, and phone number.'),
      ).toBeVisible();
    });

    test('can fill out application form without submitting', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');

      await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Test');
      await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill('User');
      await page.getByRole('textbox', { name: 'Email', exact: true }).fill('test@example.com');
      await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('3171234567');

      await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
    });
  });

  test.describe('Authentication Flow', () => {
    test('login page loads correctly', async ({ page }) => {
      await page.goto(lmsOrigin + '/login');

      await expect(page.getByLabel('Email address', { exact: true })).toBeVisible();
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
      await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('signup page loads correctly', async ({ page }) => {
      await page.goto(lmsOrigin + '/signup');

      await expect(page.getByRole('heading', { name: 'Create Your Account' })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    });

    test('redirects to login when accessing protected routes', async ({ page }) => {
      await page.goto(lmsOrigin + '/lms/dashboard');

      await expect(page).toHaveURL(/\/login(?:[?#].*)?$/);
    });
  });

  test.describe('Approved LMS Access', () => {
    test.beforeEach(async ({ page }) => {
      await signInLearner(page);
    });

    test('approved learner dashboard loads', async ({ page }) => {
      await expect(page.getByText('My Dashboard', { exact: true }).first()).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'My Courses', exact: true }).first(),
      ).toHaveAttribute('href', '/lms/courses');
    });

    test('approved learner can navigate LMS sections', async ({ page }) => {
      await page.locator('a[href="/lms/courses"]').filter({ visible: true }).first().click();
      await expect(page).toHaveURL(/\/lms\/courses(?:[?#].*)?$/);
      await expect(page.getByRole('heading', { name: 'My Courses', exact: true })).toBeVisible();
    });

    test('approved learner can open courses directly', async ({ page }) => {
      await page.goto(lmsOrigin + '/lms/courses');
      await expect(page).toHaveURL(/\/lms\/courses(?:[?#].*)?$/);
      await expect(page.getByRole('heading', { name: 'My Courses', exact: true })).toBeVisible();
    });
  });

  test.describe('Payment and Funding', () => {
    test('tuition page shows the published HVAC amount', async ({ page }) => {
      await page.goto('/tuition-fees');

      const hvac = page.getByRole('row', { name: /^HVAC Technician / });
      await expect(hvac.getByRole('cell', { name: 'HVAC Technician', exact: true })).toBeVisible();
      await expect(hvac.getByRole('cell', { name: '$5,000', exact: true }).first()).toBeVisible();
    });

    test('funding page links verified HVAC options to the program', async ({ page }) => {
      await page.goto('/funding');

      const hvac = page.getByRole('article').filter({ hasText: 'HVAC Certification' });
      await expect(hvac.getByText('WIOA', { exact: true })).toBeVisible();
      await expect(hvac.getByRole('link', { name: 'Review program' })).toHaveAttribute(
        'href',
        '/programs/hvac-technician',
      );
    });
  });

  test.describe('Navigation Integrity', () => {
    test('header navigation works', async ({ page }) => {
      await page.goto('/');

      const navigation = page.getByRole('navigation', { name: 'Main navigation' });
      await expect(
        navigation.getByRole('link', { name: 'Programs', exact: true }),
      ).toHaveAttribute('href', '/programs');
      await expect(page.locator('header a[href="/"]').first()).toBeVisible();
    });

    test('footer navigation works', async ({ page }) => {
      await page.goto('/');

      const footer = page.getByRole('contentinfo');
      await expect(footer.locator('a[href="/about"]').first()).toBeVisible();
      await expect(footer.locator('a[href="/contact"]').first()).toBeVisible();
    });

    test('program page exposes canonical enrollment navigation', async ({ page }) => {
      await page.goto('/programs/barber-apprenticeship');

      await expect(
        page.getByRole('link', { name: 'Apply for Barber Apprenticeship', exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole('link', { name: 'Explore Host Shops', exact: true }),
      ).toHaveAttribute('href', '/programs/barber-apprenticeship/host-shops');
    });

    test('canonical homepage links return non-error responses', async ({ page }) => {
      await page.goto('/');

      for (const href of ['/programs', '/about', '/contact', '/funding']) {
        const response = await page.request.get(href);
        expect(response.status(), href).toBeLessThan(400);
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('mobile menu works', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      await dismissCookiePreferences(page);

      const menuButton = page.getByRole('button', { name: 'Open menu', exact: true });
      await menuButton.click();
      const navigation = page.getByRole('navigation', { name: 'Site navigation' });
      await expect(navigation).toBeVisible();
      const programs = navigation.getByRole('button', { name: 'Programs', exact: true });
      await programs.click();
      await expect(programs).toHaveAttribute('aria-expanded', 'true');
    });

    test('content is readable on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');

      const bodyWidth = await page.locator('body').evaluate((element) => element.scrollWidth);
      expect(bodyWidth).toBeLessThanOrEqual(375);
    });
  });

  test.describe('Error Handling', () => {
    test('404 page shows for invalid routes', async ({ page }) => {
      const response = await page.goto('/this-page-does-not-exist-12345');

      expect(response?.status()).toBe(404);
      await expect(
        page.getByRole('heading', { name: /get you back on the right path/i }),
      ).toBeVisible();
    });

    test('homepage renders without an uncaught page error', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));

      await page.goto('/', { waitUntil: 'domcontentloaded' });
      await expect(
        page.getByRole('heading', { level: 1, name: 'Train for your next career.' }),
      ).toBeVisible();
      expect(errors).toHaveLength(0);
    });
  });
});
