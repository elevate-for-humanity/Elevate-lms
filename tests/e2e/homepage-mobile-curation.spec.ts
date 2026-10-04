import { expect, test } from '@playwright/test';

// Read-only public tests. Point PLAYWRIGHT_BASE_URL at the candidate deployment.
const SHOPS = ["Cal's Kutz Studio", "Razor's Image Barbershop", 'Salon Saloon', 'Kountry Kutz Barbershop'];

for (const width of [320, 390, 768, 1440]) {
  test(`curated homepage at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const home = page.locator('main[data-homepage-curation="20261004"]');
    await expect(home).toBeVisible();
    const cards = home.locator('[data-featured-shop]');
    await expect(cards).toHaveCount(4);
    expect(await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-featured-shop')))).toEqual(SHOPS);
    for (const image of await cards.locator('img').all()) {
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    }
    const grid = home.locator('[data-featured-shops]');
    const columns = await grid.evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(' ').length);
    expect(columns).toBe(width >= 1024 ? 4 : 2);
    const boxes = await cards.evaluateAll((nodes) => nodes.map((node) => {
      const box = node.querySelector('img')!.getBoundingClientRect();
      return { width: box.width, height: box.height, left: box.left, right: box.right };
    }));
    for (const box of boxes) {
      expect(Math.abs(box.width / box.height - 4 / 3)).toBeLessThan(0.03);
      expect(box.left).toBeGreaterThanOrEqual(0);
      expect(box.right).toBeLessThanOrEqual(width + 1);
    }
    const nav = page.getByRole('navigation', { name: 'Footer programs' });
    if (width < 768) {
      const button = page.locator('footer').getByRole('button', { name: 'Programs', exact: true });
      await expect(button).toHaveAttribute('aria-expanded', 'false');
      await expect(nav).toBeHidden();
      await button.click();
      await expect(nav).toBeVisible();
      await button.click();
      await expect(nav).toBeHidden();
    } else {
      await expect(nav).toBeVisible();
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    await home.scrollIntoViewIfNeeded();
    await testInfo.attach(`homepage-${width}`, { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
  });
}

for (const route of ['/programs/hvac-technician', '/programs/cdl-training', '/programs/bookkeeping', '/programs/business', '/programs/barber-apprenticeship', '/programs/cosmetology-apprenticeship']) {
  test(`public mobile reading layout: ${route}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response?.ok()).toBe(true);
    await expect(page.locator('#main-content.site-main')).toBeVisible();
    await expect(page.locator('footer[data-public-footer]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const steps = page.getByRole('button', { name: 'Your 10 enrollment and completion steps' });
    if (route.endsWith('apprenticeship')) {
      await expect(steps).toHaveAttribute('aria-expanded', 'false');
      await steps.click();
      await expect(steps).toHaveAttribute('aria-expanded', 'true');
      const panelId = await steps.getAttribute('aria-controls');
      expect(await page.evaluate((id) => id ? document.getElementById(id)?.hidden : true, panelId)).toBe(false);
      await expect(page.getByText('Wages and tuition are separate.', { exact: true })).toBeVisible();
    }
  });
}
