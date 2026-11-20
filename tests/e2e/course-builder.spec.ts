import { test, expect, type Page } from '@playwright/test';

/**
 * Browser acceptance for the canonical Course Production Studio.
 *
 * The retired /admin/lms/courses/new surface no longer exists. These tests
 * exercise the current /studio/courses route and its saved course selection,
 * tab navigation, slug compatibility, fallback, and inventory refresh.
 */

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const SECOND_UUID = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';
const COURSE_BUILDER_PATH = '/studio/courses';

async function loginAsAdmin(page: Page) {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('TEST_ADMIN_EMAIL / TEST_ADMIN_PASSWORD not set');

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 30_000 });
}

async function mockCourseInventory(page: Page, onRead?: () => void) {
  await page.route('**/api/admin/courses', (route) => {
    onRead?.();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: VALID_UUID,
          title: 'HVAC Technician',
          slug: 'hvac-technician',
          description: 'Heating and cooling fundamentals',
          program_id: 'program-hvac',
          status: 'draft',
        },
        {
          id: SECOND_UUID,
          title: 'Barber Apprenticeship',
          slug: 'barber-apprenticeship',
          description: 'Barber theory and practical training',
          program_id: 'program-barber',
          status: 'published',
        },
      ]),
    });
  });
  await page.route('**/api/admin/dev-studio/programs', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        data: [
          { id: 'program-hvac', title: 'HVAC', slug: 'hvac-technician', status: 'active' },
          {
            id: 'program-barber',
            title: 'Barber Apprenticeship',
            slug: 'barber-apprenticeship',
            status: 'active',
          },
        ],
      }),
    }),
  );
}

test.describe('Course Production Studio — canonical route and selection', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('loads the requested saved course by UUID', async ({ page }) => {
    await mockCourseInventory(page);
    await page.goto(`${COURSE_BUILDER_PATH}?courseId=${VALID_UUID}&tab=courses`);

    await expect(page.getByRole('heading', { name: 'Course Production Studio' })).toBeVisible();
    await expect(page.locator('#ultimate-course-selector')).toHaveValue(VALID_UUID);
    await expect(page.locator('#ultimate-course-selector option:checked')).toContainText(
      'HVAC Technician',
    );
  });

  test('resolves a saved course slug to its canonical UUID', async ({ page }) => {
    await mockCourseInventory(page);
    await page.goto(`${COURSE_BUILDER_PATH}?courseId=barber-apprenticeship&tab=courses`);

    await expect(page.locator('#ultimate-course-selector')).toHaveValue(SECOND_UUID);
    await expect(page.locator('#ultimate-course-selector option:checked')).toContainText(
      'Barber Apprenticeship',
    );
  });

  test('falls back to the first saved course for an unknown selection', async ({ page }) => {
    await mockCourseInventory(page);
    await page.goto(`${COURSE_BUILDER_PATH}?courseId=missing-course&tab=courses`);

    await expect(page.locator('#ultimate-course-selector')).toHaveValue(VALID_UUID);
  });

  test('keeps canonical tab navigation in the Studio URL', async ({ page }) => {
    await mockCourseInventory(page);
    await page.goto(`${COURSE_BUILDER_PATH}?courseId=${VALID_UUID}&tab=courses`);

    await page.getByRole('button', { name: 'Credential Registry', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`^.+/studio/courses\\?.*courseId=${VALID_UUID}.*tab=registry`));
  });

  test('refreshes inventory without losing the selected course', async ({ page }) => {
    let inventoryReads = 0;
    await mockCourseInventory(page, () => {
      inventoryReads += 1;
    });
    await page.goto(`${COURSE_BUILDER_PATH}?courseId=${SECOND_UUID}&tab=courses`);
    await expect(page.locator('#ultimate-course-selector')).toHaveValue(SECOND_UUID);

    await page.getByRole('button', { name: 'Refresh', exact: true }).click();

    await expect.poll(() => inventoryReads).toBeGreaterThanOrEqual(2);
    await expect(page.locator('#ultimate-course-selector')).toHaveValue(SECOND_UUID);
  });
});
