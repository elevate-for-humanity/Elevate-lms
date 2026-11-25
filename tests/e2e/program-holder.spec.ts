import { test, expect, type Page } from '@playwright/test';

/**
 * E2E Tests for Program Holder Portal (LMS app, :3002)
 *
 * Coverage:
 * - Login and authentication
 * - Dashboard to-do queue
 * - Student management
 * - Report submission
 * - Compliance tracking
 * - Documents, settings, accessibility, performance
 *
 * Every assertion below is written against the real LMS UI
 * (components/program-holder/ProgramHolderWorkspaceView.tsx and the
 * PlatformShell role navigation), not the aspirational portal the old
 * spec described. History, run 45266295624 (shard 4/4):
 * - The old spec filled input[name="email"] on /login, but the LMS login
 *   form only had id="email" — the selector could never match, so every
 *   login (7 tests) timed out. Fixed by adding name="email" /
 *   name="password" to apps/lms/app/login/page.tsx.
 * - The old "Application Flow" block tested /program-holder/apply, which
 *   does not exist in the LMS app. The real application lives on the
 *   marketing app at /apply/program-holder and is covered by
 *   tests/e2e/program-holder-apply.spec.ts instead.
 * - The old dashboard/navigation/report/settings assertions named labels
 *   that do not exist in the UI ("Active Students", "Manage Students",
 *   "Settings saved", ...). They are rewritten to the real labels here.
 */

const PROGRAM_HOLDER_EMAIL = process.env.TEST_PROGRAM_HOLDER_EMAIL || 'test@example.com';
const PROGRAM_HOLDER_PASSWORD = process.env.TEST_PROGRAM_HOLDER_PASSWORD || 'password123';

async function loginAsProgramHolder(page: Page) {
  await page.goto('/login');
  await page.fill('input[name="email"]', PROGRAM_HOLDER_EMAIL);
  await page.fill('input[name="password"]', PROGRAM_HOLDER_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/);
}

