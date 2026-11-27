import { expect, test } from '@playwright/test';
import { NAV_ITEMS } from '../../../lib/navigation';
import { BEAUTY_TRADES } from '../../../lib/programs/beauty-trade-navigation';

const origin = 'https://www.elevateforhumanity.org';
const destinations = [...new Set(NAV_ITEMS.flatMap(item => [item.href, ...(item.subItems ?? []).map(sub => sub.href)]).filter((href): href is string => Boolean(href?.startsWith('/'))))];

if (!destinations.includes('/student-support')) destinations.push('/student-support');

export function registerPublicNavigationAudit() {
  test('retired public pages redirect before HTML streaming', async ({ request }) => {
    for (const [path, target] of [
      ['/programs/skilled-trades', '/programs'], ['/programs/technology', '/programs'],
      ['/founder', '/about/elizabeth-greene'], ['/team', '/about/team'],
      ['/about/partners', '/partners'], ['/about/mission', '/about#mission'],
      ...['academic','financial-aid','career','counseling','accessibility','scheduling'].map(topic => ['/student-support/'+topic, '/student-support#'+topic]),
    ]) {
      const response = await request.get(origin + path + '?source=acceptance', { maxRedirects: 0 });
      expect(response.status(), path).toBe(308);
      const expected = new URL(target, origin);
      expected.search = '?source=acceptance';
      expect(response.headers().location, path).toBe(expected.toString());
    }
  });

  for (const href of destinations) {
    test(`navigation destination ${href}: content, images, layout and client errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('response', response => { if (response.url().startsWith(origin + '/') && response.status() >= 500) errors.push(`HTTP ${response.status()} ${new URL(response.url()).pathname}`); });
      const response = await page.goto(origin + href, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), href).toBeLessThan(400);
      await expect(page.locator('h1').first()).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/Application error: a client-side exception|Lorem ipsum|Under construction/i);
      if (href === '/partners/host-shops') {
        // This page is now a static four-trade directory, not an autoplay
        // slideshow. Certify each real route and enrollment link on every
        // browser/device instead of waiting for removed playback controls.
        await expect(page.getByRole('heading', { name: 'Choose your Host Shop category', exact: true }))
          .toBeVisible();
        const cards = page.locator('main article');
        await expect(cards).toHaveCount(BEAUTY_TRADES.length);
        for (const trade of BEAUTY_TRADES) {
          const card = cards.filter({
            has: page.getByRole('heading', { level: 3, name: trade.label, exact: true }),
          });
          await expect(card, trade.label).toHaveCount(1);
          await expect(card.getByRole('link', { name: `View ${trade.label} Host Shops`, exact: false }))
            .toHaveAttribute('href', trade.hostHref);
          await expect(card.getByRole('link', { name: 'Explore training', exact: true }))
            .toHaveAttribute('href', trade.programHref);
        }
        await expect(page.getByRole('link', { name: 'Apply to become a Host Shop', exact: true }))
          .toHaveAttribute('href', '/partners/host-shop/apply');
      }
      // Freeze visible slide shows before the scroll audit. Otherwise a
      // carousel swaps image nodes while Playwright is iterating nth() locators.
      // Do not suppress failed visible images or change application state.
      const playingCarousels = page.locator('main button[aria-label="Pause slideshow"]');
      const initialPlayingCount = await playingCarousels.count();
      for (let i = 0; i < initialPlayingCount; i++) {
        await playingCarousels.first().click();
        // The locator intentionally re-resolves after React changes the
        // clicked button's accessible name from Pause to Play.
        await expect(playingCarousels).toHaveCount(initialPlayingCount - i - 1);
      }
      const imageSelector = await page.locator('main').count() ? 'main img' : 'body img';
      // Inactive gallery preload frames use aria-hidden=true and opacity:0.
      // Playwright isVisible() intentionally treats opacity:0 as visible, so
      // their deliberately lazy, unrequested network images must not be
      // mistaken for the user-facing photo. Every presented image still has
      // to complete, decode, and expose nonzero natural dimensions.
      const presentedImages = page.locator(`${imageSelector}:not([aria-hidden="true"])`);
      for (const image of await presentedImages.all()) {
        if (!await image.isVisible()) continue;
        await image.scrollIntoViewIfNeeded();
        await expect(image, `${href} image did not finish loading`).toHaveJSProperty('complete', true, { timeout: 10_000 });
        const description = await image.evaluate(element => {
          const img = element as HTMLImageElement;
          return `${img.alt} (${img.currentSrc || img.src})`;
        });
        // An error handler may replace an image while decode() is pending.
        // Only a decoded, visible source with real dimensions passes.
        await expect.poll(() => image.evaluate(async element => {
          const img = element as HTMLImageElement;
          const source = img.currentSrc;
          try {
            await img.decode();
            return Boolean(source && source === img.currentSrc && img.naturalWidth && img.naturalHeight);
          } catch { return false; }
        }), { message: `${href} image did not decode: ${description}`, timeout: 10000 }).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${href} overflows horizontally`).toBe(true);
      expect(errors).toEqual([]);
    });
  }

  test('empty contact submission gives visible feedback without sending a message', async ({ page }) => {
    const deliveries: string[] = [];
    page.on('request', request => {
      if (request.method() === 'POST' && new URL(request.url()).pathname === '/api/contact') deliveries.push(request.url());
    });
    await page.goto(origin + '/contact', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Send Message', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'Please complete each required field' })).toBeVisible();
    expect(deliveries).toEqual([]);
    await expect(page).toHaveURL(origin + '/contact');
  });

  test('every public menu section opens and its team link navigates', async ({ page }) => {
    await page.goto(origin + '/about', { waitUntil: 'domcontentloaded' });
    const desktop = (page.viewportSize()?.width ?? 0) >= 1180;
    if (!desktop) await page.getByRole('button', { name: 'Open menu', exact: true }).click();
    const nav = page.getByRole('navigation', { name: desktop ? 'Main navigation' : 'Mobile navigation', exact: true });
    for (const item of NAV_ITEMS.filter(item => item.subItems?.length)) {
      const trigger = nav.getByRole('button', { name: desktop ? `${item.name} menu` : item.name, exact: true });
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'true');
      for (const sub of item.subItems!.filter(sub => sub.href)) await expect(nav.getByRole('link', { name: sub.name, exact: true })).toBeVisible();
      await trigger.click();
      await expect(trigger).toHaveAttribute('aria-expanded', 'false');
    }
    await nav.getByRole('button', { name: desktop ? 'About menu' : 'About', exact: true }).click();
    await nav.getByRole('link', { name: 'Our Team & Staff', exact: true }).click();
    await expect(page).toHaveURL(origin + '/about/team');
    await expect(page.getByRole('heading', { name: 'People who help you move forward.' })).toBeVisible();
    await page.getByRole('link', { name: 'Meet our founder', exact: true }).click();
    await expect(page).toHaveURL(origin + '/about/elizabeth-greene');
    await expect(page.getByRole('heading', { level: 1, name: 'Elizabeth Greene' })).toBeVisible();
  });

  test('disposable apprentice can sign in and browse every public menu destination', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop-chrome', 'The same public responsive checks run on every device; exercise the provisioned identity once.');
    test.setTimeout(240_000);
    const email = process.env.E2E_APPRENTICE_EMAIL;
    const password = process.env.E2E_APPRENTICE_PASSWORD;
    expect(email, 'Release acceptance must provision its disposable apprentice').toBeTruthy();
    expect(password, 'Release acceptance must supply the disposable identity password').toBeTruthy();
    await page.goto('https://app.elevateforhumanity.org/login', { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[type="email"]').first();
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(emailInput).toBeEnabled();
    await expect(passwordInput).toBeEnabled();
    await emailInput.fill(email!);
    await passwordInput.fill(password!);
    const submit = page.locator('button[type="submit"]').first();
    await expect(submit).toBeEnabled();
    await Promise.all([page.waitForURL(url => !url.pathname.includes('/login')), submit.click()]);
    for (const href of destinations) {
      const response = await page.goto(origin + href, { waitUntil: 'domcontentloaded' });
      expect(response?.status(), href).toBeLessThan(400);
      await expect(page.locator('h1').first()).toBeVisible();
      expect(new URL(page.url()).pathname, href).not.toMatch(/\/(?:login|unauthorized)(?:\/|$)/);
    }
  });
}
