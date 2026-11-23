import { expect, test } from '@playwright/test';
import { appOrigin, peerOrigin } from './helpers/app-origins';

const LMS_BASE = appOrigin('lms');
const MARKETING_BASE = peerOrigin('marketing');

test.describe.configure({ mode: 'serial' });

test.describe('Program Holder application', () => {
  test('submits the current application contract without a database write', async ({ page }) => {
    const email = `program-holder-${Date.now()}@example.com`;
    let submittedBody: Record<string, unknown> | null = null;

    await page.route('**/api/program-holder/apply', async (route) => {
      submittedBody = route.request().postDataJSON() as Record<string, unknown>;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, referenceNumber: 'PH-QA-001' }),
      });
    });

    await page.goto(`${MARKETING_BASE}/apply/program-holder`, { waitUntil: 'domcontentloaded' });
    await page.locator('input[name="orgName"]').fill('QA Training Center');
    await page.locator('input[name="contactName"]').fill('QA Program Holder');
    await page.locator('input[name="email"]').fill(email);
    await page.locator('select[name="requestedProgram"]').selectOption({ index: 1 });
    await page.getByRole('checkbox').first().check();
    await page.getByRole('checkbox', { name: /I certify that I am authorized/i }).check();
    await page.getByRole('button', { name: 'Submit Program Holder Application' }).click();

    await expect(page.getByRole('heading', { name: 'Application Received' })).toBeVisible();
    await expect(page.getByText('Reference: PH-QA-001')).toBeVisible();
    expect(submittedBody).toMatchObject({
      organizationName: 'QA Training Center',
      contactName: 'QA Program Holder',
      email,
    });
    expect(submittedBody?.requestedProgramSlugs).toEqual([expect.any(String)]);
    expect(submittedBody?.programTypes).toEqual([expect.any(String)]);
  });

  test('enforces required identity, program, category, and certification fields', async ({
    page,
  }) => {
    await page.goto(`${MARKETING_BASE}/apply/program-holder`, { waitUntil: 'domcontentloaded' });
    const organization = page.locator('input[name="orgName"]');
    await page.getByRole('button', { name: 'Submit Program Holder Application' }).click();
    expect(
      await organization.evaluate((input: HTMLInputElement) => input.validity.valueMissing),
    ).toBe(true);

    await organization.fill('QA Training Center');
    await page.locator('input[name="contactName"]').fill('QA Program Holder');
    await page.locator('input[name="email"]').fill('qa-holder@example.com');
    await page.locator('select[name="requestedProgram"]').selectOption({ index: 1 });
    await page.getByRole('checkbox', { name: /I certify that I am authorized/i }).check();
    await page.getByRole('button', { name: 'Submit Program Holder Application' }).click();
    await expect(page.getByText('Select at least one program or service type.')).toBeVisible();
  });
});

test('Program Holder dashboard redirects an unauthenticated visitor to login', async ({ page }) => {
  await page.goto(`${LMS_BASE}/program-holder/dashboard`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/login(?:\?|$)/);
});
