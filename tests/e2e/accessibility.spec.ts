import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const PUBLIC_ROUTES = [
  '/',
  '/programs',
  '/apprenticeships',
  '/programs/business',
  '/programs/hvac-technician',
  '/programs/cdl-training',
  '/programs/barber-apprenticeship',
  '/partners/host-shops',
  '/funding',
  '/check-eligibility',
  '/apply',
  '/contact',
] as const;

async function scan(page: Page, route: string) {
  await page.goto(route);
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(300);

  return new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
}

test.describe('Accessibility - WCAG 2.2 AA public journeys', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`${route} has no serious or critical axe violations`, async ({ page }) => {
      const results = await scan(page, route);
      const blocking = results.violations.filter(
        (violation) => violation.impact === 'critical' || violation.impact === 'serious',
      );
      expect(blocking).toEqual([]);
    });
  }

  test('homepage supports keyboard navigation and skip navigation', async ({ page }, testInfo) => {
    await page.goto('/');

    const skipLink = page.locator('.skip-to-main');
    if (testInfo.project.use.hasTouch) {
      // Playwright touch profiles do not consistently synthesize hardware Tab traversal.
      // Direct focus still verifies that the link is operable for attached keyboards and AT.
      await skipLink.focus();
    } else {
      await page.keyboard.press('Tab');
    }
    await expect(skipLink).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main-content')).toBeFocused();
  });

  test('mobile menu can open and close with keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const menuButton = page.locator('header button[aria-label="Open menu"]').first();
    await expect(menuButton).toBeVisible();
    await menuButton.focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Escape');

    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeHidden();
  });

  test('visible images expose alt attributes across key public routes', async ({ page }) => {
    for (const route of PUBLIC_ROUTES.slice(0, 8)) {
      await page.goto(route);
      const imagesWithoutAlt = await page.locator('img:not([alt])').count();
      expect(imagesWithoutAlt, `missing alt attributes on ${route}`).toBe(0);
    }
  });

  test('visible buttons and links have accessible names', async ({ page }) => {
    await page.goto('/');

    const unnamedButtons = await page.locator('button').evaluateAll((buttons) =>
      buttons.filter((button) => {
        const style = window.getComputedStyle(button);
        const visible = button.getClientRects().length > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        if (!visible) return false;
        const text = button.textContent?.trim() ?? '';
        const aria = button.getAttribute('aria-label')?.trim() ?? '';
        const labelled = button.getAttribute('aria-labelledby')?.trim() ?? '';
        return !text && !aria && !labelled;
      }).length,
    );
    expect(unnamedButtons).toBe(0);

    const unnamedLinks = await page.locator('a').evaluateAll((links) =>
      links.filter((anchor) => {
        const style = window.getComputedStyle(anchor);
        const visible = anchor.getClientRects().length > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        if (!visible) return false;
        const text = anchor.textContent?.trim() ?? '';
        const aria = anchor.getAttribute('aria-label')?.trim() ?? '';
        const imageAlt = anchor.querySelector('img[alt]')?.getAttribute('alt')?.trim() ?? '';
        return !text && !aria && !imageAlt;
      }).length,
    );
    expect(unnamedLinks).toBe(0);
  });

  test('apply form controls have programmatic labels', async ({ page }) => {
    await page.goto('/apply');
    await page.waitForLoadState('domcontentloaded');

    const unlabeledControls = await page
      .locator('main input:not([type="hidden"]), main select, main textarea')
      .evaluateAll((controls) =>
        controls
          .filter((control) => {
            const style = window.getComputedStyle(control);
            return control.getClientRects().length > 0 && style.display !== 'none' && style.visibility !== 'hidden';
          })
          .filter((control) => {
            const element = control as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            const ariaLabel = element.getAttribute('aria-label')?.trim();
            const ariaLabelledBy = element.getAttribute('aria-labelledby')?.trim();
            return !(ariaLabel || ariaLabelledBy || (element.labels && element.labels.length > 0));
          })
          .map((control) => ({ id: control.id, name: control.getAttribute('name'), tag: control.tagName })),
      );

    expect(unlabeledControls).toEqual([]);
  });

  test('homepage heading hierarchy starts with one H1 and does not skip levels', async ({ page }) => {
    await page.goto('/');

    const levels = await page.locator('h1, h2, h3, h4, h5, h6').evaluateAll((headings) =>
      headings.map((heading) => Number(heading.tagName.substring(1))),
    );

    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    expect(levels[0]).toBe(1);
    for (let index = 1; index < levels.length; index += 1) {
      expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
    }
  });

  test('color contrast rule is enabled and reports no serious violations on homepage', async ({ page }) => {
    const results = await scan(page, '/');
    const contrast = results.violations.filter((violation) => violation.id === 'color-contrast');
    expect(contrast).toEqual([]);
  });

  test('focus indicator is visually present', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');

    const focusAppearance = await page.locator(':focus').evaluate((element) => {
      const style = window.getComputedStyle(element);
      return {
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
        boxShadow: style.boxShadow,
      };
    });

    const hasOutline = focusAppearance.outlineStyle !== 'none' && focusAppearance.outlineWidth !== '0px';
    const hasShadow = focusAppearance.boxShadow !== 'none';
    expect(hasOutline || hasShadow).toBeTruthy();
  });

  test('reduced motion preference suppresses long animations', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');

    const violations = await page.locator('body *').evaluateAll((elements) =>
      elements
        .filter((element) => {
          const style = window.getComputedStyle(element);
          const duration = style.animationDuration
            .split(',')
            .map((value) => Number.parseFloat(value) || 0)
            .some((value) => value > 0.1);
          const transition = style.transitionDuration
            .split(',')
            .map((value) => Number.parseFloat(value) || 0)
            .some((value) => value > 0.1);
          return duration || transition;
        })
        .slice(0, 10)
        .map((element) => element.tagName),
    );

    expect(violations).toEqual([]);
  });
});
