import { test, expect } from '@playwright/test';
const base = process.env.PLAYWRIGHT_BASE_URL || 'https://app.elevateforhumanity.org';
const email = process.env.E2E_EMPLOYER_EMAIL || '';
const password = process.env.E2E_EMPLOYER_PASSWORD || '';
test('Employer setup saves company and hiring needs, opens private files and acknowledges orientation', async ({
  page,
}) => {
  test.skip(!email || !password, 'Provision the isolated QA employer identity first');
  const runtimeErrors: string[] = [];
  page.on('pageerror', (error) => runtimeErrors.push(error.message));
  await page.goto(`${base}/login`);
  const emailInput = page.locator('input[type=email]').first();
  await expect(emailInput).toBeEnabled({ timeout: 20000 });
  await emailInput.fill(email);
  await page.locator('input[type=password]').first().fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 }),
    page.locator('button[type=submit]').first().click(),
  ]);
  await page.goto(`${base}/employer/dashboard`);
  await expect(page.getByRole('link', { name: 'Continue employer setup' })).toBeVisible();
  await page.getByRole('link', { name: 'Continue employer setup' }).click();
  await expect(page.getByRole('heading', { name: 'Complete employer setup' })).toBeVisible();
  await page.getByRole('link', { name: /Company profile Confirm/ }).click();
  await page.getByLabel('Company name', { exact: true }).fill('[QA E2E] Employer workflow');
  await page.getByLabel('City', { exact: true }).fill('QA worksite');
  await page.getByLabel('State', { exact: true }).fill('TN');
  await page.getByRole('button', { name: 'Save company profile' }).click();
  await expect(page.getByText('Company profile saved.', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Company name', { exact: true })).toHaveValue(
    '[QA E2E] Employer workflow',
  );
  await page.getByRole('link', { name: 'Back to employer setup' }).click();
  await page.getByRole('link', { name: /Hiring and training needs Tell/ }).click();
  await page.getByLabel('Positions or staff training needed').fill('QA staff training only');
  await page.getByLabel('Worksite locations').fill('QA Tennessee worksite');
  await page.getByRole('button', { name: 'Save hiring and training needs' }).click();
  await expect(
    page.getByText('Your hiring and training needs are saved.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel('Positions or staff training needed')).toHaveValue(
    'QA staff training only',
  );
  await page.getByRole('link', { name: 'Back to employer setup' }).click();
  await page.getByRole('link', { name: /Documents and agreements Review/ }).click();
  await expect(page.getByText('QA-employer-onboarding.pdf', { exact: true })).toBeVisible();
  const view = page.getByRole('link', { name: 'View', exact: true }).first();
  const url = await view.getAttribute('href');
  expect(url).toMatch(/^\/employer\/documents\/[^/]+\/view$/);
  const file = await page.request.get(`${base}${url}`);
  expect(file.ok()).toBeTruthy();
  expect(file.headers()['content-type']).toContain('application/pdf');
  await page.getByRole('link', { name: 'Back to employer setup' }).click();
  await page.getByRole('link', { name: /Employer orientation Review/ }).click();
  await page.getByRole('checkbox', { name: /I have reviewed the employer orientation/ }).check();
  await page.getByRole('button', { name: 'Save orientation acknowledgment' }).click();
  await expect(page).toHaveURL(/\/employer\/setup\?orientation=saved/);
  await expect
    .poll(
      () =>
        page
          .locator('img')
          .evaluateAll((images) =>
            images.every(
              (img) => img instanceof HTMLImageElement && img.complete && img.naturalWidth > 0,
            ),
          ),
      { message: 'Employer setup images must load', timeout: 15000 },
    )
    .toBe(true);
  expect(runtimeErrors, 'Employer workflow must not produce unhandled browser errors').toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('employer-setup-complete.png'),
    fullPage: true,
  });
});
