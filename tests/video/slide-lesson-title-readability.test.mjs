import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { after, before, test } from 'node:test';
import { promisify } from 'node:util';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import { FOOTAGE_TITLE_LAYOUT, footageTitleCropFilter } from '../../remotion-src/footage-title-layout.mjs';
import { MIN_TITLE_WORD_COVERAGE, readEncodedTitle, titleWordCoverage } from '../../lib/video/title-readability.mjs';

// Run in the media-worker toolchain: Chromium, ffmpeg, and Tesseract are required.
// The fixture is local, so this regression needs no storage credentials or AI calls.
const exec = promisify(execFile);
const title = 'Trim client hair';
const texture = `<svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
  <defs><pattern id="texture" width="83" height="89" patternUnits="userSpaceOnUse">
    <rect width="83" height="89" fill="#f8fafc"/>
    <path d="M0 0L83 89M0 89L83 0" stroke="#0f172a" stroke-width="15"/>
  </pattern></defs><rect width="1920" height="1080" fill="url(#texture)"/>
</svg>`;
let directory;
let serveUrl;
let browser;

before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), 'slide-title-regression-'));
  serveUrl = await bundle({
    entryPoint: path.resolve('remotion-src/index.ts'),
    publicDir: null,
    outDir: path.join(directory, 'bundle'),
  });
  browser = await openBrowser('chrome', {
    ...(process.env.REMOTION_BROWSER_EXECUTABLE
      ? { browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE }
      : {}),
  });
}, { timeout: 180_000 });

after(async () => {
  await browser?.close({ silent: true });
  if (directory) await rm(directory, { recursive: true, force: true });
});

async function titleCoverage(surfaceMode, renderedTitle, expectedTitle = title, titleLayout = FOOTAGE_TITLE_LAYOUT) {
  const inputProps = {
    courseTitle: 'Course', lessonTitle: 'Lesson',
    primaryColor: '#8b5cf6', accentColor: '#f59e0b',
    backgroundColor: '#f8fafc', surfaceMode,
    scenes: [{
      scene_number: 1, title: renderedTitle, bullets: [], narration: '',
      clip_keyword: '', clipUrl: null,
      imageUrl: `data:image/svg+xml;base64,${Buffer.from(texture).toString('base64')}`,
      audioSrc: null, durationFrames: 960, sceneType: 'problem_hook',
    }],
  };
  const composition = await selectComposition({ serveUrl, id: 'SlideLesson', inputProps,
    puppeteerInstance: browser });
  const still = path.join(directory, `${surfaceMode}-${renderedTitle ? 'title' : 'missing'}.png`);
  await renderStill({ serveUrl, composition, inputProps, frame: 150,
    output: still, puppeteerInstance: browser });
  const encoded = `${still}.mp4`;
  await exec('ffmpeg', ['-y', '-loglevel', 'error', '-loop', '1', '-i', still,
    '-t', '0.1', '-r', '30', '-c:v', 'libx264', '-crf', '20', '-pix_fmt', 'yuv420p', encoded]);
  const result = [];
  for (const width of [1280, 390]) {
    const frame = `${still}-${width}.png`;
    await exec('ffmpeg', ['-y', '-loglevel', 'error', '-i', encoded,
      '-frames:v', '1', '-vf', `scale=${width}:-1`, frame]);
    const measured = await readEncodedTitle({ frame, expectedTitle, titleLayout });
    // Exercise the exact region even when full-frame OCR succeeds on this platform.
    const crop = `${frame}.region.png`;
    await exec('ffmpeg', ['-y', '-loglevel', 'error', '-i', frame,
      '-vf', footageTitleCropFilter(), crop]);
    const { stdout } = await exec('tesseract', [crop, 'stdout', '--psm', '6'],
      { timeout: 30_000, maxBuffer: 1_000_000 });
    result.push({ width, coverage: measured.wordCoverage, regionCoverage: titleWordCoverage(expectedTitle, stdout),
      decoded: measured.decoded.trim(), ocrMode: measured.ocrMode });
  }
  return result;
}

for (const surfaceMode of ['bright', 'dark']) {
  test(`${surfaceMode} footage title survives desktop and phone encoding`, { timeout: 60_000 }, async () => {
    for (const result of await titleCoverage(surfaceMode, title)) {
      assert.ok(result.coverage >= MIN_TITLE_WORD_COVERAGE, JSON.stringify(result));
      assert.ok(result.regionCoverage >= MIN_TITLE_WORD_COVERAGE, JSON.stringify(result));
    }
  });
}

test('a missing title still fails the same encoded-pixel threshold', { timeout: 60_000 }, async () => {
  for (const result of await titleCoverage('bright', '')) {
    assert.ok(result.coverage < MIN_TITLE_WORD_COVERAGE, JSON.stringify(result));
    assert.ok(result.regionCoverage < MIN_TITLE_WORD_COVERAGE, JSON.stringify(result));
  }
});

test('a partial title cannot pass the cropped retry', { timeout: 60_000 }, async () => {
  for (const result of await titleCoverage('bright', 'Trim client')) {
    assert.ok(result.coverage < MIN_TITLE_WORD_COVERAGE, JSON.stringify(result));
    assert.ok(result.regionCoverage < MIN_TITLE_WORD_COVERAGE, JSON.stringify(result));
  }
});

test('an unrelated layout never uses the title-region retry', { timeout: 60_000 }, async () => {
  for (const result of await titleCoverage('bright', 'Trim client', title, 'unrelated-layout')) {
    assert.ok(result.coverage < MIN_TITLE_WORD_COVERAGE, JSON.stringify(result));
    assert.equal(result.ocrMode, 'full-frame');
  }
});

test('a long title wraps inside the same card at phone delivery size', { timeout: 60_000 }, async () => {
  const longTitle = 'Select the appropriate cutting tools and confirm the client haircut plan';
  for (const result of await titleCoverage('bright', longTitle, longTitle)) {
    assert.ok(result.coverage >= MIN_TITLE_WORD_COVERAGE, JSON.stringify(result));
    assert.ok(result.regionCoverage >= MIN_TITLE_WORD_COVERAGE, JSON.stringify(result));
  }
});

test('an overflowing title fails rendering rather than hiding authored words', { timeout: 60_000 }, async () => {
  await assert.rejects(titleCoverage('bright', 'Unbreakable'.repeat(50)), /MEDIA_TITLE_LAYOUT_OVERFLOW/);
});
