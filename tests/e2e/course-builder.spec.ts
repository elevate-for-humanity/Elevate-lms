import { test, expect } from '@playwright/test';

/**
 * E2E tests for AutomaticCourseBuilder — UUID resolution and redirect.
 *
 * These tests mock the API layer so they run without a live backend.
 * They verify that:
 *   1. A valid UUID in `data.id` routes to /admin/lms/courses/{uuid}
 *   2. A valid UUID in `data.course.id` (fallback path) also routes correctly
 *   3. A valid UUID in `data.courseId` (second fallback) also routes correctly
 *   4. A response with no valid UUID shows an error and does not redirect
 */

const VALID_UUID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const COURSE_BUILDER_PATH = '/admin/lms/courses/new';

test.describe('AutomaticCourseBuilder — UUID resolution', () => {
  // Intercept all upstream AI generation endpoints so the builder can reach
  // the final save step without a real OpenAI key.
  async function mockAiEndpoints(page: import('@playwright/test').Page) {
    const outline = {
      title: 'Test Course',
      description: 'A test course',
      duration: '4 weeks',
      level: 'beginner',
      modules: [
        {
          id: 'mod-1',
          title: 'Module 1',
          description: 'Intro',
          duration: 60,
          lessons: [
            {
              id: 'les-1',
              title: 'Lesson 1',
              type: 'video',
              content: 'Content',
              duration: 30,
              objectives: ['Understand basics'],
            },
          ],
        },
      ],
    };

    await page.route('**/api/ai/generate-course-outline', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(outline) })
    );
    await page.route('**/api/ai/generate-module-content', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ lessons: outline.modules[0].lessons }),
      })
    );
    await page.route('**/api/ai/generate-assessments', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) })
    );
    await page.route('**/api/ai/generate-video-scripts', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) })
    );
  }

  async function fillAndSubmit(page: import('@playwright/test').Page) {
    await page.fill(
      'textarea',
      'Create a comprehensive HVAC technician training course covering basics to advanced troubleshooting'
    );
    await page.click('button:has-text("Generate Course")');
  }

  test('routes to /admin/lms/courses/{uuid} when id is at data.id', async ({ page }) => {
    await mockAiEndpoints(page);

    await page.route('**/api/admin/lms/courses', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: VALID_UUID }),
      })
    );

    await page.goto(COURSE_BUILDER_PATH);
    await fillAndSubmit(page);

    await page.waitForURL(`**/admin/lms/courses/${VALID_UUID}`, { timeout: 15000 });
    expect(page.url()).toContain(`/admin/lms/courses/${VALID_UUID}`);
  });

  test('routes correctly when UUID is at data.course.id', async ({ page }) => {
    await mockAiEndpoints(page);

    await page.route('**/api/admin/lms/courses', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ course: { id: VALID_UUID } }),
      })
    );

    await page.goto(COURSE_BUILDER_PATH);
    await fillAndSubmit(page);

    await page.waitForURL(`**/admin/lms/courses/${VALID_UUID}`, { timeout: 15000 });
    expect(page.url()).toContain(`/admin/lms/courses/${VALID_UUID}`);
  });

  test('routes correctly when UUID is at data.courseId', async ({ page }) => {
    await mockAiEndpoints(page);

    await page.route('**/api/admin/lms/courses', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ courseId: VALID_UUID }),
      })
    );

    await page.goto(COURSE_BUILDER_PATH);
    await fillAndSubmit(page);

    await page.waitForURL(`**/admin/lms/courses/${VALID_UUID}`, { timeout: 15000 });
    expect(page.url()).toContain(`/admin/lms/courses/${VALID_UUID}`);
  });

  test('shows error and does not redirect when response has no valid UUID', async ({ page }) => {
    await mockAiEndpoints(page);

    await page.route('**/api/admin/lms/courses', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        // Deliberately malformed — no UUID field
        body: JSON.stringify({ status: 'ok', result: 'created' }),
      })
    );

    // Capture the alert dialog
    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.goto(COURSE_BUILDER_PATH);
    await fillAndSubmit(page);

    // Wait for the alert to fire (generation completes then throws)
    await page.waitForTimeout(5000);

    expect(alertMessage).toMatch(/failed to generate course/i);
    // Must not have navigated away from the builder
    expect(page.url()).not.toContain(`/admin/lms/courses/${VALID_UUID}`);
  });

  test('rejects a non-UUID string at data.id and shows error', async ({ page }) => {
    await mockAiEndpoints(page);

    await page.route('**/api/admin/lms/courses', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'not-a-uuid' }),
      })
    );

    let alertMessage = '';
    page.on('dialog', async (dialog) => {
      alertMessage = dialog.message();
      await dialog.dismiss();
    });

    await page.goto(COURSE_BUILDER_PATH);
    await fillAndSubmit(page);

    await page.waitForTimeout(5000);

    expect(alertMessage).toMatch(/failed to generate course/i);
  });
});
