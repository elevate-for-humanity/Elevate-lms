import { expect, test } from '@playwright/test';
import { NAV_ITEMS } from '../../lib/navigation';

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
        // Hold the visitor-visible slide while checking its images. Rotation
        // replaces live nodes, which otherwise detaches an image mid-scroll.
        await page.getByRole('button', { name: 'Pause host shop slideshow', exact: true }).click();
        await expect(page.getByRole('button', { name: 'Resume host shop slideshow', exact: true }))
          .toHaveAttribute('aria-pressed', 'true');
      }
      const imageSelector = await page.locator('main').count() ? 'main img' : 'body img';
      // Lazy images only load after entering the viewport. Exercise the actual
      // visitor scroll rather than waiting forever on below-the-fold decode().
      for (const image of await page.locator(imageSelector).all()) {
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
    const nav = page.getByRole('navigation', { name: desktop ? 'Main navigation' : 'Site navigation', exact: true });
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
