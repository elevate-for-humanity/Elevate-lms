import { test, expect, type Page } from '@playwright/test';

const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.elevateforhumanity.org';
const APPRENTICE_EMAIL = process.env.E2E_APPRENTICE_EMAIL || '';
const APPRENTICE_PASSWORD = process.env.E2E_APPRENTICE_PASSWORD || '';
const HOST_EMAIL = process.env.E2E_HOST_SHOP_EMAIL || '';
const HOST_PASSWORD = process.env.E2E_HOST_SHOP_PASSWORD || '';

async function login(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  const emailInput = page.locator('input[type="email"], input[name="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submit = page.locator('button[type="submit"]').first();

  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();
  await expect(submit).toBeVisible();

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.waitForTimeout(250);
  await submit.click();
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 });
}

async function assertResponsivePage(page: Page, path: string) {
  const response = await page.goto(`${BASE}${path}`, { waitUntil: 'domcontentloaded' });
  expect(response?.status() ?? 200, `${path} returned server error`).toBeLessThan(500);
  expect(page.url(), `${path} unexpectedly returned to login`).not.toMatch(/\/login(?:\?|$)/);
  expect(page.url(), `${path} redirected to unauthorized`).not.toContain('/unauthorized');

  await page.waitForLoadState('networkidle').catch(() => {});

  const geometry = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scrollWidth = Math.max(doc.scrollWidth, body?.scrollWidth || 0);
    const main = document.querySelector('main') || document.querySelector('[role="main"]') || body;
    const mainRect = main?.getBoundingClientRect();

    const visibleCritical = Array.from(
      document.querySelectorAll('button, input, select, textarea, a[href]'),
    ).filter((element) => {
      const el = element as HTMLElement;
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    });

    const clippedCritical = visibleCritical
      .filter((element) => {
        const rect = (element as HTMLElement).getBoundingClientRect();
        return rect.right > viewportWidth + 2 || rect.left < -2;
      })
      .slice(0, 10)
      .map((element) => ({
        tag: element.tagName,
        text: ((element as HTMLElement).innerText || element.getAttribute('aria-label') || '').trim().slice(0, 80),
        href: element.getAttribute('href'),
      }));

    return {
      viewportWidth,
      viewportHeight,
      scrollWidth,
      mainWidth: mainRect?.width || 0,
      mainHeight: mainRect?.height || 0,
      clippedCritical,
    };
  });

  expect(
    geometry.scrollWidth,
    `${path} has page-level horizontal overflow: scrollWidth=${geometry.scrollWidth}, viewport=${geometry.viewportWidth}`,
  ).toBeLessThanOrEqual(geometry.viewportWidth + 2);

  expect(geometry.mainWidth, `${path} primary content has zero width`).toBeGreaterThan(0);
  expect(geometry.mainHeight, `${path} primary content has zero height`).toBeGreaterThan(0);
  expect(geometry.clippedCritical, `${path} has clipped critical controls`).toEqual([]);

  const mobile = geometry.viewportWidth < 768;
  if (mobile) {
    const tinyCritical = await page.evaluate(() =>
      Array.from(document.querySelectorAll('button, input, select, textarea'))
        .filter((element) => {
          const el = element as HTMLElement;
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden' || rect.width === 0 || rect.height === 0) return false;
          return rect.height < 32 || rect.width < 32;
        })
        .slice(0, 10)
        .map((element) => ({
          tag: element.tagName,
          text: ((element as HTMLElement).innerText || element.getAttribute('aria-label') || '').trim().slice(0, 80),
        })),
    );
    expect(tinyCritical, `${path} has undersized mobile form/button controls`).toEqual([]);
  }
}

test.describe('Authenticated portal responsive design certification', () => {
  test.describe('Apprentice', () => {
    test.skip(!APPRENTICE_EMAIL || !APPRENTICE_PASSWORD, 'Disposable Apprentice identity is required');

    test('critical Apprentice surfaces fit the active device viewport', async ({ page }, testInfo) => {
      await login(page, APPRENTICE_EMAIL, APPRENTICE_PASSWORD);
      for (const path of [
        '/apprentice',
        '/apprentice/hours',
        '/apprentice/rti',
        '/apprentice/competencies',
        '/apprentice/documents',
        '/apprentice/attendance',
        '/apprentice/profile',
        '/apprentice/handbook',
      ]) {
        await test.step(`${testInfo.project.name}: ${path}`, async () => assertResponsivePage(page, path));
      }
      await page.screenshot({ path: testInfo.outputPath(`apprentice-${testInfo.project.name}.png`), fullPage: true });
    });
  });

  test.describe('Host Shop', () => {
    test.skip(!HOST_EMAIL || !HOST_PASSWORD, 'Disposable Host Shop identity is required');

    test('critical Host Shop surfaces fit the active device viewport', async ({ page }, testInfo) => {
      await login(page, HOST_EMAIL, HOST_PASSWORD);
      for (const path of [
        '/host-shop/dashboard',
        '/host-shop/dashboard/apprentices',
        '/host-shop/dashboard/hours/pending',
        '/host-shop/dashboard/documents',
        '/host-shop/dashboard/competencies',
        '/host-shop/dashboard/attendance/record',
        '/host-shop/dashboard/wages',
        '/host-shop/dashboard/reports',
        '/host-shop/dashboard/profile',
      ]) {
        await test.step(`${testInfo.project.name}: ${path}`, async () => assertResponsivePage(page, path));
      }
      await page.screenshot({ path: testInfo.outputPath(`host-shop-${testInfo.project.name}.png`), fullPage: true });
    });
  });
});
