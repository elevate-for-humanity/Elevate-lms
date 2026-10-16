import { test, expect } from '@playwright/test';

// Read-only rendering checks. Production application submission is intentionally
// excluded: it requires a controlled test account and database cleanup contract.
for (const route of ['/', '/programs', '/programs/bookkeeping', '/programs/hvac-technician', '/apply/student', '/partners/host-shop/apply', '/funding/workone-intake']) {
  test(`${route}: readable, responsive, working images`, async ({ page }, testInfo) => {
    const response = await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 90000 });
    expect(response?.status()).toBeLessThan(400);
    expect(new URL(page.url()).pathname).toBe(route);
    await expect(page.locator('main').first()).toBeVisible();
    await expect(page.locator('h1').first()).toBeVisible();
    if (route === '/') {
      const trigger = page.getByRole('button', { name: 'Open menu', exact: true });
      if (await trigger.isVisible()) {
        await trigger.click();
        const menu = page.getByRole('dialog', { name: 'Menu', exact: true });
        await expect(menu).toBeVisible();
        await expect(menu.getByRole('link', { name: 'Testing Center', exact: true })).toHaveAttribute('href', '/testing');
        const bounds = await menu.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(testInfo.project.use.viewport!.width);
        await page.screenshot({ path: testInfo.outputPath('navigation-open.png') });
        if (testInfo.project.use.viewport!.width === 1179) {
          const originalViewport = page.viewportSize()!;
          await page.setViewportSize({ ...originalViewport, width: 1180 });
          await expect(menu).toBeHidden();
          await expect.poll(() => page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
          await page.setViewportSize(originalViewport);
          await trigger.click();
          await expect(menu).toBeVisible();
        }
        await page.keyboard.press('Escape');
        await expect(menu).toBeHidden();
        await expect(trigger).toBeFocused();
      }
    }
    const geometry = await page.evaluate(() => {
      const root = document.documentElement;
      return { viewport: innerWidth, content: root.scrollWidth, heading: getComputedStyle(document.querySelector('h1')!).fontSize };
    });
    expect(geometry.content).toBeLessThanOrEqual(geometry.viewport + 1);
    expect(parseFloat(geometry.heading)).toBeGreaterThanOrEqual(24);
    if (route === '/programs') {
      const choices = page.getByRole('group', { name: 'Featured programs' }).getByRole('button');
      for (const choice of await choices.all()) {
        const bounds = await choice.boundingBox();
        expect(bounds).not.toBeNull();
        expect(bounds!.x).toBeGreaterThanOrEqual(0);
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(testInfo.project.use.viewport!.width);
        expect(bounds!.width).toBeGreaterThanOrEqual(44);
        expect(bounds!.height).toBeGreaterThanOrEqual(44);
      }
      await choices.last().click();
      await expect(page.getByRole('heading', { name: 'Certified Nursing Assistant', exact: true })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Program details' })).toHaveAttribute('href', '/programs/cna');
      await choices.first().click();
    }
    // Visit each visible image so lazy assets load before checking or capturing
    // the whole page. A still-pending request must not count as a passing image.
    for (const image of await page.locator('main img').all()) {
      if (!(await image.isVisible())) continue;
      await image.scrollIntoViewIfNeeded();
      await expect.poll(() => image.evaluate(element => {
        const img = element as HTMLImageElement;
        return img.complete ? img.naturalWidth : 0;
      })).toBeGreaterThan(0);
    }
    await page.locator('h1').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: testInfo.outputPath('render.png'), fullPage: true });
  });
}
