import { expect, test } from '@playwright/test';

// Diagnostic comparison only. This does not certify the deployed player:
// production acceptance remains hvac-hero-playback.spec.ts, without substitution.
test('diagnose the original HVAC MP4 through a complete native Blob source', async ({ page }, testInfo) => {
  test.setTimeout(150_000);
  await page.goto('https://www.elevateforhumanity.org/programs/hvac-technician');
  const video = page.locator('video[data-hvac-hero-video="20261029"]');
  const source = await video.evaluate(async (element: HTMLVideoElement) => {
    element.pause();
    const response = await fetch('/videos/hvac-recruitment-20261029.mp4');
    if (!response.ok) throw new Error('Original MP4 download failed: ' + response.status);
    const bytes = await response.arrayBuffer();
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', bytes))]
      .map(byte => byte.toString(16).padStart(2, '0')).join('');
    element.src = URL.createObjectURL(new Blob([bytes], { type: 'video/mp4' }));
    element.load();
    await element.play();
    return { bytes: bytes.byteLength, hash, duration: element.duration, firstTime: element.currentTime };
  });
  expect(source.bytes).toBe(4_986_861);
  expect(source.hash).toBe('277405b882e25a4a72cfccca70fe9842e901631c48f21ad7d6bf1a3245be1a5a');
  expect(source.duration).toBeCloseTo(96, 1);
  expect(source.firstTime).toBeLessThan(1);
  const started = Date.now();
  const samples: Array<{ time: number; elapsedMs: number; error: number; paused: boolean }> = [];
  let maxTime = 0;
  let looped = false;
  try {
    while (Date.now() - started < 110_000) {
      const sample = await video.evaluate((element: HTMLVideoElement) => ({
        time: element.currentTime, error: element.error?.code ?? 0, paused: element.paused,
      }));
      samples.push({ ...sample, elapsedMs: Date.now() - started });
      expect(sample.error).toBe(0);
      expect(sample.paused).toBe(false);
      maxTime = Math.max(maxTime, sample.time);
      if (maxTime >= 95 && sample.time > 0.5 && sample.time < 3) { looped = true; break; }
      await page.waitForTimeout(250);
    }
    expect(looped, 'The unchanged file must play all 96 seconds and naturally loop').toBe(true);
    expect(samples.at(-1)!.elapsedMs).toBeGreaterThanOrEqual(94_000);
  } finally {
    await testInfo.attach('complete-buffer-diagnostic', {
      body: JSON.stringify({ diagnosticOnly: true, source, maxTime, looped, samples }),
      contentType: 'application/json',
    });
  }
});
