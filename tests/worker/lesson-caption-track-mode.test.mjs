import { readFileSync } from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  captionTrackMode,
  captionTrackModeAfterLoad,
} from '../../lib/lms/lesson-caption-track.mjs';

const player = readFileSync(
  new URL('../../components/lms/InteractiveVideoPlayer.tsx', import.meta.url),
  'utf8',
);

test('caption track mode follows the learner choice', () => {
  assert.equal(captionTrackMode(true), 'showing');
  assert.equal(captionTrackMode(false), 'disabled');
});

test('a caption file finishing load never disables an enabled track', () => {
  // A disabled track exposes no cues, so this is the exact state that removed
  // captions from a learner who had enabled them.
  for (const enabled of [true, false])
    assert.notEqual(captionTrackModeAfterLoad(enabled), 'disabled');
  assert.equal(captionTrackModeAfterLoad(true), 'showing');
  // Nothing to re-assert while captions are off; the learner's mode stands.
  assert.equal(captionTrackModeAfterLoad(false), null);
});

test('the player disables caption tracks only through the learner-choice effect', () => {
  // Exactly two writers remain: the learner-choice effect and the load handler
  // that can only re-enable. Any direct 'disabled' literal would reintroduce
  // the defect this test exists to prevent.
  const writers = player.match(/\.mode\s*=\s*[^;\n]+/g) ?? [];
  assert.deepEqual(writers, ['.mode = captionTrackMode(showCaptions)', '.mode = mode']);
  assert.doesNotMatch(player, /\.mode\s*=\s*'disabled'/);
  assert.match(player, /const mode = captionTrackModeAfterLoad\(showCaptions\);\n\s*if \(mode\)/);
  // The old load handler re-derived the disabled state on its own.
  assert.doesNotMatch(player, /track\.mode = showCaptions \? 'showing' : 'disabled'/);
});
