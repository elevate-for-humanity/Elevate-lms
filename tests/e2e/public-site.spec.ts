import { expect, test, type Page, type APIRequestContext } from '@playwright/test';

const CORRECT_ADDRESS = '120 E Market St';
const FORBIDDEN_PLACEHOLDERS = [
  '123 Main St',
  'Columbia, MD',
  '21044',
  'Lorem ipsum',
  'Coming soon',
  'TODO:',
  'undefined',
  '[object Object]',
];

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
  '/apply/status',
  '/support',
  '/login',
];

const CRITICAL_PROGRAM_ROUTES = [
  '/programs/barber-apprenticeship',
  '/programs/bookkeeping',
  '/programs/business-management',
  '/programs/medical-assistant',
  '/programs/phlebotomy-technician',
  '/programs/hvac-technician',
];

const APPLICATION_ROUTES = [
  '/apply',
  '/apply/status',
  '/programs/barber-apprenticeship/apply',
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
  expect(body, `${route} rendered a Next.js application error`).not.toMatch(
    /Application error|client-side exception|server-side exception|ChunkLoadError/i,
  );

  expect(pageErrors, `${route} emitted page errors: ${pageErrors.join(' | ')}`).toEqual([]);

  const actionableConsoleErrors = consoleErrors.filter(
    (error) =>
      !/favicon|third-party cookie|Failed to load resource.*404/i.test(error),
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

  test('critical pages do not expose placeholder or malformed content', async ({ page }) => {
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

  test('address-bearing pages use the Indianapolis Market Street address', async ({ page }) => {
    for (const route of ['/', '/about', '/contact', '/testing']) {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      const body = (await page.locator('body').textContent()) ?? '';
      expect(body, `${route} does not show the current Indianapolis address`).toContain(
        CORRECT_ADDRESS,
      );
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

  test('program directory links resolve and do not route to generic placeholders', async ({ page, request }) => {
    await page.goto('/programs', { waitUntil: 'domcontentloaded' });
    const links = await collectInternalLinks(page, 'main a[href^="/programs/"]');
    expect(links.length, 'No program links were discovered').toBeGreaterThan(0);

    for (const href of links) {
      await assertSuccessfulResponse(request, href, 'program route');
    }
  });
});

test.describe('responsive navigation acceptance', () => {
  test('desktop displays a horizontal navigation bar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const desktopNav = page.getByRole('navigation', { name: 'Main navigation' });
    await expect(desktopNav).toBeVisible();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeHidden();
  });

  test('mobile displays an operable hamburger navigation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });

    const menuButton = page.getByRole('button', { name: 'Open menu' });
    await expect(menuButton).toBeVisible();
    await menuButton.click();

    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation' });
    await expect(mobileNav).toBeVisible();
    await expect(page.getByRole('link', { name: /apply/i }).last()).toBeVisible();
  });
});

test.describe('application and enrollment entry audit', () => {
  for (const route of APPLICATION_ROUTES) {
    test(`${route} exposes an actionable application experience`, async ({ page }) => {
      await assertNoRuntimeFailure(page, route);

      const heading = page.getByRole('heading', { name: /apply|application|status/i }).first();
      await expect(heading).toBeVisible({ timeout: 10_000 });

      const actionableControl = page
        .locator('form, input, select, textarea, button[type="submit"], a[href*="apply"]')
        .first();
      await expect(actionableControl, `${route} has no actionable application control`).toBeVisible();
    });
  }

  test('homepage apply links land on a valid application route', async ({ page, request }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const applyLinks = await page
      .getByRole('link', { name: /apply/i })
      .evaluateAll((links) => links.map((link) => link.getAttribute('href')));

    const internalApplyLinks = [...new Set(applyLinks.filter(isInternalHref))];
    expect(internalApplyLinks.length, 'Homepage has no internal Apply links').toBeGreaterThan(0);

    for (const href of internalApplyLinks) {
      await assertSuccessfulResponse(request, href, 'homepage apply CTA');
    }
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
    await expect(page.getByRole('heading', { name: /pricing|training/i }).first()).toBeVisible();

    const body = (await page.locator('body').textContent()) ?? '';
    expect(body).not.toMatch(/0 programs available/i);
  });

  test('WorkKeys page shows non-zero prices and purchase controls', async ({ page }) => {
    await assertNoRuntimeFailure(page, '/testing/workkeys');
    await expect(page.getByText(/\$104|\$168/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /add to cart/i }).first()).toBeVisible();
  });
});
