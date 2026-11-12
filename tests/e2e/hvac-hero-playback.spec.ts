import { appOrigin } from './helpers/app-origins';
import { expect, test, type Page } from '@playwright/test';

const website = `${appOrigin('marketing')}/programs/hvac-technician`;
const selector = 'video[data-hvac-program-video="20261029"]';
type PlaybackEvidence = {
  startedAt: number; firstTime: number; maxTime: number;
  samples: Array<{ time: number; elapsedMs: number; paused: boolean; error: number }>;
};
type ObservedWindow = typeof window & { __hvacPlaybackEvidence: PlaybackEvidence };

function trackPageErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

test('the HVAC program film plays all 96 seconds after the visitor presses play', async ({ page }, testInfo) => {
  test.setTimeout(155_000);
  const pageErrors = trackPageErrors(page);
  // Record real-time playback without seeking or substituting a media source.
  await page.addInitScript(target => {
    const evidence: PlaybackEvidence = { startedAt: 0, firstTime: -1, maxTime: 0, samples: [] };
    (window as ObservedWindow).__hvacPlaybackEvidence = evidence;
    const observe = (event: Event) => {
      const element = event.target;
      if (!(element instanceof HTMLVideoElement) || !element.matches(target) || element.paused || element.seeking) return;
      if (!evidence.startedAt) { evidence.startedAt = Date.now(); evidence.firstTime = element.currentTime; }
      evidence.maxTime = Math.max(evidence.maxTime, element.currentTime);
      evidence.samples.push({ time: element.currentTime, elapsedMs: Date.now() - evidence.startedAt, paused: element.paused, error: element.error?.code ?? 0 });
    };
    document.addEventListener('playing', observe, true);
    document.addEventListener('timeupdate', observe, true);
  }, selector);
  const response = await page.goto(website, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  const video = page.locator(selector);
  await expect(video).toBeVisible();
  await page.getByRole('link', { name: 'Watch the program introduction' }).click();
  await expect(page).toHaveURL(/#hvac-program-film$/);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(1);
  const initial = await video.evaluate((element: HTMLVideoElement) => {
    const rect = element.getBoundingClientRect();
    return {
      duration: element.duration, width: element.videoWidth, height: element.videoHeight,
      controls: element.controls, autoplay: element.autoplay, paused: element.paused, loop: element.loop, inline: element.playsInline,
      fit: getComputedStyle(element).objectFit, renderedWidth: rect.width, renderedHeight: rect.height,
      viewportWidth: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  expect(initial.duration).toBeCloseTo(96, 1);
  expect(initial.width).toBe(720);
  expect(initial.height).toBe(900);
  expect(initial).toMatchObject({ controls: true, autoplay: false, paused: true, loop: false, inline: true, overflow: false });
  expect(initial.renderedWidth).toBeLessThanOrEqual(initial.viewportWidth);
  expect(initial.renderedWidth / initial.renderedHeight).toBeCloseTo(720 / 900, 2);
  await video.scrollIntoViewIfNeeded();
  await video.click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), { timeout: 15_000 }).toBeGreaterThan(0.5);
  try {
    await expect.poll(() => video.evaluate((element: HTMLVideoElement) => {
      if (element.error) throw Error('Native media error ' + element.error.code);
      return element.ended;
    }), { timeout: 110000, intervals: [500] }).toBe(true);
    const evidence = await page.evaluate(() => (window as ObservedWindow).__hvacPlaybackEvidence);
    expect(evidence.firstTime).toBeGreaterThanOrEqual(0);
    expect(evidence.firstTime).toBeLessThanOrEqual(1);
    expect(evidence.maxTime).toBeGreaterThanOrEqual(95);
    expect(evidence.samples.at(-1)!.elapsedMs).toBeGreaterThanOrEqual(94_000);
    expect(evidence.samples.every(sample => sample.error === 0 && !sample.paused)).toBe(true);
    await video.evaluate((el: HTMLVideoElement) => el.play());
    await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeLessThan(3);
    await expect.poll(() => video.evaluate((el: HTMLVideoElement) => el.currentTime)).toBeGreaterThan(0.5);
    expect(pageErrors, 'The live page must hydrate without replacing the player').toEqual([]);
  } finally {
    const evidence = await page.evaluate(() => (window as ObservedWindow).__hvacPlaybackEvidence);
    await testInfo.attach('hvac-full-playback', { body: JSON.stringify({ url: page.url(), project: testInfo.project.name, initial, pageErrors, ...evidence }), contentType: 'application/json' });
  }
  await testInfo.attach('hvac-program-film-finished', { body: await page.screenshot(), contentType: 'image/png' });
});

test('optional assistance and installation do not cover the HVAC film or controls', async ({ page }, testInfo) => {
  const pageErrors = trackPageErrors(page);
  await page.goto(website, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(selector)).toBeVisible();
  await page.locator(selector).evaluate(element => element.scrollIntoView({ block: 'end' }));
  // Cover the delayed iOS install promotion as well as the initial page load.
  await page.waitForTimeout(12_000);
  await expect(page.locator('[data-pwa-install-banner]')).toHaveCount(0);
  await expect(page.locator('[data-public-video-overlay]')).toHaveCount(0);
  const controlsClear = await page.locator(selector).evaluate((element: HTMLVideoElement) => {
    const rect = element.getBoundingClientRect();
    const y = Math.min(rect.bottom, innerHeight) - 18;
    return [rect.left + 24, rect.right - 24].every(x => {
      const hit = document.elementFromPoint(x, y);
      return hit === element || (hit !== null && element.contains(hit));
    });
  });
  expect(controlsClear, 'Both ends of the native control bar must receive pointer input').toBe(true);
  expect(pageErrors).toEqual([]);
  await testInfo.attach('hvac-unobstructed-controls', { body: await page.screenshot(), contentType: 'image/png' });
});

test('HVAC native media supports sound, pause, and resume', async ({ page }, testInfo) => {
  const pageErrors = trackPageErrors(page);
  await page.goto(website, { waitUntil: 'domcontentloaded' });
  const video = page.locator(selector);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState), { timeout: 15000 }).toBeGreaterThanOrEqual(1);
  await video.scrollIntoViewIfNeeded();
  await video.click();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), { timeout: 15000 }).toBeGreaterThan(0.5);
  await video.evaluate((element: HTMLVideoElement) => element.pause());
  expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  const pausedAt = await video.evaluate((element: HTMLVideoElement) => element.currentTime);
  await page.waitForTimeout(1_000);
  const heldAt = await video.evaluate((element: HTMLVideoElement) => element.currentTime);
  expect(Math.abs(heldAt - pausedAt), 'Paused media time must stay still').toBeLessThan(0.1);
  // Native controls vary across mobile engines; exercise their real media API
  // without replacing browser methods or concealing autoplay rejection.
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.muted = false;
    element.volume = 1;
    await element.play();
  });
  const before = await video.evaluate((element: HTMLVideoElement) => element.currentTime);
  expect(before, 'Resume must not restart the film').toBeGreaterThanOrEqual(pausedAt - 0.1);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime),
    { timeout: 20_000 }).toBeGreaterThan(before + 0.5);
  const sound = await video.evaluate((element: HTMLVideoElement) => ({ muted: element.muted, volume: element.volume, paused: element.paused, error: element.error?.code ?? 0 }));
  expect(sound).toEqual({ muted: false, volume: 1, paused: false, error: 0 });
  expect(pageErrors).toEqual([]);
  await testInfo.attach('hvac-native-sound', { body: JSON.stringify({ ...sound, pausedAt, heldAt, resumedAt: before }), contentType: 'application/json' });
});

test('HVAC poster remains available when the video request fails', async ({ page }, testInfo) => {
  const pageErrors = trackPageErrors(page);
  await page.route('**/videos/hvac-recruitment-20261029.mp4', route => route.abort('failed'));
  await page.goto(website, { waitUntil: 'domcontentloaded' });
  const video = page.locator(selector);
  await expect(video).toBeVisible();
  const poster = await video.getAttribute('poster');
  expect(poster).toBeTruthy();
  const evidence = await video.evaluate(async (el: HTMLVideoElement) => {
    const image = new Image();
    image.src = el.poster;
    await image.decode();
    const response = await fetch(el.poster);
    return { status: response.status, type: response.headers.get('content-type'), width: image.naturalWidth };
  });
  expect(evidence.status).toBe(200);
  expect(evidence.type).toMatch(/^image\//);
  expect(evidence.width).toBeGreaterThan(0);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.networkState)).toBe(3);
  expect(await video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBe(0);
  expect(pageErrors).toEqual([]);
  await testInfo.attach('hvac-video-unavailable-poster', { body: await page.screenshot(), contentType: 'image/png' });
});