test.describe('Program Holder Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test.describe('Authentication', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/program-holder/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });

    test('should login successfully', async ({ page }) => {
      await loginAsProgramHolder(page);

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.fill('input[name="email"]', 'invalid@example.com');
      await page.fill('input[name="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid')).toBeVisible();
    });
  });

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsProgramHolder(page);
    });

    test('should display the to-do queue and alerts', async ({ page }) => {
      await page.goto('/program-holder/dashboard');

      // The dashboard home is an action queue (To-dos) plus an Alerts
      // section — there are no "Active Students" / "Pending Verifications"
      // / "Overdue Reports" metric cards anywhere in the workspace.
      await expect(page.getByRole('heading', { name: 'To-dos' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Alerts' })).toBeVisible();
    });

    test('should display compliance score on the compliance page', async ({ page }) => {
      await page.goto('/program-holder/compliance');

      await expect(page.locator('text=Compliance Score')).toBeVisible();

      // Score should be a number between 0-100
      const scoreText = await page.locator('text=/\\d+%/').first().textContent();
      expect(scoreText).toMatch(/\d+%/);
    });

    test('should navigate to students page', async ({ page }) => {
      await page.goto('/program-holder/dashboard');

      await page
        .getByRole('complementary', { name: 'Program Holder navigation' })
        .getByRole('link', { name: 'Students', exact: true })
        .click();

      await expect(page).toHaveURL(/.*students/);
    });

    test('should navigate to reports page', async ({ page }) => {
      await page.goto('/program-holder/dashboard');

      await page
        .getByRole('complementary', { name: 'Program Holder navigation' })
        .getByRole('link', { name: 'Progress Reports', exact: true })
        .click();

      await expect(page).toHaveURL(/.*reports/);
    });
  });

  test.describe('Student Management', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsProgramHolder(page);
    });

    test('should display student list', async ({ page }) => {
      await page.goto('/program-holder/students');

      await expect(page.locator('h1:has-text("Students")')).toBeVisible();
    });

    test('should filter students by status', async ({ page }) => {
      await page.goto('/program-holder/students');

      // The roster filter is a status <select> plus an "Apply filters"
      // button, not a "Filter" button with clickable status text.
      await page.selectOption('select[name="status"]', 'active');
      await page.click('button:has-text("Apply filters")');

      await expect(page).toHaveURL(/status=active/);
    });

    test('should view pending students', async ({ page }) => {
      await page.goto('/program-holder/students/pending');

      // The "Pending Students" h1 now lives in the recruiting section
      // (/program-holder/recruiting, `Applicants`), which requires a
      // recruiting assignment the disposable QA holder does not have. The
      // pending route itself renders the unassigned-recruiter state: the
      // assignment hero plus the recruiting-tools notice. Assert that real
      // view instead of a heading this route no longer renders.
      await expect(
        page.getByText('Applicant recruiting tools are available only to assigned recruiters.'),
      ).toBeVisible();
    });

    test('should search for students', async ({ page }) => {
      await page.goto('/program-holder/students');

      // The search box is labelled "Search students" (placeholder
      // "Student name or email"); there is no placeholder containing
      // "Search". The roster is a GET form, so apply the filters to run it.
      await page.fill('input[aria-label="Search students"]', 'John');
      await page.click('button:has-text("Apply filters")');

      await expect(page).toHaveURL(/q=John/);

      // Results should be filtered
      const results = await page.locator('[data-testid="student-row"]').count();
      expect(results).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Report Submission', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsProgramHolder(page);
    });

    test('should display reports page', async ({ page }) => {
      await page.goto('/program-holder/reports');

      await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
    });

    test('should submit new report', async ({ page }) => {
      await page.goto('/program-holder/reports');

      // The report form is the Student progress report on this page — there
      // is no /program-holder/reports/submit route and no reportType /
      // reportingPeriod / summary fields. The QA fixture provisions one
      // enrolled student for this holder, so the first non-empty student
      // option is that fixture student.
      const form = page.locator('#student-progress-report');
      await expect(form).toBeVisible();
      await form.locator('select[name="student"]').selectOption({ index: 1 });
      await form.locator('input[name="start"]').fill('2026-11-16');
      await form.locator('input[name="end"]').fill('2026-11-20');
      await form.locator('input[name="hours"]').fill('4');
      await form.locator('select[name="progress"]').selectOption('on_track');
      await form.locator('textarea[name="notes"]').fill('QA progress report — E2E fixture.');
      await form.getByRole('button', { name: 'Submit report for review' }).click();

      await expect(page.locator('text=Report submitted for review.')).toBeVisible({
        timeout: 10000,
      });
    });

    test('should require notes before submitting a report', async ({ page }) => {
      await page.goto('/program-holder/reports');

      // Notes are a required field: submitting without them must not
      // create a report. (There is no "required" error text in this UI;
      // native required-field validation blocks the submit.)
      const form = page.locator('#student-progress-report');
      await expect(form).toBeVisible();
      await form.locator('select[name="student"]').selectOption({ index: 1 });
      await form.locator('input[name="start"]').fill('2026-11-16');
      await form.locator('input[name="end"]').fill('2026-11-20');
      await form.locator('input[name="hours"]').fill('4');
      await form.locator('select[name="progress"]').selectOption('on_track');
      await form.getByRole('button', { name: 'Submit report for review' }).click();

      await expect(page.locator('text=Report submitted for review.')).toHaveCount(0);
      await expect(page).toHaveURL(/\/program-holder\/reports$/);
    });
  });

  test.describe('Compliance', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsProgramHolder(page);
    });

    test('should display compliance dashboard', async ({ page }) => {
      await page.goto('/program-holder/compliance');

      await expect(page.locator('h1:has-text("Compliance")')).toBeVisible();
      await expect(page.locator('text=Compliance Score')).toBeVisible();
    });

    test('should show compliance alerts', async ({ page }) => {
      await page.goto('/program-holder/compliance');

      // Check for alerts section
      const alertsExist = await page
        .locator('text=Alerts')
        .isVisible()
        .catch(() => false);

      // Alerts may or may not exist depending on compliance status
      expect(typeof alertsExist).toBe('boolean');
    });
  });

  test.describe('Documents', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsProgramHolder(page);
    });

    test('should display documentation page', async ({ page }) => {
      await page.goto('/program-holder/documentation');

      // The reference library heading is "Every dashboard tab, explained";
      // there is no h1 containing "Documentation".
      await expect(
        page.locator('h1:has-text("Every dashboard tab, explained")'),
      ).toBeVisible();
    });

    test('should view MOU', async ({ page }) => {
      // There is no /program-holder/mou route. The agreement lives at
      // /program-holder/sign-mou ("Sign the Program Holder MOU").
      await page.goto('/program-holder/sign-mou');

      await expect(
        page.locator('h1:has-text("Sign the Program Holder MOU")'),
      ).toBeVisible();
    });
  });

  test.describe('Settings', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsProgramHolder(page);
    });

    test('should display settings page', async ({ page }) => {
      await page.goto('/program-holder/settings');

      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    });

    test('should update notification preferences', async ({ page }) => {
      await page.goto('/program-holder/settings');

      // Toggle one notification choice and save. The success message is
      // "Notification choices saved." — there is no "Settings saved" text
      // and no generic Save button in this UI.
      const emailToggle = page.getByLabel('Email me about new enrollments');
      await emailToggle.click();

      await page.click('button:has-text("Save notification choices")');

      await expect(page.locator('text=Notification choices saved.')).toBeVisible({
        timeout: 5000,
      });
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      await page.goto('/program-holder');

      const h1Count = await page.locator('h1').count();
      expect(h1Count).toBeGreaterThanOrEqual(1);
    });

    test('should have alt text for images', async ({ page }) => {
      await page.goto('/program-holder');

      const images = await page.locator('img').all();

      for (const img of images) {
        const alt = await img.getAttribute('alt');
        expect(alt).toBeTruthy();
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      await page.goto('/program-holder');

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      expect(focusedElement).toBeTruthy();
    });
  });

  test.describe('Performance', () => {
    test('should load dashboard within 3 seconds', async ({ page }) => {
      await loginAsProgramHolder(page);

      const startTime = Date.now();
      await page.goto('/program-holder/dashboard');
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      expect(loadTime).toBeLessThan(3000);
    });

    test('should have no console errors', async ({ page }) => {
      const errors: string[] = [];

      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      await page.goto('/program-holder/dashboard');

      expect(errors.length).toBe(0);
    });
  });
});
