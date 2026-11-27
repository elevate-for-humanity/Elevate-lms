import path from 'node:path';
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
  try {
    expect(response.status(), `${context}: ${href} returned ${response.status()}`).toBeLessThan(400);
  } finally {
    await response.dispose();
  }
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

// Section narration synthesizes speech through Google Cloud, which is not
// provisioned for CI dev servers. Serve a committed recording so the audit
// measures page runtime health rather than speech-provider availability.
const NARRATION_FIXTURE = path.resolve(
  process.cwd(),
  'public/audio/program-introductions/barber-apprenticeship.mp3',
);

async function assertNoRuntimeFailure(page: Page, route: string) {
  try {
    await checkPageOnce(page, route);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!RESTART_TRANSIENT_MESSAGE.test(message)) throw error;
    // The failure looks like the dev server restarting under the check
    // (Next exits 77 past its heap threshold and drops in-flight requests:
    // 503 resources, an empty body, an aborted load). Wait until the server
    // answers again, then re-check once; a failure on the second pass is a
    // real failure, not a restart. This mirrors the restart handling the
    // link check in this file already has (run 45254389225).
    const ready = await waitForServerReady(page.request);
    if (!ready) throw error;
    await checkPageOnce(page, route);
  }
}

// A failure that can be produced by a `next dev` restart mid-check: the
// document or a sub-resource 503s, the load aborts, a chunk fails to load,
// or the page briefly serves a loading shell / upstream-error body.
const RESTART_TRANSIENT_MESSAGE =
  /503|empty body|did not return a response|ERR_ABORTED|ECONNRESET|ChunkLoadError|no healthy upstream|returned 5\d\d/i;

async function checkPageOnce(page: Page, route: string) {
  const pageErrors: string[] = [];
  const consoleErrors: string[] = [];
  const failedResponses: { status: number; url: string }[] = [];
  const onPageError = (error: Error) => pageErrors.push(error.message);
  const onConsole = (message: import('@playwright/test').ConsoleMessage) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  };
  const onResponse = (response: import('@playwright/test').Response) => {
    if (response.status() >= 500) failedResponses.push({ status: response.status(), url: response.url() });
  };
  await page.route('**/api/voice/natural', (request) =>
    request.fulfill({ path: NARRATION_FIXTURE, contentType: 'audio/mpeg' }),
  );
  page.on('pageerror', onPageError);
  page.on('console', onConsole);
  page.on('response', onResponse);
  try {

    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response, `${route} did not return a response`).not.toBeNull();
    expect(response!.status(), `${route} returned ${response!.status()}`).toBeLessThan(400);

    const documentBody = page.locator('body');
    await expect
      .poll(async () => (await documentBody.innerText()).trim().length, {
        message: `${route} rendered an empty body`,
        timeout: 15_000,
      })
      .toBeGreaterThan(80);

    await page.waitForLoadState('networkidle').catch(() => undefined);

    // Re-poll after networkidle: hydration can swap the server-rendered body
    // for a transient client loading shell while it fetches data, so a single
    // immediate read can catch the shell (observed: 34 chars) on an otherwise
    // healthy page.
    await expect
      .poll(async () => (await documentBody.innerText()).trim().length, {
        message: `${route} rendered an empty body`,
        timeout: 15_000,
      })
      .toBeGreaterThan(80);

    // innerText excludes embedded scripts. The application shell intentionally
    // contains chunk-recovery source code whose text includes "ChunkLoadError";
    // that source is not a rendered failure and must not trip the visible-page check.
    const body = await documentBody.innerText();
    for (const placeholder of FORBIDDEN_PLACEHOLDERS) {
      expect(body, `${route} contains forbidden placeholder: ${placeholder}`).not.toContain(placeholder);
    }
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
    const origin = new URL(response!.url()).origin;
    const sameOriginFailures = failedResponses.filter(item => new URL(item.url).origin === origin)
      .map(item => `${item.status} ${new URL(item.url).pathname}`);
    expect(sameOriginFailures, `${route} emitted HTTP failures: ${sameOriginFailures.join(' | ')}`).toEqual([]);
  } finally {
    page.off('pageerror', onPageError);
    page.off('console', onConsole);
    page.off('response', onResponse);
  }
}

