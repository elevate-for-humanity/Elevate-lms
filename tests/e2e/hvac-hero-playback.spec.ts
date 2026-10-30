import { expect, test } from '@playwright/test';

const website = 'https://www.elevateforhumanity.org/programs/hvac-technician';
const selector = 'video[data-hvac-hero-video="20261029"]';

test('HVAC hero plays the complete 96-second film and loops without cropping', async ({ page }, testInfo) => {
  test.setTimeout(155_000);
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
  // Restart the real native decoder. Do not seek past instruction, accelerate
  // playback, replace play(), or substitute downloaded/local video content.
  await video.evaluate(async (element: HTMLVideoElement) => {
    element.pause();
    element.currentTime = 0;
    await element.play();
  });
  const samples: Array<{ time: number; elapsedMs: number; paused: boolean; error: number }> = [];
  const started = Date.now();
  let reachedEnd = false;
  let looped = false;
  try {
    while (Date.now() - started < 110_000) {
      const sample = await video.evaluate((element: HTMLVideoElement) => ({
        time: element.currentTime, paused: element.paused, error: element.error?.code ?? 0,
        readyState: element.readyState, networkState: element.networkState, muted: element.muted,
        seeking: element.seeking, visibility: document.visibilityState,
        installBannerVisible: Boolean(document.querySelector('[data-pwa-install-banner]')),
      }));
      samples.push({ ...sample, elapsedMs: Date.now() - started });
      expect(sample.error, JSON.stringify(sample)).toBe(0);
      expect(sample.paused, JSON.stringify(sample)).toBe(false);
      if (sample.time >= 95) reachedEnd = true;
      if (reachedEnd && sample.time < 3) { looped = true; break; }
      await page.waitForTimeout(250);
    }
    expect(looped, 'The real film must play through its final second and loop').toBe(true);
    expect(Date.now() - started).toBeGreaterThanOrEqual(94_000);
  } finally {
    await testInfo.attach('hvac-full-playback', { body: JSON.stringify({ url: page.url(), project: testInfo.project.name, initial, samples }), contentType: 'application/json' });
  }
  await testInfo.attach('hvac-hero-playing', { body: await page.screenshot(), contentType: 'image/png' });
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
