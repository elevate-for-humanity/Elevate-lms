import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const source = readFileSync(
  new URL(
    '../../lib/ultimate-course-builder/persistence/supabase-persistence.ts',
    import.meta.url,
  ),
  'utf8',
);

test('legacy picture-cue repair is recognized', () => {
  assert.match(source, /legacyPictureCueRetry/);
  assert.match(source, /PICTURE_CUE_NOT_ALIGNED_TO_SPEECH/);
});

test('legacy picture-cue repair targets the storyboard cue producer', () => {
  assert.match(
    source,
    /legacyPictureCueRetry[\s\S]*?target: 'storyboard'/,
  );
});

test('legacy picture-cue recovery preserves synchronization evidence', () => {
  assert.match(
    source,
    /artifacts\.synchronization = pictureCueDirective\.previous/,
  );
});

test('picture-cue recovery does not certify finished media QA', () => {
  const recovery = source.split(
    'const legacyPictureCueRetry =',
  )[1]?.split(
    '// The old full-frame premium OCR',
  )[0];

  assert.ok(recovery);
  assert.doesNotMatch(
    recovery,
    /finished_media_qa.*state:\s*'passed'/,
  );
});