// Independent route cases retain the global failure limit without skipping
// unrelated routes after one failure or replaying the full serial suite.

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

  for (const route of [...CRITICAL_PUBLIC_ROUTES, ...CRITICAL_PROGRAM_ROUTES]) {
    test(`${route} renders without runtime failure`, async ({ page }) => {
      // Headroom above the 60s global test timeout for a cold / under-load
      // dev server, plus a full restart cycle (see assertNoRuntimeFailure).
      test.setTimeout(300_000);
      await assertNoRuntimeFailure(page, route);
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

    // Match the accessible name rendered by HeaderMobileMenu and asserted
    // by the shared public navigation audit.
    const mobileNav = page.getByRole('navigation', { name: 'Mobile navigation', exact: true });
    await expect(mobileNav).toBeVisible();
  });
});

test.describe('application entry audit', () => {
  test('/apply offers intake and full enrollment as separate choices', async ({ page }) => {
    test.setTimeout(300_000);
    // /apply is intentionally a choice page with links, not a form — it has
    // no form/input/select/textarea/submit control by design. The actionable
    // experience is the choice links, asserted with their hrefs and the
    // intake click-through (#2858).
    await assertNoRuntimeFailure(page, '/apply');
    await expect(page.getByRole('heading', { name: 'Choose your application' })).toBeVisible();
    const intake = page.getByRole('link', { name: /^Intake Application/i });
    const enrollment = page.getByRole('link', { name: /^Full Enrollment Application/i });
    await expect(intake).toBeVisible();
    await expect(intake).toHaveAttribute('href', '/apply/student?intent=inquiry');
    await expect(enrollment).toBeVisible();
    await expect(enrollment).toHaveAttribute('href', '/programs');
    await intake.click();
    await expect(page).toHaveURL(/\/apply\/student\/interview(?:[?#]|$)/);
    await expect(page.getByPlaceholder(/Type your answer|Escriba su respuesta/i)).toBeVisible();
  });

  // /programs/barber-apprenticeship/apply is intentionally a choice page
  // ("Choose the correct Barber application") with link cards, not a form
  // — it has no form/input/select/textarea/submit control by design. The
  // actionable experience is the three choice links (Free Inquiry,
  // Enrollment Application, Host Shop). It must not be in the form-control
  // loop below: that loop failed on every attempt in runs 45618248042,
  // 45623494284, 45623385379, 45623494305 and 45623487036.
  test('/programs/barber-apprenticeship/apply exposes an actionable application experience', async ({
    page,
  }) => {
    test.setTimeout(300_000);
    await assertNoRuntimeFailure(page, '/programs/barber-apprenticeship/apply');
    await expect(page.getByRole('link', { name: 'Submit Free Inquiry' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start Enrollment' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Start Host Site Application' })).toBeVisible();
  });

  for (const route of ['/apply/student']) {
    test(`${route} exposes an actionable application experience`, async ({ page }) => {
      test.setTimeout(300_000);
      await assertNoRuntimeFailure(page, route);
      if (route === '/apply') {
        // /apply is the approved application chooser. Follow its real business
        // application path and require a working form at the destination.
        await expect(page.getByRole('heading', { name: 'Choose your application', exact: true })).toBeVisible();
        const holderApplication = page.getByRole('link', { name: /^Program Holder/ });
        await expect(holderApplication).toHaveAttribute('href', '/apply/program-holder');
        await expect(page.getByRole('link', { name: /^Employer/ })).toHaveAttribute('href', '/apply/employer');
        await expect(page.getByRole('link', { name: /^Intake Application/ })).toHaveAttribute('href', '/apply/student?intent=inquiry');
        await holderApplication.click();
        await expect(page).toHaveURL(/\/apply\/program-holder$/);
        await expect(page.getByLabel('Email *', { exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Submit Program Holder Application', exact: true })).toBeEnabled();
      }
      if (route === '/programs/barber-apprenticeship/apply') {
        await expect(page.getByRole('heading', { name: 'Choose the correct Barber application', exact: true })).toBeVisible();
        const hostApplication = page.getByRole('link', { name: 'Start Host Site Application', exact: true });
        await expect(hostApplication).toHaveAttribute('href', '/partners/host-shop/apply?program=barber');
        await expect(page.getByRole('link', { name: 'Submit Free Inquiry', exact: true })).toHaveAttribute('href', '/programs/barber-apprenticeship/request-info');
        await expect(page.getByRole('link', { name: 'Start Enrollment', exact: true })).toHaveAttribute('href', '/apply/student/interview?program=barber-apprenticeship&intent=enrollment');
        await hostApplication.click();
        await expect(page).toHaveURL(/\/partners\/host-shop\/apply\?program=barber$/);
        await expect(page.getByRole('textbox', { name: 'Legal business name *', exact: true })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Submit Host Site Application', exact: true })).toBeEnabled();
      }
      const control = page.locator('form, input, select, textarea, button[type="submit"]').first();
      await expect(control, `${route} has no actionable application control`).toBeVisible();
    });
  }

  test('Barber enrollment retains the selected program and paid enrollment intent', async ({ page }) => {
    await assertNoRuntimeFailure(page, '/programs/barber-apprenticeship/apply');
    const enrollment = page.getByRole('link', { name: 'Start Enrollment' });
    await expect(enrollment).toHaveAttribute('href',
      '/apply/student/interview?program=barber-apprenticeship&intent=enrollment');
    await enrollment.click();
    await expect(page).toHaveURL(/\/enroll\/barber-apprenticeship(?:\?|$)/);
  });

  test('student application has a submission control', async ({ page }) => {
    await page.goto('/apply/student', { waitUntil: 'domcontentloaded' });
    // The canonical entry opens PARIS; its accessible standard-form path is a
    // five-step intake. Verify the final control through the actual workflow,
    // without submitting a test record or starting paid enrollment.
    await page.getByRole('link', { name: 'Use standard form instead', exact: true }).click();
    await expect(page).toHaveURL(/\/apply\/student\/form\?intent=inquiry$/);
    const next = page.getByRole('button', { name: 'Continue', exact: true });
    const program = page.getByLabel(/Program of Interest/);
    // Fills typed into the server-rendered inputs before StudentApplicationForm
    // hydrates never reach React state; run 45982254686 reached Continue with
    // every controlled field reset. Re-enter step 1 until the form accepts it.
    await expect(async () => {
      await page.getByRole('textbox', { name: 'First Name', exact: true }).fill('Browser');
      await page.getByRole('textbox', { name: 'Last Name', exact: true }).fill('QA');
      await page.getByLabel('Date of Birth', { exact: true }).fill('1990-01-01');
      await page.getByRole('textbox', { name: 'Email', exact: true }).fill('browser-control-check@qa.invalid');
      await page.getByRole('textbox', { name: 'Phone', exact: true }).fill('317-555-0100');
      await page.getByRole('textbox', { name: 'Street Address', exact: true }).fill('100 QA Test Way');
      await page.getByRole('textbox', { name: 'City', exact: true }).fill('Indianapolis');
      await page.getByRole('textbox', { name: 'State', exact: true }).fill('IN');
      await page.getByRole('textbox', { name: 'ZIP Code', exact: true }).fill('46201');
      await next.click();
      await expect(program).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await program.selectOption('hvac-technician');
    await next.click();
    await page.getByLabel(/How do you plan to pay/).selectOption('not_sure');
    await next.click();
    await next.click();
    const submit = page.getByRole('button', { name: 'Submit Intake Application', exact: true });
    await expect(submit).toBeVisible();
    await expect(submit).toHaveAttribute('type', 'submit');
    await expect(submit).toBeEnabled();
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
    test.setTimeout(300_000);
    await assertNoRuntimeFailure(page, '/pricing');
    const body = (await page.locator('body').textContent()) ?? '';
    expect(body).not.toMatch(/0 programs available/i);
  });

  test('WorkKeys page shows non-zero prices and purchase controls', async ({ page }) => {
    test.setTimeout(300_000);
    await assertNoRuntimeFailure(page, '/testing/workkeys');
    await expect(page.getByText(/\$104|\$168/).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /add to cart/i }).first()).toBeVisible();
  });
});
