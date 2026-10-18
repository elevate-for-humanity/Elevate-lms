import { expect, test } from '@playwright/test';

const website = 'https://www.elevateforhumanity.org/';

test('public startup stays visible without reloads, client exceptions or competing narration', async ({ page }, testInfo) => {
  test.setTimeout(45_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations += 1; });
  await page.addInitScript(() => {
    // Observe real playback, including detached Audio objects. Do not replace
    // native play results or conceal autoplay/network failures.
    const seen = new Set<HTMLMediaElement>();
    const nativePlay = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      seen.add(this);
      return nativePlay.call(this);
    };
    Object.defineProperty(window, '__elevateAudibleCount', {
      value: () => [...seen].filter(media => !media.paused && !media.ended && !media.muted && media.volume > 0).length,
    });
  });
  const started = Date.now();
  const response = await page.goto(website, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  const hero = page.locator('main h1').first();
  await expect(hero).toBeVisible({ timeout: 15_000 });
  const headingVisibleMs = Date.now() - started;
  const baseline = navigations;
  const samples: Array<{ visible: boolean; audible: number; overflow: boolean }> = [];
  // A stability window is intentional: a single screenshot misses hydration
  // flashes, controller reload loops, and delayed competing audio requests.
  for (let sample = 0; sample < 12; sample += 1) {
    samples.push(await page.evaluate(() => {
      const heading = document.querySelector('main h1');
      const rect = heading?.getBoundingClientRect();
      const style = heading ? getComputedStyle(heading) : null;
      const monitor = window as typeof window & { __elevateAudibleCount: () => number };
      return {
        visible: Boolean(rect?.width && rect.height && style?.visibility !== 'hidden' && style?.display !== 'none' && style?.opacity !== '0'),
        audible: monitor.__elevateAudibleCount(),
        overflow: document.documentElement.scrollWidth > innerWidth + 1,
      };
    }));
    await page.waitForTimeout(500);
  }
  await testInfo.attach('public-startup-evidence', { body: JSON.stringify({ headingVisibleMs, navigations, samples, errors }), contentType: 'application/json' });
  expect(errors).toEqual([]);
  expect(navigations, 'No spontaneous full-page reload during startup').toBe(baseline);
  expect(samples.every(sample => sample.visible && !sample.overflow && sample.audible <= 1)).toBe(true);
});

test('public narration survives blocked browser storage and remains controllable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => {
    for (const name of ['getItem', 'setItem'] as const) {
      Object.defineProperty(Storage.prototype, name, { configurable: true, value: () => { throw new DOMException('Storage blocked', 'SecurityError'); } });
    }
  });
  await page.goto(website, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('main h1').first()).toBeVisible();
  const stop = page.getByRole('button', { name: 'Stop page narration', exact: true });
  await expect(stop).toBeVisible();
  await stop.click();
  const replay = page.getByRole('button', { name: 'Play narration for this section', exact: true });
  await expect(replay).toHaveAttribute('aria-pressed', 'false');
  await replay.click();
  await expect(stop).toBeVisible();
  expect(errors).toEqual([]);
});
