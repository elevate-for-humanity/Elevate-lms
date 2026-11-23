import { test, expect, type Page } from '@playwright/test';
import { peerOrigin } from './helpers/app-origins';

/**
 * E2E Tests for Program Holder Portal
 *
 * Coverage:
 * - Application submission
 * - Login and authentication
 * - Onboarding flow
 * - Student management
 * - Report submission
 * - Compliance tracking
 */

const applicationUrl = `${peerOrigin('marketing')}/apply/program-holder`;
const programHolderCredentials = {
  email: process.env.E2E_PROGRAM_HOLDER_EMAIL || process.env.TEST_PROGRAM_HOLDER_EMAIL || '',
  password: process.env.E2E_PROGRAM_HOLDER_PASSWORD || process.env.TEST_PROGRAM_HOLDER_PASSWORD || '',
};

async function signInProgramHolder(page: Page) {
  const { email, password } = programHolderCredentials;
  if (!email || !password) {
    throw new Error('The disposable Program Holder sign-in fixture is missing.');
  }
  await page.goto('/login?next=%2Fprogram-holder%2Fdashboard');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

async function fillApplication(page: Page, email: string) {
  await page.getByLabel('Legal Organization Name').fill('QA Training Center');
  await page.getByLabel('Primary Contact').fill('QA Applicant');
  await page.getByLabel('Email', { exact: false }).fill(email);
  await page.getByLabel('Phone').fill('317-555-0100');
  await page.getByLabel('Street Address').fill('123 Main St');
  await page.getByLabel('City', { exact: true }).fill('Indianapolis');
  await page.getByLabel('State', { exact: true }).fill('IN');
  await page.getByLabel('ZIP').fill('46204');
  await page.locator('select[name="requestedProgram"]').selectOption({ index: 1 });
  await page.getByRole('checkbox', { name: 'Healthcare Training' }).check();
  await page.getByRole('checkbox', { name: /I certify that I am authorized/ }).check();
}

test.describe('Program Holder Portal', () => {
  test.describe('Application Flow', () => {
    test('should submit program holder application', async ({ page }) => {
      await page.goto(applicationUrl);
      await fillApplication(page, `ph-qa-${Date.now()}@example.com`);

      const receipt = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/program-holder/apply' &&
        response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Submit Program Holder Application' }).click();
      const response = await receipt;
      expect(response.status()).toBe(201);
      expect(await response.json()).toMatchObject({ ok: true, applicationType: 'program_holder' });
      await expect(page).toHaveURL(/\/apply\/success\?(?=.*\bref=)(?=.*\btype=program-holder)/);
    });

    test('should validate required fields', async ({ page }) => {
      await page.goto(applicationUrl);
      await page.getByRole('button', { name: 'Submit Program Holder Application' }).click();
      await expect(page.locator('input[name="orgName"]:invalid')).toBeFocused();
    });

    test('should prevent duplicate applications', async ({ page }) => {
      const email = `duplicate-${Date.now()}@qa.invalid`;

      await page.goto(applicationUrl);
      await fillApplication(page, email);
      await page.getByRole('button', { name: 'Submit Program Holder Application' }).click();
      await expect(page).toHaveURL(/\/apply\/success\?/);

      await page.goto(applicationUrl);
      await fillApplication(page, email);
      const duplicate = page.waitForResponse((response) =>
        new URL(response.url()).pathname === '/api/program-holder/apply' &&
        response.request().method() === 'POST',
      );
      await page.getByRole('button', { name: 'Submit Program Holder Application' }).click();
      expect((await duplicate).status()).toBe(409);
      await expect(page.getByText(/already pending/i)).toBeVisible();
    });
  });

  test.describe('Authentication', () => {
    test('should redirect to login when not authenticated', async ({ page }) => {
      await page.goto('/program-holder/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    });

    test('should login successfully', async ({ page }) => {
      await signInProgramHolder(page);

      // Should redirect to dashboard
      await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');

      await page.getByLabel('Email address').fill('invalid@example.com');
      await page.getByLabel('Password', { exact: true }).fill('wrongpassword');
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Invalid')).toBeVisible();
    });
  });

  test.describe('Authenticated workspace', () => {
    const activeStudent = 'QA Holder Active Student';
    const completedStudent = 'QA Holder Completed Student';

    test.beforeEach(async ({ page }) => {
      await signInProgramHolder(page);
      await expect(page).toHaveURL(/\/program-holder\/dashboard(?:\?|$)/);
      await expect(page.getByRole('heading', { name: 'To-dos', exact: true })).toBeVisible();
    });

    test('shows the holder task queue and reporting alert', async ({ page }) => {
      await expect(page.getByRole('heading', { name: 'Alerts', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Weekly progress reports are due each Friday' })).toBeVisible();
    });

    test('opens the roster and reports from the dashboard', async ({ page }) => {
      await page.locator('a[href="/program-holder/students"]:visible').first().click();
      await expect(page.getByRole('heading', { name: 'Enrolled Students', exact: true })).toBeVisible();
      await page.goto('/program-holder/dashboard');
      await page.getByRole('link', { name: 'Weekly progress reports are due each Friday' }).click();
      await expect(page.getByRole('heading', { name: 'Reports', exact: true })).toBeVisible();
    });

    test('filters persisted enrollments by status and name', async ({ page }) => {
      await page.goto('/program-holder/students');
      const visibleEnrollments = page.getByTestId('student-row')
        .or(page.getByTestId('student-card'))
        .filter({ visible: true });
      const activeEnrollment = visibleEnrollments.getByText(activeStudent, { exact: true });
      const completedEnrollment = visibleEnrollments.getByText(completedStudent, { exact: true });
      await expect(activeEnrollment).toBeVisible();
      await expect(completedEnrollment).toBeVisible();
      await page.getByLabel('Filter student status').selectOption('active');
      await page.getByRole('button', { name: 'Apply filters' }).click();
      await expect(page).toHaveURL(/status=active/);
      await expect(activeEnrollment).toBeVisible();
      await expect(completedEnrollment).toHaveCount(0);

      await page.getByLabel('Search students').fill(completedStudent);
      await page.getByRole('button', { name: 'Apply filters' }).click();
      await expect(page.getByText('No enrolled students match these filters.', { exact: true })
        .filter({ visible: true })).toBeVisible();
      await page.getByRole('link', { name: 'Clear filters' }).click();
      await page.getByLabel('Search students').fill(completedStudent);
      await page.getByRole('button', { name: 'Apply filters' }).click();
      await expect(completedEnrollment).toBeVisible();
      await expect(activeEnrollment).toHaveCount(0);
    });

    test('opens pending applicants without exposing recruiting tools to an unassigned holder', async ({ page }) => {
      await page.goto('/program-holder/students');
      await page.getByRole('link', { name: 'View Applicants' }).click();
      await expect(page).toHaveURL(/\/program-holder\/students\/pending$/);
      await expect(page.getByText(/Applicant recruiting tools are available only to assigned recruiters/)).toBeVisible();
    });

    test('validates and saves a report for the assigned student', async ({ page }) => {
      await page.goto('/program-holder/reports');
      const form = page.getByRole('region', { name: 'Student progress report' });
      const student = form.getByLabel('Student name');
      await expect(student.getByRole('option', { name: activeStudent, exact: true })).toHaveCount(1);
      await expect(student.getByRole('option', { name: completedStudent, exact: true })).toHaveCount(1);

      const reportsOnFile = page.getByText(
        /^(?:\d+ reports are on file\.|No submitted Program Holder reports are on file\.)$/,
      );
      const priorReportCount = Number((await reportsOnFile.innerText()).match(/^\d+/)?.[0] ?? '0');
      const submit = form.getByRole('button', { name: 'Submit report for review' });
      await submit.click();
      await expect(form.locator('select[name="student"]:invalid')).toBeFocused();

      const date = new Date().toISOString().slice(0, 10);
      await student.selectOption({ label: activeStudent });
      await form.getByLabel('Start date').fill(date);
      await form.getByLabel('End date').fill(date);
      await form.getByLabel('Reported hours').fill('2.5');
      await form.getByRole('checkbox', { name: 'Attended training' }).check();
      await form.getByLabel('Notes and next steps').fill('Isolated QA progress report for the assigned student.');
      const response = page.waitForResponse((result) => new URL(result.url()).pathname === '/api/program-holder/student-progress-reports' && result.request().method() === 'POST');
      await submit.click();
      expect((await response).status()).toBe(201);
      await expect(form.getByRole('status')).toHaveText('Report submitted for review.');
      await page.reload();
      await expect(reportsOnFile).toHaveText(`${priorReportCount + 1} reports are on file.`);
    });

    test('shows compliance score and actionable requirements', async ({ page }) => {
      await page.goto('/program-holder/compliance');
      await expect(page.getByRole('heading', { name: 'Compliance', exact: true })).toBeVisible();
      const score = page.getByText('Compliance Score', { exact: true }).locator('..');
      await expect(score.getByText(/^(?:100|[0-9]{1,2})%$/)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Requirements', exact: true })).toBeVisible();
      await expect(page.getByLabel('Action required').first()).toBeVisible();
    });

    test('opens the reference and reads back the recorded MOU status', async ({ page }) => {
      await page.goto('/program-holder/documentation');
      await expect(page.getByRole('heading', { name: 'Every dashboard tab, explained' })).toBeVisible();
      await page.goto('/program-holder/sign-mou');
      await expect(page.getByRole('heading', { name: 'Sign the Program Holder MOU' })).toBeVisible();
      await expect(page.getByText(/Your Program Holder MOU is recorded as signed/)).toBeVisible();
    });

    test('persists notification preferences after a reload', async ({ page }) => {
      await page.goto('/program-holder/settings');
      await expect(page.getByRole('heading', { name: 'Settings', exact: true })).toBeVisible();
      const emailAlerts = page.getByRole('checkbox', { name: 'Email me about new enrollments' });
      const enable = !(await emailAlerts.isChecked());
      await emailAlerts.setChecked(enable);
      await page.getByRole('button', { name: 'Save notification choices' }).click();
      await expect(page.getByRole('status').filter({ hasText: 'Notification choices saved.' })).toBeVisible();
      await page.reload();
      await expect(emailAlerts).toBeChecked({ checked: enable });
    });

    test('exposes a single dashboard heading, labeled images and keyboard focus', async ({ page }) => {
      const content = page.locator('[data-elevate-dashboard-content]');
      await expect(content.getByRole('heading', { level: 1 })).toHaveCount(1);
      for (const img of await content.locator('img').all()) {
        await expect(img).toHaveAttribute('alt');
      }
      await page.keyboard.press('Tab');
      await expect(page.locator('a:focus-visible, button:focus-visible, input:focus-visible')).toBeVisible();
    });

    test('renders the warm dashboard within three seconds without page errors', async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      const started = Date.now();
      const response = await page.reload({ waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { name: 'To-dos', exact: true })).toBeVisible({ timeout: 3000 });
      expect(Date.now() - started).toBeLessThan(3000);
      expect(errors).toEqual([]);
    });
  });
});
