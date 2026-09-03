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
  '/testing/workkeys',
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
  const response = await request.get(href, { maxRedirects: 10 });
  expect(response.status(), `${context}: ${href} returned ${response.status()}`).toBeLessThan(400);
}

async function collectInternalLinks(page: Page, selector: string) {
  const hrefs = await page.locator(selector).evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  );
  return [...new Set(hrefs.filter(isInternalHref))].sort();
}

async function assertNoRuntimeFailure(page: Page, route: string) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
  expect(response, `${route} did not return a response`).not.toBeNull();
  expect(response!.status(), `${route} returned ${response!.status()}`).toBeLessThan(400);

  await page.waitForLoadState('networkidle').catch(() => undefined);

  const body = (await page.locator('body').textContent()) ?? '';
  expect(body.trim().length, `${route} rendered an empty body`).toBeGreaterThan(80);
  expect(body, `${route} rendered an application exception`).not.toMatch(
    /Application error|client-side exception|server-side exception|ChunkLoadError|no healthy upstream/i,
  );

  expect(pageErrors, `${route} emitted page errors: ${pageErrors.join(' | ')}`).toEqual([]);

  const actionableConsoleErrors = consoleErrors.filter(
    (error) => !/favicon|third-party cookie/i.test(error),
  );
  expect(
    actionableConsoleErrors,
    `${route} emitted console errors: ${actionableConsoleErrors.join(' | ')}`,
  ).toEqual([]);
}

test.describe.configure({ mode: 'serial' });

test.describe('page-by-page public production audit', () => {
  for (const route of [...CRITICAL_PUBLIC_ROUTES, ...CRITICAL_PROGRAM_ROUTES]) {
    test(`${route} renders without runtime failure`, async ({ page }) => {
      await assertNoRuntimeFailure(page, route);
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
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const links = await collectInternalLinks(page, 'header a[href], footer a[href]');
    expect(links.length, 'No internal header or footer links were discovered').toBeGreaterThan(5);
    for (const href of links) {
      await assertSuccessfulResponse(request, href, 'navigation integrity');
    }
  });

  test('program directory links resolve', async ({ page, request }) => {
    await page.goto('/programs', { waitUntil: 'domcontentloaded' });
    const links = await collectInternalLinks(page, 'main a[href^="/programs/"]');
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

    const menuButton = page.getByRole('button', { name: /open menu|menu/i }).first();
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const mobileNav = page.getByRole('navigation', { name: /mobile navigation/i });
    await expect(mobileNav).toBeVisible();
  });
});

test.describe('application entry audit', () => {
  for (const route of ['/apply', '/apply/student', '/programs/barber-apprenticeship/apply']) {
    test(`${route} exposes an actionable application experience`, async ({ page }) => {
      await assertNoRuntimeFailure(page, route);
      const control = page.locator('form, input, select, textarea, button[type="submit"]').first();
      await expect(control, `${route} has no actionable application control`).toBeVisible();
    });
  }

  test('student application has a submission control', async ({ page }) => {
    await page.goto('/apply/student', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /submit application/i })).toBeVisible();
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

  test('WorkKeys page shows non-zero prices and purchase controls', async ({ page }) => {
    await assertNoRuntimeFailure(page, '/testing/workkeys');
    await expect(page.getByText(/\$104|\$168/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /add to cart/i }).first()).toBeVisible();
  });
});
