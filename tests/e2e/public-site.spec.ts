import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

const CRITICAL_PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/programs',
  '/apprenticeships',
  '/funding',
  '/for-students',
  '/for-employers',
  '/partners',
  '/testing',
  '/pricing',
  '/apply',
  '/apply/student',
  '/apply/status',
  '/support',
  '/login',
];

const CRITICAL_PROGRAM_ROUTES = [
  '/programs/barber-apprenticeship',
  '/programs/cdl-training',
  '/programs/bookkeeping',
  '/programs/business-management',
  '/programs/medical-assistant',
  '/programs/phlebotomy-technician',
  '/programs/hvac-technician',
];

const FORBIDDEN_PLACEHOLDERS = [
  '123 Main St',
  'Columbia, MD',
  '21044',
  'Lorem ipsum',
  'TODO:',
  '[object Object]',
];

function isInternalHref(href: string | null): href is string {
  return Boolean(
    href &&
      href.startsWith('/') &&
      !href.startsWith('//') &&
      !href.startsWith('/api/') &&
      !href.startsWith('/_next/') &&
      !href.includes('#'),
  );
}

async function assertSuccessfulResponse(
  request: APIRequestContext,
  href: string,
  context: string,
) {
  const response = await request.get(href, { maxRedirects: 10, timeout: 30_000 });
  expect(response.status(), `${context}: ${href} returned ${response.status()}`).toBeLessThan(400);
}

async function collectInternalLinks(page: Page, selector: string) {
  const hrefs = await page.locator(selector).evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  return [...new Set(hrefs.filter(isInternalHref))].sort();
}

async function assertNoRuntimeFailure(page: Page, route: string, expectedPath?: string) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: string[] = [];

  // Capture the failing resource URL instead of reporting an untraceable 503.
  // Only store same-origin request paths; never log credential-bearing queries.
  page.on('response', (response) => {
    if (response.status() < 500) return;
    try {
      const url = new URL(response.url());
      if (url.origin === new URL(page.url()).origin) {
        failedResponses.push(`${response.status()} ${url.pathname}`);
      }
    } catch { /* Browser errors remain available below. */ }
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response, `${route} did not return a response`).not.toBeNull();
  expect(response!.status(), `${route} returned ${response!.status()}`).toBeLessThan(400);

  if (expectedPath) {
    await expect(page).toHaveURL((url) => url.pathname === expectedPath);
  }

  // innerText excludes embedded scripts. The application shell intentionally
  // contains chunk-recovery source code whose text includes "ChunkLoadError";
  // that source is not a rendered failure and must not trip the visible-page check.
  const visibleBody = page.locator('body');
  await expect.poll(async () => (await visibleBody.innerText()).trim().length, {
    message: `${route} rendered an empty body`,
  }).toBeGreaterThan(80);
  const body = await visibleBody.innerText();
  expect(body, `${route} rendered an application exception`).not.toMatch(
    /Application error|client-side exception|server-side exception|ChunkLoadError|no healthy upstream/i,
  );

  expect(
    failedResponses,
    `${route} had failed same-origin resources: ${failedResponses.join(' | ')}`,
  ).toEqual([]);

  expect(pageErrors, `${route} emitted page errors: ${pageErrors.join(' | ')}`).toEqual([]);

  const actionableConsoleErrors = consoleErrors.filter(
    (error) => !/favicon|third-party cookie/i.test(error),
  );
  expect(
    actionableConsoleErrors,
    `${route} emitted console errors: ${actionableConsoleErrors.join(' | ')}. HTTP failures: ${failedResponses.join(' | ')}`,
  ).toEqual([]);
}

test.describe('page-by-page public production audit', () => {
  const destinationByAlias = new Map([['/for-students', '/programs'], ['/for-employers', '/employers']]);
  for (const route of [...CRITICAL_PUBLIC_ROUTES, ...CRITICAL_PROGRAM_ROUTES]) {
    test(`${route} renders without runtime failure`, async ({ page }) => {
      await assertNoRuntimeFailure(page, route, destinationByAlias.get(route));
    });
  }

  test('critical pages do not expose known placeholder content', async ({ page }) => {
    for (const route of [...CRITICAL_PUBLIC_ROUTES, ...CRITICAL_PROGRAM_ROUTES]) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const body = (await page.locator('body').textContent()) ?? '';
      for (const placeholder of FORBIDDEN_PLACEHOLDERS) {
        expect(body, `${route} contains forbidden placeholder: ${placeholder}`).not.toContain(
          placeholder,
        );
      }
    }
  });

  test('every homepage header and footer internal link resolves', async ({ page, request }) => {
    test.setTimeout(180_000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const links = await collectInternalLinks(page, 'header a[href], footer a[href]');
    expect(links.length, 'No internal header or footer links were discovered').toBeGreaterThan(5);
    for (let index = 0; index < links.length; index += 3) {
      await Promise.all(links.slice(index, index + 3).map((href) =>
        assertSuccessfulResponse(request, href, 'navigation integrity'),
      ));
    }
  });

  test('program directory links resolve', async ({ page, request }) => {
    await page.goto('/programs', { waitUntil: 'domcontentloaded' });
    const programLinks = 'main a[href^="/programs/"]';
    await expect(page.locator(`${programLinks}:visible`).first()).toBeVisible();
    const links = await collectInternalLinks(page, programLinks);
    expect(links.length, 'No program links were discovered').toBeGreaterThan(0);
    for (const href of links) {
      await assertSuccessfulResponse(request, href, 'program route');
    }
  });
});

