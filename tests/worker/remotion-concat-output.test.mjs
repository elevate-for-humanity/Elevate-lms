import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';

const file = fileURLToPath(new URL('../../lib/video/remotion-render.ts', import.meta.url));
const source = readFileSync(file, 'utf8');

test('FFmpeg concat assembly receives real codec arguments and an output destination', () => {
  const start = source.indexOf('const concatArgs = [');
  const end = source.indexOf('];', start);
  assert.ok(start >= 0 && end > start, 'concatArgs must be defined');
  const argumentBlock = source.slice(start, end);
  // This regression once shipped literal backslash-n text inside a // comment,
  // commenting out every FFmpeg option and the final output path.
  assert.doesNotMatch(argumentBlock, /\\\\n\s*\/\//);
  assert.match(argumentBlock, /^\s*'-c:v', 'libx264'/m);
  assert.match(argumentBlock, /^\s*'-c:a', 'aac'/m);
  assert.match(argumentBlock, /^\s*paths\.videoPath,/m);
  assert.match(source.slice(end, end+250), /concatArgs\.at\(-1\) !== paths\.videoPath/);
  assert.match(source.slice(end, end+550), /execFileAsync\('ffmpeg', concatArgs/);
});
