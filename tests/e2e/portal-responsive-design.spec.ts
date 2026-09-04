import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.elevateforhumanity.org';
const ADMIN_BASE = 'https://admin.elevateforhumanity.org';
const MARKETING_BASE = 'https://www.elevateforhumanity.org';

const creds = {
  apprentice: [process.env.E2E_APPRENTICE_EMAIL || '', process.env.E2E_APPRENTICE_PASSWORD || ''],
  hostShop: [process.env.E2E_HOST_SHOP_EMAIL || '', process.env.E2E_HOST_SHOP_PASSWORD || ''],
  learner: [process.env.E2E_LEARNER_EMAIL || '', process.env.E2E_LEARNER_PASSWORD || ''],
  programHolder: [process.env.E2E_PROGRAM_HOLDER_EMAIL || '', process.env.E2E_PROGRAM_HOLDER_PASSWORD || ''],
  employer: [process.env.E2E_EMPLOYER_EMAIL || '', process.env.E2E_EMPLOYER_PASSWORD || ''],
  instructor: [process.env.E2E_INSTRUCTOR_EMAIL || '', process.env.E2E_INSTRUCTOR_PASSWORD || ''],
  staff: [process.env.E2E_STAFF_EMAIL || '', process.env.E2E_STAFF_PASSWORD || ''],
  caseManager: [process.env.E2E_CASE_MANAGER_EMAIL || '', process.env.E2E_CASE_MANAGER_PASSWORD || ''],
  admin: [process.env.E2E_ADMIN_EMAIL || '', process.env.E2E_ADMIN_PASSWORD || ''],
} as const;

async function login(page: Page, loginBase: string, email: string, password: string) {
  const response = await page.goto(`${loginBase}/login`, { waitUntil: 'domcontentloaded', timeout: 30_000 });
  expect(response?.status() ?? 200, `${loginBase}/login returned a server error`).toBeLessThan(500);

  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submit = page.locator('button[type="submit"]').first();
  await expect(emailInput).toBeVisible({ timeout: 15_000 });
  await expect(passwordInput).toBeVisible({ timeout: 15_000 });
  await expect(submit).toBeVisible({ timeout: 15_000 });
  await expect(emailInput).toBeEnabled({ timeout: 20_000 });
  await expect(passwordInput).toBeEnabled({ timeout: 20_000 });
  await expect(submit).toBeEnabled({ timeout: 20_000 });
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submit.click();
  // A navigation handled by the installed PWA worker can reject waitForURL even
  // after the browser reaches the authenticated destination. Polling the actual
  // location verifies the user-visible result without coupling auth to the
  // navigation transport.
  await expect.poll(() => new URL(page.url()).pathname, {
    message: `${loginBase} did not leave the login route`,
    timeout: 60_000,
  }).not.toMatch(/\/login(?:\/|$)/);
  await page.waitForLoadState('domcontentloaded').catch(() => undefined);
}

