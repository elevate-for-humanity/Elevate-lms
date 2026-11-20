import { test, expect } from '@playwright/test';

const viewports = [
  { width: 375, height: 667, name: 'phone' },
  { width: 414, height: 896, name: 'large phone' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 1024, height: 768, name: 'tablet landscape' },
  { width: 1366, height: 768, name: 'laptop' },
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 2560, height: 1440, name: 'large desktop' },
] as const;

test.describe('Homepage responsive acceptance', () => {
  for (const viewport of viewports) {
    test(`renders the canonical homepage at ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.goto('/', { waitUntil: 'domcontentloaded' });

      await expect(
        page.getByRole('heading', { level: 1, name: 'Train for your next career.' }),
      ).toBeVisible();

      const hero = page.getByRole('region', {
        name: 'Train for your next career.',
        exact: true,
      });
      const primary = hero.getByRole('link', {
        name: 'Explore Career Training',
        exact: true,
      });
      const funding = hero.getByRole('link', {
        name: 'Check Funding Options',
        exact: true,
      });
      await expect(primary).toHaveAttribute('href', '/programs');
      await expect(funding).toHaveAttribute('href', '/check-eligibility');

      for (const link of [primary, funding]) {
        const box = await link.boundingBox();
        expect(box?.height, `${viewport.name} CTA height`).toBeGreaterThanOrEqual(44);
      }

      const dimensions = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));
      expect(dimensions.scrollWidth, viewport.name).toBeLessThanOrEqual(
        dimensions.clientWidth + 1,
      );

      const grid = page.locator('[data-featured-shops]');
      await expect(grid).toBeVisible();
      const columns = await grid.evaluate(
        (element) => getComputedStyle(element).gridTemplateColumns.split(' ').length,
      );
      expect(columns).toBe(viewport.width < 640 ? 1 : viewport.width < 1024 ? 2 : 3);

      const images = grid.getByRole('img');
      await expect(images).toHaveCount(4);
      for (const image of await images.all()) {
        await image.scrollIntoViewIfNeeded();
        await expect
          .poll(() =>
            image.evaluate(
              (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
            ),
          )
          .toBe(true);
        expect(await image.getAttribute('alt')).toBeTruthy();
      }

      await testInfo.attach(`homepage-responsive-${viewport.width}`, {
        body: await page.screenshot({ fullPage: true }),
        contentType: 'image/png',
      });
    });
  }

  test('phone navigation and footer disclosures remain keyboard-operable', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const menu = page.getByRole('button', { name: 'Open menu', exact: true });
    await expect(menu).toBeVisible();
    await menu.focus();
    await page.keyboard.press('Enter');

    const navigation = page.getByRole('navigation', { name: 'Site navigation' });
    await expect(navigation).toBeVisible();
    const programs = navigation.getByRole('button', { name: 'Programs', exact: true });
    await programs.focus();
    await page.keyboard.press('Enter');
    await expect(programs).toHaveAttribute('aria-expanded', 'true');

    const footerApprenticeships = page
      .locator('footer summary')
      .filter({ hasText: /^Apprenticeships$/ });
    await footerApprenticeships.focus();
    await page.keyboard.press('Enter');
    await expect(
      page.getByRole('navigation', { name: 'Footer apprenticeships' }),
    ).toBeVisible();
  });

  test('homepage keeps one primary heading and labeled imagery', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const images = page.getByRole('img');
    const count = await images.count();
    for (let index = 0; index < count; index += 1) {
      const image = images.nth(index);
      const alt = await image.getAttribute('alt');
      const hidden = await image.getAttribute('aria-hidden');
      expect(alt !== null || hidden === 'true', `image ${index} accessibility`).toBe(true);
    }
  });
});
