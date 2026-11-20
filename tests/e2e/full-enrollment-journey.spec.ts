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

async function signInApprovedLearner(page: Page) {
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
 * Current non-mutating enrollment acceptance. The suite follows the canonical
 * inquiry, authentication, funding, and approved-learner paths without creating
 * an account, submitting an application, or initiating checkout.
 */
test.describe('Full Enrollment Journey: Discover → Apply → Auth → Learn', () => {
  test('Phase 1: program discovery uses the published route', async ({ page }) => {
    await page.goto('/');
    await dismissCookiePreferences(page);

    const programs = page.getByRole('link', {
      name: 'Explore Career Training',
      exact: true,
    });
    await expect(programs).toHaveAttribute('href', '/programs');
    await programs.click();
    await expect(page).toHaveURL(/\/programs(?:[?#].*)?$/);

    const barber = page
      .getByRole('main')
      .locator('a[href="/programs/barber-apprenticeship"]')
      .filter({ visible: true })
      .first();
    await expect(barber).toBeVisible();
    await barber.click();
    await expect(page).toHaveURL(/\/programs\/barber-apprenticeship(?:[?#].*)?$/);
    await expect(
      page.getByRole('heading', {
        level: 1,
        name: 'Learn the trade where the work happens.',
      }),
    ).toBeVisible();
  });

  test('Phase 2: application landing separates inquiry from enrollment', async ({ page }) => {
    await page.goto('/apply');

    await expect(
      page.getByRole('heading', { name: 'Choose your application', level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Intake Application' })).toHaveAttribute(
      'href',
      '/apply/student?intent=inquiry',
    );
    await expect(
      page.getByRole('link', { name: 'Full Enrollment Application' }),
    ).toHaveAttribute('href', '/programs');
  });

  test('Phase 3: canonical inquiry form is usable without submission', async ({ page }) => {
    await page.goto('/apply/student/form?intent=inquiry');

    await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('E2E');
    await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill('Test User');
    await page
      .getByRole('textbox', { name: 'Email', exact: true })
      .fill('e2e-test@example.com');
    await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('3175550123');
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeEnabled();
  });

  test('Phase 4: LMS authentication routes expose accessible forms', async ({ page }) => {
    await page.goto(lmsOrigin + '/signup');
    await expect(
      page.getByRole('heading', { name: 'Create Your Account', level: 1 }),
    ).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();

    await page.goto(lmsOrigin + '/login');
    await expect(page.getByLabel('Email address', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('Phase 5: program and funding paths expose current choices', async ({ page }) => {
    await page.goto('/programs/barber-apprenticeship');
    await expect(
      page.getByRole('link', { name: 'Apply for Barber Apprenticeship', exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'Compare payment choices' })).toHaveAttribute(
      'href',
      '#barber-payment-heading',
    );

    await page.goto('/funding');
    const hvac = page.getByRole('article').filter({ hasText: 'HVAC Certification' });
    await expect(hvac.getByText('WIOA', { exact: true })).toBeVisible();
    await expect(hvac.getByRole('link', { name: 'Review program' })).toHaveAttribute(
      'href',
      '/programs/hvac-technician',
    );
  });

  test('Phase 6: approved learner can reopen dashboard and courses', async ({ page }) => {
    await signInApprovedLearner(page);

    await expect(
      page.getByRole('link', { name: 'My Courses', exact: true }).first(),
    ).toHaveAttribute('href', '/lms/courses');
    await page.goto(lmsOrigin + '/lms/courses');
    await expect(page).toHaveURL(/\/lms\/courses(?:[?#].*)?$/);
    await expect(page.getByRole('heading', { name: 'My Courses', exact: true })).toBeVisible();
  });
});

test.describe('Enrollment Journey Guardrails', () => {
  test('required inquiry fields reject an empty continuation', async ({ page }) => {
    await page.goto('/apply/student/form?intent=inquiry');
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
    await expect(
      page.getByText('Complete your name, date of birth, email, and phone number.'),
    ).toBeVisible();
  });

  test('unauthenticated LMS access redirects to login', async ({ page }) => {
    await page.goto(lmsOrigin + '/lms/dashboard');
    await expect(page).toHaveURL(/\/login(?:[?#].*)?$/);
  });

  test('unknown program returns the canonical 404', async ({ page }) => {
    const response = await page.goto('/programs/nonexistent-program-12345');
    expect(response?.status()).toBe(404);
    await expect(
      page.getByRole('heading', { name: /get you back on the right path/i }),
    ).toBeVisible();
  });

  test('inquiry and login forms are keyboard reachable', async ({ page }) => {
    await page.goto('/apply/student/form?intent=inquiry');
    await page.keyboard.press('Tab');
    await expect(page.locator(':focus')).toBeVisible();

    await page.goto(lmsOrigin + '/login');
    await expect(page.getByLabel('Email address', { exact: true })).toBeVisible();
    await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveAccessibleName(/sign in/i);
  });

  test('enrollment surfaces do not overflow a phone viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    for (const url of [
      '/apply',
      '/apply/student/form?intent=inquiry',
      lmsOrigin + '/login',
      '/funding',
    ]) {
      await page.goto(url);
      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.scrollWidth, url).toBeLessThanOrEqual(dimensions.clientWidth + 20);
    }
  });
});
