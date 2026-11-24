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

// One slow route must not consume the whole test timeout while every later
// link waits behind it (run 45237452466: GET /funding/wrg was still in flight
// when the 60s test timeout expired, and the dev server was resetting
// connections under load). Fetch in parallel with a bounded pool and a
// per-request timeout so a single stalled route fails fast on its own.
//
// Run 45254389225 proved the bounded pool was not enough: the same link test
// failed again with 19 links down on Retry #2 (23 on the attempt before),
// mostly DIFFERENT routes each time, no 404/500 anywhere, and two links that
// returned 200 OK and then aborted mid-response. That is not a broken link
// list — it is the Next.js dev server restarting mid-test. In dev only, after
// every request Next checks `v8.getHeapStatistics().used_heap_size > 0.8 *
// heap_size_limit` and, once crossed, logs "Server is approaching the used
// memory threshold, restarting..." and exits with code 77; the `next dev`
// CLI restarts it, which drops every in-flight request (ECONNRESET) and
// leaves all routes cold. The heap grows monotonically here because the dev
// server compiles each visited route on demand and retains it, so the restart
// lands late in the shard — exactly when this test runs. A restart is
// therefore treated below as a transient, self-healing event, not a link
// failure: a pass that leaves failures behind waits until the server answers
// again and retries only the failed links once. A link that fails twice —
// once warm, once after a restart — is a real failure.
const LINK_REQUEST_TIMEOUT_MS = 15_000;
// After a restart every route is cold and must recompile, so the retry pass
// gets a longer per-request timeout and fewer concurrent compilations.
const LINK_RETRY_REQUEST_TIMEOUT_MS = 30_000;
const LINK_CHECK_CONCURRENCY = 5;
const LINK_RETRY_CONCURRENCY = 2;
// A `next dev` restart cycle (exit 77, CLI relaunch, first route compile)
// takes tens of seconds; poll until the server answers again.
const SERVER_READY_TIMEOUT_MS = 120_000;
const SERVER_READY_POLL_MS = 2_000;

type LinkFailure = { href: string; message: string };

async function assertSuccessfulResponse(
  request: APIRequestContext,
  href: string,
  context: string,
  timeoutMs: number = LINK_REQUEST_TIMEOUT_MS,
) {
  const response = await request.get(href, { maxRedirects: 10, timeout: timeoutMs });
  expect(response.status(), `${context}: ${href} returned ${response.status()}`).toBeLessThan(400);
}

async function checkLinks(
  request: APIRequestContext,
  hrefs: string[],
  context: string,
  options: { timeoutMs: number; concurrency: number },
): Promise<LinkFailure[]> {
  const failures: LinkFailure[] = [];
  let next = 0;
  async function worker() {
    while (next < hrefs.length) {
      const href = hrefs[next++];
      try {
        await assertSuccessfulResponse(request, href, context, options.timeoutMs);
      } catch (error) {
        failures.push({
          href,
          message: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(options.concurrency, hrefs.length) }, () => worker()),
  );
  return failures;
}

async function waitForServerReady(request: APIRequestContext): Promise<boolean> {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      const response = await request.get('/', { maxRedirects: 5, timeout: 5_000 });
      if (response.status() < 400) return true;
    } catch {
      // Server is down or still restarting; keep polling until the deadline.
    }
    await new Promise((resolve) => setTimeout(resolve, SERVER_READY_POLL_MS));
  }
  return false;
}

async function assertAllLinksResolve(
  request: APIRequestContext,
  hrefs: string[],
  context: string,
) {
  let failures = await checkLinks(request, hrefs, context, {
    timeoutMs: LINK_REQUEST_TIMEOUT_MS,
    concurrency: LINK_CHECK_CONCURRENCY,
  });
  if (failures.length > 0) {
    // Do not report restart-aborted requests as broken links: the dev server
    // may have restarted under the first pass. Wait for it to answer again,
    // then retry only the links that failed.
    const ready = await waitForServerReady(request);
    if (ready) {
      failures = await checkLinks(
        request,
        failures.map((failure) => failure.href),
        context,
        { timeoutMs: LINK_RETRY_REQUEST_TIMEOUT_MS, concurrency: LINK_RETRY_CONCURRENCY },
      );
    }
  }
  expect(
    failures,
    `${context}: ${failures.length} link(s) failed to resolve:\n${failures
      .map((failure) => `${failure.href}: ${failure.message}`)
      .join('\n')}`,
  ).toEqual([]);
}