test.describe('responsive navigation acceptance', () => {
  test('desktop keeps the main navigation horizontal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const desktopNav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(desktopNav).toBeVisible();
    const box = await desktopNav.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.height, 'Desktop nav appears wrapped into multiple rows').toBeLessThan(90);
  });

  test('mobile exposes an operable menu without desktop nav collision', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const menuButton = page.getByRole('button', { name: 'Open menu', exact: true });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const mobileNav = page.getByRole('dialog').getByRole('navigation', { name: 'Site navigation' });
    await expect(mobileNav).toBeVisible();
  });
});

test.describe('application entry audit', () => {
  test('application chooser hands off to the student intake', async ({ page }) => {
    await assertNoRuntimeFailure(page, '/apply');
    await page.getByRole('link', { name: /^Intake Application/ }).click();
    await expect(page).toHaveURL(/\/apply\/student\/interview/);
    await expect(page.getByPlaceholder(/Type your answer|Escriba su respuesta/i)).toBeVisible();
  });

  test('Barber enrollment retains the selected program and paid enrollment intent', async ({ page }) => {
    await assertNoRuntimeFailure(page, '/programs/barber-apprenticeship/apply');
    const enrollment = page.getByRole('link', { name: 'Start Enrollment' });
    await expect(enrollment).toHaveAttribute('href',
      '/apply/student/interview?program=barber-apprenticeship&intent=enrollment');
    await enrollment.click();
    await expect(page).toHaveURL(/\/apply\/student\/interview\?program=barber-apprenticeship&intent=enrollment/);
  });

  test('student application exposes the standard intake form', async ({ page }) => {
    await assertNoRuntimeFailure(page, '/apply/student');
    await page.getByRole('link', { name: 'Use standard form instead' }).click();
    await expect(page).toHaveURL(/\/apply\/student\/form/);
    await expect(page.getByRole('button', { name: 'Continue', exact: true })).toBeVisible();
  });

  test('application status page accepts tracking information', async ({ page }) => {
    await page.goto('/apply/status', { waitUntil: 'domcontentloaded' });
    const trackingInput = page.locator(
      'input[name*="application" i], input[placeholder*="application" i], input[type="email"]',
    );
    await expect(trackingInput.first()).toBeVisible();
  });
});

test.describe('pricing and testing integrity', () => {
  test('pricing page has a useful populated or graceful empty state', async ({ page }) => {
    await assertNoRuntimeFailure(page, '/pricing');
    const body = (await page.locator('body').textContent()) ?? '';
    expect(body).not.toMatch(/0 programs available/i);
  });

  test('legacy WorkKeys URL redirects to canonical priced provider and retains purchase controls', async ({ page }) => {
    // The legacy provider route is a permanent redirect, not its own content page.
    const response = await page.goto('/testing/workkeys', { waitUntil: 'domcontentloaded' });
    expect(response, 'WorkKeys legacy route did not respond').not.toBeNull();
    await expect(page).toHaveURL(new RegExp('/testing#workkeys$'));
    await assertNoRuntimeFailure(page, '/testing#workkeys');

    const workkeys = page.locator('article#workkeys');
    await expect(workkeys.getByRole('heading', { name: /ACT WorkKeys/i })).toBeVisible();
    // Verify approved pricing and actions without hardcoding outdated amounts.
    const bookLinks = workkeys.getByRole('link', { name: /Book —/ });
    await expect(bookLinks.first()).toBeVisible();
    const amountText = await bookLinks.first().innerText();
    const amount = amountText.match(new RegExp('[$]([0-9]+(?:[.][0-9]{2})?)'))?.[1];
    expect(Number(amount), 'WorkKeys must expose a positive approved exam price').toBeGreaterThan(0);
    await expect(workkeys.getByRole('button', { name: /add to cart/i }).first()).toBeVisible();
    await expect(bookLinks.first()).toHaveAttribute('href', /provider=workkeys.*exam=/);
  });
});
