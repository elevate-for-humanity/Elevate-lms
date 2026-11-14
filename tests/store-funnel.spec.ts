import { test, expect } from '@playwright/test';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

async function expectRouteHealthy(request: any, path: string) {
  const response = await request.get(`${baseURL}${path}`, { maxRedirects: 5 });
  expect(response.status(), `${path} should not return 4xx/5xx`).toBeLessThan(400);
}

test.describe('Store funnel release contract', () => {
  test('core store routes and legacy demo compatibility routes resolve', async ({ request }) => {
    for (const path of [
      '/store',
      '/store/plans',
      '/store/trial',
      '/store/demo/admin',
      '/store/demo/student',
      '/store/demo/employer',
      '/store/demo/institutional',
      '/store/demo/crm',
      '/store/demo/lms',
      '/store/demo/website',
      '/store/demo/capability/crm',
      '/store/demo/capability/lms',
    ]) {
      await expectRouteHealthy(request, path);
    }
  });

  test('all Store-owned links on the main page resolve', async ({ page, request }) => {
    await page.goto(`${baseURL}/store`);
    const hrefs = await page.locator('a[href]').evaluateAll((anchors) =>
      [...new Set(anchors.map((anchor) => anchor.getAttribute('href')).filter((href): href is string => Boolean(href && href.startsWith('/store'))))],
    );

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      const path = href.split('#')[0];
      if (!path) continue;
      await expectRouteHealthy(request, path);
    }
  });

  test('marketplace exposes active filter state and normalized CTA language', async ({ page }) => {
    await page.goto(`${baseURL}/store#marketplace`);
    const all = page.getByRole('button', { name: 'All', exact: true });
    await expect(all).toHaveAttribute('aria-pressed', 'true');

    const education = page.getByRole('button', { name: 'Education', exact: true });
    await education.click();
    await expect(education).toHaveAttribute('aria-pressed', 'true');
    await expect(all).toHaveAttribute('aria-pressed', 'false');

    await expect(page.getByText('Demo + Subscription')).toHaveCount(0);
    await expect(page.getByText('View / Start')).toHaveCount(0);
    await expect(page.getByText('See How It Works').first()).toBeVisible();
  });

  test('guided setup carries recommendations into trial', async ({ page }) => {
    await page.goto(`${baseURL}/store#guided-setup`);
    await page.getByRole('button', { name: 'Start or grow a business' }).click();
    await page.getByRole('button', { name: 'Small business' }).click();

    const guidedTrial = page.getByRole('link', { name: 'Start guided trial' });
    await expect(guidedTrial).toHaveAttribute('href', /recommended=/);
    await guidedTrial.click();
    await expect(page).toHaveURL(/\/store\/trial\?/);
    await expect(page.getByText('Your guided recommendations will carry forward')).toBeVisible();
  });

  test('ROI labels remain separate on a mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseURL}/store`);
    const roi = page.getByText('ROI Calculator').locator('..').locator('..');
    await expect(page.getByText('Students per Year')).toBeVisible();
    const body = await page.textContent('body');
    expect(body).not.toContain('1050500');
    await expect(page.getByText('10', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('500', { exact: true }).first()).toBeVisible();
    expect(await roi.count()).toBeGreaterThanOrEqual(0);
  });
});
