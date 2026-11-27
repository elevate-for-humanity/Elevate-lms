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

  await page.goto(`${lmsOrigin}/login?redirect=%2Flms%2Fdashboard`);
  await page.getByLabel('Email address', { exact: true }).fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.locator('button[type="submit"]').click();
  await expect(page).toHaveURL(/\/lms\/dashboard(?:[?#].*)?$/, { timeout: 60_000 });
  await expect(page.getByText('My Dashboard', { exact: true }).first()).toBeVisible();
}

/**
 * Critical user journeys across the canonical marketing, application, and LMS services.
 */
test.describe('Critical User Journeys', () => {
  test.describe('New User Application Journey', () => {
    test('complete journey: homepage → programs → apply', async ({ page }) => {
      await page.goto('/');
      await dismissCookiePreferences(page);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

      await page.getByRole('link', { name: 'Explore Career Training', exact: true }).click();
      await expect(page).toHaveURL(/\/programs(?:[?#].*)?$/);

      const hvac = page.getByRole('main').getByRole('article').filter({
        hasText: 'HVAC Certification',
      });
      await hvac.getByRole('link', { name: 'View Program' }).click();
      await expect(page).toHaveURL(/\/programs\/hvac-technician(?:[?#].*)?$/);

      const apply = page.locator('a[href^="/apply"]').filter({ visible: true }).first();
      await expect(apply).toBeVisible();
      await apply.click();
      await expect(page).toHaveURL(/\/apply(?:[/?#].*)?$/);
    });

    test('canonical inquiry form is usable without submitting', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');

      await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Test');
      await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill('User');
      await page.getByRole('textbox', { name: 'Email', exact: true }).fill('test@example.com');
      await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('3171234567');
      await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
    });
  });

  test.describe('Student Learning Journey', () => {
    test.beforeEach(async ({ page }) => {
      await signInLearner(page);
    });

    test('approved learner dashboard loads', async ({ page }) => {
      await expect(page.getByText('My Dashboard', { exact: true }).first()).toBeVisible();
      await expect(page.getByRole('link', { name: 'My Courses', exact: true }).first()).toHaveAttribute(
        'href',
        /\/lms\/courses(?:[?#].*)?$/,
      );
    });

    test('approved learner can open courses', async ({ page }) => {
      await page.goto(`${lmsOrigin}/lms/courses`);
      await expect(page).toHaveURL(/\/lms\/courses(?:[?#].*)?$/);
      await expect(page.getByRole('heading', { name: 'My Courses', exact: true })).toBeVisible();
    });
  });

  test.describe('Contact & Support Journey', () => {
    test('contact page loads with all information', async ({ page }) => {
      await page.goto('/contact');

      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.locator('form').first()).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    test('about page loads correctly', async ({ page }) => {
      await page.goto('/about');

      await expect(
        page.getByRole('heading', { level: 1, name: 'People. Skills. Opportunity.' }),
      ).toBeVisible();
      await expect(page.locator('#mission').getByText(/Our mission is to expand access/)).toBeVisible();
    });
  });

  test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 375, height: 667 } });

    test('mobile navigation works', async ({ page }) => {
      await page.goto('/');

      const menuButton = page.getByRole('button', { name: 'Open menu', exact: true });
      await menuButton.click();
      const navigation = page.getByRole('navigation', { name: 'Mobile navigation' });
      await expect(navigation).toBeVisible();
      const programs = navigation.getByRole('button', { name: 'Programs', exact: true });
      await programs.click();
      await expect(programs).toHaveAttribute('aria-expanded', 'true');
      await expect(navigation.locator('a[href="/programs"]').first()).toBeVisible();
    });

    test('mobile application form is usable', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');

      const firstName = page.getByRole('textbox', { name: 'First Name', exact: true });
      await expect(firstName).toBeVisible();
      const box = await firstName.boundingBox();
      expect(box?.width).toBeGreaterThan(200);
    });
  });

  test.describe('Accessibility', () => {
    test('homepage is keyboard navigable', async ({ page }) => {
      await page.goto('/');
      await page.keyboard.press('Tab');

      const skipLink = page.getByText(/skip to/i);
      await expect(skipLink).toBeFocused();
      for (let i = 0; i < 5; i++) await page.keyboard.press('Tab');
      await expect(page.locator(':focus')).toBeVisible();
    });

    test('images have alt text or are decorative', async ({ page }) => {
      await page.goto('/');

      const images = page.locator('img');
      const count = await images.count();
      for (let i = 0; i < Math.min(count, 10); i++) {
        const image = images.nth(i);
        const alt = await image.getAttribute('alt');
        const ariaHidden = await image.getAttribute('aria-hidden');
        expect(alt !== null || ariaHidden === 'true').toBeTruthy();
      }
    });

    test('application inputs have associated labels', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');

      for (const name of ['First Name', 'Last Name', 'Email', 'Phone']) {
        await expect(page.getByRole('textbox', { name, exact: true })).toBeVisible();
      }
    });
  });

  test.describe('Performance', () => {
    test('homepage loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto('/');
      expect(Date.now() - startTime).toBeLessThan(5000);
    });

    test('no console errors on current marketing pages', async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });

      for (const url of ['/', '/programs', '/about', '/contact']) {
        await page.goto(url, { waitUntil: 'domcontentloaded' });
      }

      const criticalErrors = errors.filter(
        (error) =>
          !error.includes('third-party') &&
          !error.includes('analytics') &&
          !error.includes('Failed to load resource'),
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });

  test.describe('Error Handling', () => {
    test('404 page displays correctly', async ({ page }) => {
      await page.goto('/this-page-does-not-exist-12345');

      await expect(page.getByRole('heading', { name: /get you back on the right path/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Return to homepage/i })).toHaveAttribute(
        'href',
        '/',
      );
    });

    test('application validation shows an error without submitting', async ({ page }) => {
      await page.goto('/apply/student/form?intent=inquiry');
      await page.getByRole('button', { name: 'Continue', exact: true }).click();
      await expect(page.getByText('Complete your name, date of birth, email, and phone number.')).toBeVisible();
    });
  });
});
