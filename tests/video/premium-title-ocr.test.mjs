import assert from 'node:assert/strict';
import { mkdtemp, copyFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { readEncodedTitle, MIN_TITLE_WORD_COVERAGE } from '../../lib/video/title-readability.mjs';
import { PREMIUM_TITLE_LAYOUT } from '../../remotion-src/premium-title-layout.mjs';
import { applySceneTitleReadabilityRepair } from '../../lib/ultimate-course-builder/core/repair-policy.mjs';

// Actual encoded phone frame from the owner-approved version 25, scene 3.
// Full-frame OCR truncated "terminology" to "rminology" despite visible text.
// The retry inspects unchanged pixels, with no upscaling or substituted text.
async function inspect(expectedTitle, titleLayout = PREMIUM_TITLE_LAYOUT) {
  const directory = await mkdtemp(join(tmpdir(), 'premium-title-ocr-'));
  try {
    const frame = join(directory, 'frame.png');
    await copyFile(new URL('./fixtures/approved-premium-title-390.png', import.meta.url), frame);
    return await readEncodedTitle({ frame, expectedTitle, titleLayout });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

test('approved phone title passes through the exact premium title region', async () => {
  const result = await inspect('terminology');
  assert.equal(result.ocrMode, 'title-region');
  assert.equal(result.wordCoverage, 1);
  assert.match(result.decoded, /terminology/i);
});

test('the retry still rejects missing and partially matching titles', async () => {
  for (const title of ['nonexistent heading', 'terminology additional missing words']) {
    const result = await inspect(title);
    assert.ok(result.wordCoverage < MIN_TITLE_WORD_COVERAGE);
  }
});

test('other layouts cannot use the premium region', async () => {
  const result = await inspect('terminology', 'unrelated-layout');
  assert.equal(result.ocrMode, 'full-frame');
  assert.ok(result.wordCoverage < MIN_TITLE_WORD_COVERAGE);
});

test('a genuine failure after region inspection remains repairable', () => {
  const result = applySceneTitleReadabilityRepair({ scenes: [{ title: 'First' }, { title: 'Second' }] }, {
    target: 'scene_construction', attempt: 1,
    requirements: [{ code: 'MEDIA_TEXT_UNREADABLE_AFTER_REGION', message: 'MEDIA_TEXT_UNREADABLE_AFTER_REGION:2:390' }],
  });
  assert.equal(result.scenes[0].titleFontSize, undefined);
  assert.equal(result.scenes[1].titleFontSize, 128);
});
