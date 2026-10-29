import { expect, test } from '@playwright/test';
import { observeDocumentStability } from './helpers/document-stability';

const website = 'https://www.elevateforhumanity.org/';

test('public startup stays visible without reloads, client exceptions or competing narration', async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  let navigations = 0;
  page.on('framenavigated', frame => { if (frame === page.mainFrame()) navigations += 1; });
  const documentState = observeDocumentStability(page);
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
  const baselineDocument = await documentState();
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
  // Zero playing voices is not proof of working narration. Explicitly start
  // the real page guide, then scroll while its audio is active.
  await page.getByRole('button', { name: 'Stop page narration', exact: true }).click();
  await page.getByRole('button', { name: 'Play narration for this section', exact: true }).click();
  const audibleCount = () => page.evaluate(() => (window as typeof window & { __elevateAudibleCount: () => number }).__elevateAudibleCount());
  await expect.poll(audibleCount, { timeout: 15_000, message: 'Real page narration must become audible after the visitor starts it' }).toBe(1);
  await page.locator('main [data-scroll-narration]').nth(1).scrollIntoViewIfNeeded();
  const scrollingAudioCounts: number[] = [];
  for (let sample = 0; sample < 8; sample += 1) {
    scrollingAudioCounts.push(await audibleCount());
    await page.waitForTimeout(500);
  }
  const finalDocument = await documentState();
  await testInfo.attach('public-startup-evidence', { body: JSON.stringify({ headingVisibleMs, navigations, baselineDocument, finalDocument, samples, scrollingAudioCounts, errors }), contentType: 'application/json' });
  expect(errors).toEqual([]);
  // framenavigated also fires for history.replaceState (including Next's
  // initial history reconciliation). A reload must preserve neither the
  // document-request history nor the document's performance time origin.
  expect(finalDocument, 'No spontaneous document navigation or reload during startup').toEqual(baselineDocument);
  expect(samples.every(sample => sample.visible && !sample.overflow && sample.audible <= 1)).toBe(true);
  expect(scrollingAudioCounts.every(count => count <= 1)).toBe(true);
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

test('password recovery confirmation preserves its origin and reports an invalid link safely', async ({ page }, testInfo) => {
  const origin = 'https://app.elevateforhumanity.org';
  const callback = origin + '/api/auth/recovery-callback';
  const next = '/reset-password?portal=employer&mode=recovery';
  const landing = await page.goto(
    callback + '?token_hash=deployment-acceptance-invalid-token&next=' + encodeURIComponent(next),
    { waitUntil: 'domcontentloaded' },
  );
  expect(landing?.status()).toBe(200);
  expect(landing?.headers()['referrer-policy']).toBe('same-origin');
  expect(landing?.headers()['content-security-policy']).toContain("form-action 'self'");
  const confirmationPromise = page.waitForResponse(
    response => response.url() === callback && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Continue to Password Setup', exact: true }).click();
  const confirmation = await confirmationPromise;
  const headers = await confirmation.request().allHeaders();
  expect(headers.origin).toBe(origin);
  expect(confirmation.status()).toBe(303);
  await expect(page).toHaveURL(/\/reset-password\?/);
  const destination = new URL(page.url());
  expect(destination.origin).toBe(origin);
  expect(destination.searchParams.get('portal')).toBe('employer');
  expect(destination.searchParams.get('error')).toBe('recovery_failed');
  await expect(page.getByText('This password link is missing, expired, or already used. Request a fresh secure link below.', { exact: true })).toBeVisible();
  await testInfo.attach('recovery-origin-evidence', {
    body: JSON.stringify({ origin: headers.origin, status: confirmation.status(), error: destination.searchParams.get('error') }),
    contentType: 'application/json',
  });
});