async function collectInternalLinks(page: Page, selector: string): Promise<string[]> {
  const hrefs = (await page.locator(selector).evaluateAll((links) =>
    links.map((link) => link.getAttribute('href')),
  )) as (string | null)[];
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

  // The legacy WorkKeys route redirects to a URL with a fragment. When the
  // browser is already on that exact URL, Playwright's same-document goto can
  // return null despite the page being loaded. Check the actual canonical HTTP
  // response without dropping any visible content, console or runtime assertions.
  // All other navigations still require a non-null browser response.
  // A newly created Playwright page is about:blank, not an HTTP URL base.
  // Resolve same-document fragment navigation only after a real page loads.
  const currentUrl = page.url();
  const target = /^https?:\/\//.test(currentUrl) ? new URL(route, currentUrl) : null;
  const sameHashDocument = Boolean(target?.hash && target.href === currentUrl);
  const response = sameHashDocument
    ? await page.request.get(currentUrl, { maxRedirects: 10, timeout: 30_000 })
    : await page.goto(route, { waitUntil: 'domcontentloaded' });
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
    timeout: 15_000,
  }).toBeGreaterThan(80);
  const body = await visibleBody.innerText();
  for (const placeholder of FORBIDDEN_PLACEHOLDERS) {
    expect(body, `${route} contains forbidden placeholder: ${placeholder}`).not.toContain(placeholder);
  }
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

  // The link checks run FIRST, while the dev server's heap is still low (only
  // `/` compiled). The 25 page renders below each compile a route on demand
  // and retain it, pushing the heap toward Next's 80%-of-limit dev restart
  // threshold; run 45254389225 showed the restart landing exactly on the link
  // test when it ran last. The page tests each have their own retries, so an
  // occasional restart there costs a retry, not the shard.
  test('every homepage header and footer internal link resolves', async ({ page, request }) => {
    // Headroom above the 60s global test timeout for a cold / under-load dev
    // server, plus a full restart cycle (see assertAllLinksResolve).
    test.setTimeout(300_000);
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const links = await collectInternalLinks(page, 'header a[href], footer a[href]');
    expect(links.length, 'No internal header or footer links were discovered').toBeGreaterThan(5);
    await assertAllLinksResolve(request, links, 'navigation integrity');
  });

  test('program directory links resolve', async ({ page, request }) => {
    test.setTimeout(300_000);
    await page.goto('/programs', { waitUntil: 'domcontentloaded' });
    const links = await collectInternalLinks(page, 'main a[href^="/programs/"]');
    expect(links.length, 'No program links were discovered').toBeGreaterThan(0);
    await assertAllLinksResolve(request, links, 'program route');
  });

  const destinationByAlias = new Map([['/for-students', '/programs'], ['/for-employers', '/employers']]);
  for (const route of [...CRITICAL_PUBLIC_ROUTES, ...CRITICAL_PROGRAM_ROUTES]) {
    test(`${route} renders without runtime failure`, async ({ page }) => {
      await assertNoRuntimeFailure(page, route, destinationByAlias.get(route));
    });
  }
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

    // The mobile drawer nav is deliberately named "Site navigation" — the same
    // name the public navigation audit (tests/e2e/helpers/public-navigation-audit.ts)
    // and the other responsive specs assert. There is no navigation named
    // "Mobile navigation" anywhere in the app; the old name here failed on
    // every attempt in run 45266295624.
    const mobileNav = page.getByRole('navigation', { name: 'Site navigation', exact: true });
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
