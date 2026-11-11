import { test, expect, type Locator, type Request as BrowserRequest } from '@playwright/test';
import { isConfirmedWebKitCancellation, isTrackedClientRead, isSettlingClientRead, type CapturedBrowserError, type CancelledBrowserRequest, type CompletedBrowserRequest } from './helpers/browser-runtime-errors';
const base = process.env.PLAYWRIGHT_BASE_URL || 'https://app.elevateforhumanity.org';
const email = process.env.E2E_EMPLOYER_EMAIL || '';
const password = process.env.E2E_EMPLOYER_PASSWORD || '';
test('Employer setup saves company and hiring needs, opens private files and acknowledges orientation', async ({
  page,
  browserName,
}) => {
  test.skip(!email || !password, 'Provision the isolated QA employer identity first');
  const runtimeErrors: CapturedBrowserError[] = [];
  const cancelledRequests: CancelledBrowserRequest[] = [];
  const completedRequests: CompletedBrowserRequest[] = [];
  const pendingClientReads = new Set<BrowserRequest>();
  let lastClientReadActivity = Date.now();
  const authOrigin = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://unused.invalid').origin;
  const appOrigin = new URL(base).origin;
  const finishClientRead = (request: BrowserRequest) => {
    if (pendingClientReads.delete(request)) lastClientReadActivity = Date.now();
  };
  page.on('request', request => {
    // Only one-shot reads are waited on. /api/notifications/preferences is a
    // recurring poller (timer + window focus) that never settles; waiting on it
    // would deadlock. It is still recorded as a completed read below.
    if (isSettlingClientRead(request.url(), request.method(), authOrigin, appOrigin)) {
      pendingClientReads.add(request);
      lastClientReadActivity = Date.now();
    }
  });
  page.on('requestfinished', finishClientRead);
  page.on('pageerror', (error) => runtimeErrors.push({ message: error.message, stack: error.stack, time: Date.now() }));
  page.on('response', (response) => {
    // Playwright's production trace proved successful notification-preferences GETs
    // despite WebKit page-error reports. Capture only these exact trusted reads.
    if (isTrackedClientRead(response.url(), response.request().method(), authOrigin, appOrigin)) {
      completedRequests.push({ url: response.url(), status: response.status(), time: Date.now() });
    }
  });
  page.on('requestfailed', (request) => {
    cancelledRequests.push({ url: request.url(), errorText: request.failure()?.errorText || '', time: Date.now() });
    finishClientRead(request);
  });
  // Let mounted notification/auth requests settle before deliberately leaving
  // a document. This exercises the UI without generating unload-only errors.
  const waitForClientReads = async () => {
    await expect.poll(() => pendingClientReads.size === 0 && Date.now() - lastClientReadActivity >= 300, {
      timeout: 10000,
      message: 'Account and notification requests should settle before leaving the document',
    }).toBe(true);
  };
  const clickReady = async (locator: Locator) => {
    await waitForClientReads();
    await locator.click();
  };
  const replaceReadyValue = async (locator: Locator, value: string) => {
    await waitForClientReads();
    await expect(locator).toBeEditable();
    // Playwright's fill atomically replaces the existing value. A separate
    // empty-value assertion can race WebKit hydration before the final edit.
    await locator.fill(value);
    await expect(locator).toHaveValue(value);
  };
  await page.goto(`${base}/login`);
  const emailInput = page.locator('input[type=email]').first();
  await expect(emailInput).toBeEnabled({ timeout: 20000 });
  await emailInput.fill(email);
  await page.locator('input[type=password]').first().fill(password);
  await Promise.all([
    page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30000 }),
    clickReady(page.locator('button[type=submit]').first()),
  ]);
  await expect(page).toHaveURL(/\/employer\/dashboard/);
  await expect(page.getByRole('link', { name: 'Continue employer setup' })).toBeVisible();
  await clickReady(page.getByRole('link', { name: 'Continue employer setup' }));
  await expect(page.getByRole('heading', { name: 'Complete employer setup' })).toBeVisible();
  await clickReady(page.getByRole('link', { name: /Company profile Confirm/ }));
  await replaceReadyValue(page.getByLabel('Company name', { exact: true }), '[QA E2E] Employer workflow');
  await replaceReadyValue(page.getByLabel('City', { exact: true }), 'QA worksite');
  await replaceReadyValue(page.getByLabel('State', { exact: true }), 'TN');
  await clickReady(page.getByRole('button', { name: 'Save company profile' }));
  await expect(page.getByText('Company profile saved.', { exact: true })).toBeVisible();
  await waitForClientReads();
  await page.reload();
  await expect(page.getByLabel('Company name', { exact: true })).toHaveValue(
    '[QA E2E] Employer workflow',
  );
  await clickReady(page.getByRole('link', { name: 'Back to employer setup' }));
  await clickReady(page.getByRole('link', { name: /Hiring and training needs Tell/ }));
  await replaceReadyValue(page.getByLabel('Positions or staff training needed'), 'QA staff training only');
  await replaceReadyValue(page.getByLabel('Worksite locations'), 'QA Tennessee worksite');
  await clickReady(page.getByRole('button', { name: 'Save hiring and training needs' }));
  await expect(
    page.getByText('Your hiring and training needs are saved.', { exact: true }),
  ).toBeVisible();
  await waitForClientReads();
  await page.reload();
  await expect(page.getByLabel('Positions or staff training needed')).toHaveValue(
    'QA staff training only',
  );
  // Regression: replacing a persisted textarea value must survive a mobile
  // client rerender, server action, and a fresh server-rendered document.
  await replaceReadyValue(page.getByLabel('Positions or staff training needed'), 'QA updated staff training');
  await clickReady(page.getByRole('button', { name: 'Save hiring and training needs' }));
  await expect(page.getByText('Your hiring and training needs are saved.', { exact: true })).toBeVisible();
  await waitForClientReads();
  await page.reload();
  await expect(page.getByLabel('Positions or staff training needed')).toHaveValue('QA updated staff training');
  await clickReady(page.getByRole('link', { name: 'Back to employer setup' }));
  await clickReady(page.getByRole('link', { name: /Documents and agreements Review/ }));
  await expect(page.getByText('QA-employer-onboarding.pdf', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), 'Employer documents must fit the device viewport').toBe(true);
  const view = page.getByRole('link', { name: 'View', exact: true }).first();
  const url = await view.getAttribute('href');
  expect(url).toMatch(/^\/employer\/documents\/[^/]+\/view$/);
  const file = await page.request.get(`${base}${url}`);
  expect(file.ok()).toBeTruthy();
  expect(file.headers()['content-type']).toContain('application/pdf');
  await clickReady(page.getByRole('link', { name: 'Back to employer setup' }));
  await clickReady(page.getByRole('link', { name: /Employer orientation Review/ }));
  await page.getByRole('checkbox', { name: /I have reviewed the employer orientation/ }).check();
  await clickReady(page.getByRole('button', { name: 'Save orientation acknowledgment' }));
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
  const unhandledErrors = runtimeErrors.filter(error => !isConfirmedWebKitCancellation(error, cancelledRequests, browserName, completedRequests));
  if (unhandledErrors.length) {
    await test.info().attach('browser-runtime-errors.json', {
      body: Buffer.from(JSON.stringify({ runtimeErrors, cancelledRequests, completedRequests })),
      contentType: 'application/json',
    });
  }
  expect(unhandledErrors.map(error => error.message), 'Employer workflow must not produce unhandled browser errors').toEqual([]);
  await page.screenshot({
    path: test.info().outputPath('employer-setup-complete.png'),
    fullPage: true,
  });
});
