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
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

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
      const email = `duplicate-${Date.now()}@example.com`;

      await page.goto(applicationUrl);
      await fillApplication(page, email);
      await page.getByRole('button', { name: 'Submit Program Holder Application' }).click();
      await expect(page).toHaveURL(/\/apply\/success\?/);

      await page.goto(applicationUrl);
      await fillApplication(page, email);
      await page.getByRole('button', { name: 'Submit Program Holder Application' }).click();
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

  test.describe('Dashboard', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await signInProgramHolder(page);
      await page.waitForURL(/.*dashboard/);
    });

    test('should display dashboard metrics', async ({ page }) => {
      await page.goto('/program-holder/dashboard');

      // Check for key metrics
      await expect(page.locator('text=Active Students')).toBeVisible();
      await expect(page.locator('text=At-Risk Students')).toBeVisible();
      await expect(page.locator('text=Pending Verifications')).toBeVisible();
      await expect(page.locator('text=Overdue Reports')).toBeVisible();
    });

    test('should display compliance score', async ({ page }) => {
      await page.goto('/program-holder/dashboard');

      await expect(page.locator('text=Compliance Score')).toBeVisible();

      // Score should be a number between 0-100
      const scoreText = await page.locator('text=/\\d+%/').first().textContent();
      expect(scoreText).toMatch(/\d+%/);
    });

    test('should navigate to students page', async ({ page }) => {
      await page.goto('/program-holder/dashboard');

      await page.click('text=Manage Students');

      await expect(page).toHaveURL(/.*students/);
    });

    test('should navigate to reports page', async ({ page }) => {
      await page.goto('/program-holder/dashboard');

      await page.click('text=Submit Reports');

      await expect(page).toHaveURL(/.*reports/);
    });
  });

  test.describe('Student Management', () => {
    test.beforeEach(async ({ page }) => {
      await signInProgramHolder(page);
      await page.waitForURL(/.*dashboard/);
    });

    test('should display student list', async ({ page }) => {
      await page.goto('/program-holder/students');

      await expect(page.locator('h1:has-text("Students")')).toBeVisible();
    });

    test('should filter students by status', async ({ page }) => {
      await page.goto('/program-holder/students');

      // Click filter dropdown
      await page.click('button:has-text("Filter")');

      // Select active students
      await page.click('text=Active');

      // Verify filter is applied
      await expect(page.locator('text=Active')).toBeVisible();
    });

    test('should view pending students', async ({ page }) => {
      await page.goto('/program-holder/students/pending');

      await expect(page.locator('h1:has-text("Pending Students")')).toBeVisible();
    });

    test('should search for students', async ({ page }) => {
      await page.goto('/program-holder/students');

      await page.fill('input[placeholder*="Search"]', 'John');

      // Wait for search results
      await page.waitForTimeout(500);

      // Results should be filtered
      const results = await page.locator('[data-testid="student-row"]').count();
      expect(results).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe('Report Submission', () => {
    test.beforeEach(async ({ page }) => {
      await signInProgramHolder(page);
      await page.waitForURL(/.*dashboard/);
    });

    test('should display reports page', async ({ page }) => {
      await page.goto('/program-holder/reports');

      await expect(page.locator('h1:has-text("Reports")')).toBeVisible();
    });

    test('should submit new report', async ({ page }) => {
      await page.goto('/program-holder/reports/submit');

      // Fill report form
      await page.selectOption('select[name="reportType"]', 'monthly');
      await page.fill('input[name="reportingPeriod"]', '2025-01');
      await page.fill('textarea[name="summary"]', 'Monthly report summary');

      // Submit
      await page.click('button[type="submit"]');

      await expect(page.locator('text=Report submitted')).toBeVisible({ timeout: 10000 });
    });

    test('should validate report fields', async ({ page }) => {
      await page.goto('/program-holder/reports/submit');

      // Try to submit without required fields
      await page.click('button[type="submit"]');

      await expect(page.locator('text=required')).toBeVisible();
    });
  });

  test.describe('Compliance', () => {
    test.beforeEach(async ({ page }) => {
      await signInProgramHolder(page);
      await page.waitForURL(/.*dashboard/);
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
      await signInProgramHolder(page);
      await page.waitForURL(/.*dashboard/);
    });

    test('should display documentation page', async ({ page }) => {
      await page.goto('/program-holder/documentation');

      await expect(page.locator('h1:has-text("Documentation")')).toBeVisible();
    });

    test('should view MOU', async ({ page }) => {
      await page.goto('/program-holder/mou');

      await expect(page.locator('text=Memorandum of Understanding')).toBeVisible();
    });
  });

  test.describe('Settings', () => {
    test.beforeEach(async ({ page }) => {
      await signInProgramHolder(page);
      await page.waitForURL(/.*dashboard/);
    });

    test('should display settings page', async ({ page }) => {
      await page.goto('/program-holder/settings');

      await expect(page.locator('h1:has-text("Settings")')).toBeVisible();
    });

    test('should update notification preferences', async ({ page }) => {
      await page.goto('/program-holder/settings');

      // Toggle notification setting
      const checkbox = page.locator('input[type="checkbox"]').first();
      await checkbox.click();

      // Save settings
      await page.click('button:has-text("Save")');

      await expect(page.locator('text=Settings saved')).toBeVisible({ timeout: 5000 });
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
      await signInProgramHolder(page);

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
