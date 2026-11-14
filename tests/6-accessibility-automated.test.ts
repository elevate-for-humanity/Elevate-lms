/**
 * Public accessibility release gate.
 *
 * Automated checks do not replace manual screen-reader/usability testing, but
 * critical public journeys must remain free of automated WCAG 2.2 A/AA
 * violations and retain the basic keyboard/landmark contracts below.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const baseURL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

const pages = [
  { name: 'Homepage', url: '/' },
  { name: 'Programs', url: '/programs' },
  { name: 'Contact', url: '/contact' },
  { name: 'Apply', url: '/apply' },
  { name: 'Eligibility', url: '/eligibility' },
  { name: 'Funding', url: '/funding' },
  { name: 'Apprenticeships', url: '/apprenticeships' },
  { name: 'Testing', url: '/testing' },
  { name: 'About', url: '/about' },
  { name: 'Accessibility', url: '/accessibility' },
];

for (const { name, url } of pages) {
  test(`WCAG 2.2 AA scan: ${name}`, async ({ page }) => {
    const response = await page.goto(`${baseURL}${url}`, { waitUntil: 'domcontentloaded' });
    expect(response?.status(), `${name} should return a non-error HTTP status`).toBeLessThan(400);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();

    const blocking = results.violations.filter(
      (violation) => violation.impact === 'critical' || violation.impact === 'serious',
    );

    if (blocking.length) {
      console.error(
        `${name} accessibility blockers`,
        blocking.map((violation) => ({
          id: violation.id,
          impact: violation.impact,
          help: violation.help,
          nodes: violation.nodes.map((node) => node.target),
        })),
      );
    }

    expect(blocking, `${name} has critical/serious accessibility violations`).toEqual([]);
  });
}

test('keyboard and landmark contract: homepage', async ({ page }) => {
  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

  const main = page.locator('main#main-content');
  await expect(main).toHaveCount(1);

  const h1 = main.locator('h1');
  await expect(h1).toHaveCount(1);

  // The first keyboard action should expose/focus a skip mechanism, and using
  // it must move focus to the canonical main landmark.
  await page.keyboard.press('Tab');
  const focused = page.locator(':focus');
  const focusedText = (await focused.textContent())?.toLowerCase() ?? '';
  const focusedHref = await focused.getAttribute('href');
  expect(
    focusedText.includes('skip') || focusedHref === '#main-content',
    'First focusable control should be the skip-to-content link',
  ).toBeTruthy();

  await page.keyboard.press('Enter');
  await expect(main).toBeFocused();
});

test('forms expose programmatic labels on critical journeys', async ({ page }) => {
  for (const url of ['/contact', '/apply']) {
    await page.goto(`${baseURL}${url}`, { waitUntil: 'domcontentloaded' });
    const controls = page.locator('input:not([type="hidden"]), select, textarea');
    const count = await controls.count();

    for (let index = 0; index < count; index += 1) {
      const control = controls.nth(index);
      if (!(await control.isVisible())) continue;
      const ariaLabel = await control.getAttribute('aria-label');
      const ariaLabelledBy = await control.getAttribute('aria-labelledby');
      const id = await control.getAttribute('id');
      const wrappingLabel = control.locator('xpath=ancestor::label[1]');
      const hasWrappingLabel = (await wrappingLabel.count()) > 0;
      const hasForLabel = id ? (await page.locator(`label[for="${id}"]`).count()) > 0 : false;

      expect(
        Boolean(ariaLabel || ariaLabelledBy || hasWrappingLabel || hasForLabel),
        `${url}: visible form control ${index + 1} needs a programmatic label`,
      ).toBeTruthy();
    }
  }
});