async function assertResponsivePage(page: Page, pathOrUrl: string) {
  const target = /^https?:\/\//.test(pathOrUrl) ? pathOrUrl : `${BASE}${pathOrUrl}`;
  let response: Awaited<ReturnType<Page['goto']>> = null;
  let lastNavigationError: unknown;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      // Installed service workers and slower mobile WebKit can delay the
      // DOMContentLoaded navigation signal after the destination has committed.
      // Certify the rendered document, not that transport-level timing detail.
      response = await page.goto(target, { waitUntil: 'commit', timeout: 30_000 });
      await page.waitForLoadState('domcontentloaded', { timeout: 30_000 });
      lastNavigationError = undefined;
      break;
    } catch (error) {
      lastNavigationError = error;
      if (attempt < 2) await page.waitForTimeout(1_000);
    }
  }
  if (lastNavigationError) throw lastNavigationError;
  expect(response?.status() ?? 200, `${target} returned server error`).toBeLessThan(500);
  expect(page.url(), `${target} unexpectedly returned to login`).not.toMatch(/\/login(?:\?|$)/);
  expect(page.url(), `${target} redirected to unauthorized`).not.toContain('/unauthorized');
  await page.waitForTimeout(500);

  const geometry = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
    const isRendered = (element: Element) => {
      const el = element as HTMLElement;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none'
        && style.visibility !== 'hidden'
        && Number(style.opacity) !== 0
        && !el.closest('[aria-hidden="true"], [inert]')
        && rect.width > 0
        && rect.height > 0;
    };
    const main = Array.from(document.querySelectorAll('main, [role="main"]')).find(isRendered) || body;
    const mainRect = main?.getBoundingClientRect();
    const visibleCritical = Array.from(document.querySelectorAll('button, input, select, textarea, a[href]')).filter((element) => {
      const rect = (element as HTMLElement).getBoundingClientRect();
      // Menus intentionally parked outside the viewport are not visible to the
      // user. Keep partially visible controls in scope so real clipping still
      // fails certification.
      const intersectsViewport = rect.right > 0 && rect.left < viewportWidth
        && rect.bottom > 0 && rect.top < window.innerHeight;
      return isRendered(element) && intersectsViewport;
    });
    const clippedCritical = visibleCritical.filter((element) => {
      const rect = (element as HTMLElement).getBoundingClientRect();
      return rect.right > viewportWidth + 2 || rect.left < -2;
    }).slice(0, 10).map((element) => ({
      tag: element.tagName,
      text: ((element as HTMLElement).innerText || element.getAttribute('aria-label') || '').trim().slice(0, 80),
      href: element.getAttribute('href'),
    }));
    return { viewportWidth, scrollWidth, mainWidth: mainRect?.width || 0, mainHeight: mainRect?.height || 0, clippedCritical };
  });

  expect(geometry.scrollWidth, `${target} has page-level horizontal overflow`).toBeLessThanOrEqual(geometry.viewportWidth + 2);
  expect(geometry.mainWidth, `${target} primary content has zero width`).toBeGreaterThan(0);
  expect(geometry.mainHeight, `${target} primary content has zero height`).toBeGreaterThan(0);
  expect(geometry.clippedCritical, `${target} has clipped critical controls`).toEqual([]);

  if (geometry.viewportWidth < 768) {
    const tinyCritical = await page.evaluate(() => Array.from(document.querySelectorAll('button, input, select, textarea')).filter((element) => {
      const el = element as HTMLElement;
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) return false;
      if (el.classList.contains('sr-only') || el.closest('[aria-hidden="true"]')) return false;
      return rect.height < 32 || rect.width < 32;
    }).slice(0, 10).map((element) => ({ tag: element.tagName, text: ((element as HTMLElement).innerText || element.getAttribute('aria-label') || '').trim().slice(0, 80) })));
    expect(tinyCritical, `${target} has undersized mobile controls`).toEqual([]);
  }
}

async function certify(page: Page, testInfo: any, role: string, credentials: readonly string[], loginBase: string, paths: string[]) {
  await login(page, loginBase, credentials[0], credentials[1]);
  for (const path of paths) await test.step(`${testInfo.project.name}: ${path}`, async () => assertResponsivePage(page, path));
  await page.screenshot({ path: testInfo.outputPath(`${role}-${testInfo.project.name}.png`), fullPage: false });
}

function roleSuite(name: string, key: keyof typeof creds, loginBase: string, paths: string[]) {
  test.describe(name, () => {
    const credentials = creds[key];
    test.skip(!credentials[0] || !credentials[1], `Disposable ${name} identity is required`);
    test(`critical ${name} surfaces fit the active device viewport`, async ({ page }, testInfo) => {
      test.setTimeout(240_000);
      await certify(page, testInfo, key, credentials, loginBase, paths);
    });
  });
}

test.describe('Authenticated portal responsive design certification', () => {
  roleSuite('Apprentice', 'apprentice', BASE, ['/apprentice','/apprentice/hours','/apprentice/rti','/apprentice/competencies','/apprentice/documents','/apprentice/attendance','/apprentice/profile','/apprentice/handbook']);
  roleSuite('Host Shop', 'hostShop', BASE, ['/host-shop/dashboard','/host-shop/dashboard/apprentices','/host-shop/dashboard/hours/pending','/host-shop/dashboard/documents','/host-shop/dashboard/competencies','/host-shop/dashboard/attendance/record','/host-shop/dashboard/wages','/host-shop/dashboard/reports','/host-shop/dashboard/profile']);
  roleSuite('Learner', 'learner', BASE, ['/lms/dashboard','/lms/courses','/lms/certificates','/lms/calendar','/lms/messages','/lms/support','/lms/apply/status']);
  roleSuite('Program Holder', 'programHolder', BASE, ['/program-holder/dashboard','/program-holder/students','/program-holder/portal/students','/program-holder/portal/reports','/program-holder/rights-responsibilities']);
  roleSuite('Employer', 'employer', BASE, ['/employer/dashboard']);
  roleSuite('Instructor', 'instructor', ADMIN_BASE, [`${ADMIN_BASE}/instructor/dashboard`]);
  roleSuite('Staff', 'staff', ADMIN_BASE, [`${ADMIN_BASE}/staff-portal/dashboard`]);
  roleSuite('Case Manager', 'caseManager', MARKETING_BASE, [`${MARKETING_BASE}/case-manager/dashboard`]);
  roleSuite('Admin', 'admin', ADMIN_BASE, [`${ADMIN_BASE}/dashboard`]);
});
