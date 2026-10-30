import { expect, test } from '@playwright/test';

const website = 'https://www.elevateforhumanity.org/programs/hvac-technician';
const selector = 'video[data-hvac-hero-video="20261029"]';
type PlaybackEvidence = {
  startedAt: number; firstTime: number; maxTime: number; looped: boolean;
  samples: Array<{ time: number; elapsedMs: number; paused: boolean; error: number }>;
};
type ObservedWindow = typeof window & { __hvacPlaybackEvidence: PlaybackEvidence };

test('HVAC hero plays the complete 96-second film and loops without cropping', async ({ page }, testInfo) => {
  test.setTimeout(155_000);
  // Observe native autoplay from document creation. In particular, do not
  // introduce an asynchronous seek/rewind into WebKit's streaming decoder.
  await page.addInitScript(target => {
    const evidence: PlaybackEvidence = { startedAt: 0, firstTime: -1, maxTime: 0, looped: false, samples: [] };
    (window as ObservedWindow).__hvacPlaybackEvidence = evidence;
    const observe = (event: Event) => {
      const element = event.target;
      if (!(element instanceof HTMLVideoElement) || !element.matches(target) || element.paused || element.seeking) return;
      if (!evidence.startedAt) { evidence.startedAt = Date.now(); evidence.firstTime = element.currentTime; }
      evidence.maxTime = Math.max(evidence.maxTime, element.currentTime);
      if (evidence.maxTime >= 95 && element.currentTime < 3) evidence.looped = true;
      evidence.samples.push({ time: element.currentTime, elapsedMs: Date.now() - evidence.startedAt, paused: element.paused, error: element.error?.code ?? 0 });
    };
    document.addEventListener('playing', observe, true);
    document.addEventListener('timeupdate', observe, true);
  }, selector);
  const response = await page.goto(website, { waitUntil: 'domcontentloaded' });
  expect(response?.status()).toBe(200);
  const video = page.locator(selector);
  await expect(video).toBeVisible();
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(2);
  const initial = await video.evaluate((element: HTMLVideoElement) => {
    const rect = element.getBoundingClientRect();
    return {
      duration: element.duration, width: element.videoWidth, height: element.videoHeight,
      controls: element.controls, muted: element.muted, loop: element.loop, inline: element.playsInline,
      fit: getComputedStyle(element).objectFit, renderedWidth: rect.width, renderedHeight: rect.height,
      viewportWidth: innerWidth, overflow: document.documentElement.scrollWidth > innerWidth + 1,
    };
  });
  expect(initial.duration).toBeCloseTo(96, 1);
  expect(initial.width).toBe(720);
  expect(initial.height).toBe(900);
  expect(initial).toMatchObject({ controls: true, muted: true, loop: true, inline: true, fit: 'contain', overflow: false });
  expect(initial.renderedWidth).toBeLessThanOrEqual(initial.viewportWidth);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime), { timeout: 15_000 }).toBeGreaterThan(0.5);
  const started = Date.now();
  let looped = false;
  try {
    while (Date.now() - started < 110_000) {
      const sample = await video.evaluate((element: HTMLVideoElement) => ({
        time: element.currentTime, paused: element.paused, error: element.error?.code ?? 0,
        readyState: element.readyState, networkState: element.networkState, muted: element.muted,
        seeking: element.seeking, visibility: document.visibilityState,
        installBannerVisible: Boolean(document.querySelector('[data-pwa-install-banner]')),
      }));
      expect(sample.error, JSON.stringify(sample)).toBe(0);
      expect(sample.paused, JSON.stringify(sample)).toBe(false);
      const evidence = await page.evaluate(() => (window as ObservedWindow).__hvacPlaybackEvidence);
      if (evidence.looped && sample.time > 0.5 && sample.time < 3) { looped = true; break; }
      await page.waitForTimeout(250);
    }
    expect(looped, 'The real film must play through its final second and loop').toBe(true);
    const evidence = await page.evaluate(() => (window as ObservedWindow).__hvacPlaybackEvidence);
    expect(evidence.firstTime).toBeGreaterThanOrEqual(0);
    expect(evidence.firstTime).toBeLessThanOrEqual(1);
    expect(evidence.maxTime).toBeGreaterThanOrEqual(95);
    expect(evidence.samples.at(-1)!.elapsedMs).toBeGreaterThanOrEqual(94_000);
    expect(evidence.samples.every(sample => sample.error === 0 && !sample.paused)).toBe(true);
  } finally {
    const evidence = await page.evaluate(() => (window as ObservedWindow).__hvacPlaybackEvidence);
    await testInfo.attach('hvac-full-playback', { body: JSON.stringify({ url: page.url(), project: testInfo.project.name, initial, ...evidence }), contentType: 'application/json' });
  }
  await testInfo.attach('hvac-hero-playing', { body: await page.screenshot(), contentType: 'image/png' });
});

test('install promotion does not cover the on-screen HVAC film or controls', async ({ page }, testInfo) => {
  await page.goto(website, { waitUntil: 'domcontentloaded' });
  await expect(page.locator(selector)).toBeVisible();
  // Cover the delayed iOS install promotion as well as the initial page load.
  await page.waitForTimeout(12_000);
  await expect(page.locator('[data-pwa-install-banner]')).toHaveCount(0);
  await testInfo.attach('hvac-unobstructed-controls', { body: await page.screenshot(), contentType: 'image/png' });
});

test('HVAC native media supports sound, pause, and resume', async ({ page }, testInfo) => {
  await page.goto(website, { waitUntil: 'domcontentloaded' });
  const video = page.locator(selector);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.readyState)).toBeGreaterThanOrEqual(2);
  await video.click();
  await video.evaluate((element: HTMLVideoElement) => element.pause());
  expect(await video.evaluate((element: HTMLVideoElement) => element.paused)).toBe(true);
  // Native controls vary across mobile engines; exercise their real media API
  // without replacing browser methods or concealing autoplay rejection.
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.muted = false;
    element.volume = 1;
    await element.play();
  });
  const before = await video.evaluate((element: HTMLVideoElement) => element.currentTime);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBeGreaterThan(before + 0.5);
  const sound = await video.evaluate((element: HTMLVideoElement) => ({ muted: element.muted, volume: element.volume, paused: element.paused, error: element.error?.code ?? 0 }));
  expect(sound).toEqual({ muted: false, volume: 1, paused: false, error: 0 });
  await testInfo.attach('hvac-native-sound', { body: JSON.stringify(sound), contentType: 'application/json' });
});

test('HVAC poster remains available when the video request fails', async ({ page, request }, testInfo) => {
  await page.route('**/videos/hvac-recruitment-20261029.mp4', route => route.abort('failed'));
  await page.goto(website, { waitUntil: 'domcontentloaded' });
  const video = page.locator(selector);
  await expect(video).toBeVisible();
  const poster = await video.getAttribute('poster');
  expect(poster).toBeTruthy();
  const image = await request.get(new URL(poster!, website).href);
  expect(image.status()).toBe(200);
  expect(image.headers()['content-type']).toMatch(/^image\//);
  await expect.poll(() => video.evaluate((element: HTMLVideoElement) => element.networkState)).toBe(3);
  expect(await video.evaluate((element: HTMLVideoElement) => element.currentTime)).toBe(0);
  await testInfo.attach('hvac-video-unavailable-poster', { body: await page.screenshot(), contentType: 'image/png' });
});
