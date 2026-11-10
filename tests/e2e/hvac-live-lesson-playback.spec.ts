import { expect, test, type Page } from '@playwright/test';

// A real LMS lesson with a published, encoded video. Only the disposable QA
// learner can log in; no existing student's work is opened or changed.
const BASE = process.env.PLAYWRIGHT_BASE_URL || 'https://app.elevateforhumanity.org';
const COURSE_ID = 'd48c61c4-8880-4d9d-9ab5-fab4dd51b201';
const LESSON_ID = 'f1d32b7f-7cd4-44c4-9858-6b756ef21b89';
const email = process.env.E2E_LEARNER_EMAIL || '';
const password = process.env.E2E_LEARNER_PASSWORD || '';

async function signIn(page: Page) {
  expect(email, 'Provisioned QA learner email is mandatory').toBeTruthy();
  expect(password, 'Provisioned QA learner password is mandatory').toBeTruthy();
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  const username = page.locator('input[type="email"], input[name="email"]').first();
  const secret = page.locator('input[type="password"]').first();
  await expect(username).toBeEnabled({ timeout: 25_000 });
  await expect(secret).toBeEnabled();
  await username.fill(email);
  await secret.fill(password);
  await page.locator('button[type="submit"]').first().click();
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 50_000 })
    .not.toMatch(/\/login(?:\/|$)/);
}

test.describe('Authenticated live HVAC lesson media', () => {
  test.describe.configure({ timeout: 150_000 });
  test('plays actual frames and uses the full screen without losing workbook controls', async ({ page }, info) => {
    test.skip(!email || !password, 'Provisioned QA learner credentials required');
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));

    await signIn(page);
    const response = await page.goto(
      `${BASE}/lms/courses/${COURSE_ID}/lessons/${LESSON_ID}`,
      { waitUntil: 'domcontentloaded', timeout: 45_000 },
    );
    expect(response?.status(), 'Actual enrolled lesson navigation must succeed').toBe(200);
    expect(page.url()).not.toMatch(/\/(login|unauthorized)(?:\?|$)/);

    const workspace = page.locator('[data-learning-workspace]').first();
    await expect(workspace).toBeVisible({ timeout: 30_000 });
    const video = workspace.locator('video').first();
    await expect(video).toBeVisible({ timeout: 25_000 });
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.readyState),
      { timeout: 35_000 }).toBeGreaterThanOrEqual(2);

    const initial = await video.evaluate((v: HTMLVideoElement) => ({
      videoWidth: v.videoWidth, videoHeight: v.videoHeight, duration: v.duration,
      readyState: v.readyState, source: Boolean(v.currentSrc),
    }));
    expect(initial.videoWidth, 'Encoded video must decode real frames').toBeGreaterThan(0);
    expect(initial.videoHeight).toBeGreaterThan(0);
    expect(initial.duration).toBeGreaterThan(1);
    expect(initial.source).toBe(true);

    const expand = workspace.getByRole('button', { name: 'Full screen lesson' });
    await expand.click();
    await expect(workspace).toHaveAttribute('data-expanded', 'true');
    await expect(video).toBeVisible();
    const frame = await workspace.boundingBox();
    const viewport = page.viewportSize();
    expect(frame && viewport && Math.abs(frame.width - viewport.width) <= 2,
      'Full screen course must span the entire device viewport').toBeTruthy();
    expect(frame && Math.abs(frame.x) <= 2).toBeTruthy();

    // Playback is genuine only when decoded media time advances without
    // seeking; a visible Play icon or HTTP 200 is insufficient acceptance.
    await video.click();
    await video.evaluate((v: HTMLVideoElement) => v.play());
    const firstTime = await video.evaluate((v: HTMLVideoElement) => v.currentTime);
    await expect.poll(() => video.evaluate((v: HTMLVideoElement) => {
      if (v.error) throw new Error('Native media error ' + v.error.code);
      return v.currentTime;
    }), { timeout: 20_000 }).toBeGreaterThan(firstTime + 1);
    const media = await video.evaluate((v: HTMLVideoElement) => ({
      currentTime: v.currentTime, duration: v.duration, paused: v.paused,
      readyState: v.readyState, naturalWidth: v.videoWidth, error: v.error?.code ?? 0,
    }));
    expect(media.error).toBe(0);
    expect(media.naturalWidth).toBeGreaterThan(0);
    await info.attach('live-hvac-course-playback', {
      body: JSON.stringify({ exactTestSha: process.env.GITHUB_SHA || null, url: page.url(),
        device: info.project.name, initial, media, viewport, frame, errors }),
      contentType: 'application/json',
    });
    await info.attach('live-hvac-fullscreen', {
      body: await page.screenshot(), contentType: 'image/png',
    });

    await workspace.getByRole('button', { name: 'Exit full screen' }).click();
    await expect(workspace).toHaveAttribute('data-expanded', 'false');
    await workspace.getByRole('button', { name: 'Split view' }).click();
    const panels = workspace.locator(':scope > div:last-child > section');
    await expect(panels).toHaveCount(2);
    await expect(panels.nth(0)).toBeVisible();
    await expect(panels.nth(1)).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    expect(overflow, 'Lesson must not overflow the device width').toBeLessThanOrEqual(2);
    expect(errors, 'No unhandled browser exceptions during playback').toEqual([]);
  });
});
