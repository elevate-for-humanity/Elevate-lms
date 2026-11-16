import assert from 'node:assert/strict';
import test from 'node:test';
import postcss from 'postcss';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { partitionMarketingCss, verifyMarketingCss } from './build-marketing-css.mjs';

test('bounded CSS chunks retain every rule, declaration and override in order', () => {
  const css =
    '/* License */.card{color:red}@media(min-width:640px){.card{color:blue}}@keyframes fade{to{opacity:1}}.card{color:green}';
  const chunks = partitionMarketingCss(css, 65);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => Buffer.byteLength(chunk) <= 65));
  const before = postcss.parse(css).nodes.map((node) => node.toString());
  const after = chunks.flatMap((chunk) =>
    postcss.parse(chunk).nodes.map((node) => node.toString()),
  );
  assert.deepEqual(
    after,
    before,
    'media queries and keyframes remain intact; the last override stays last',
  );
});

test('a single oversized rule fails the build instead of silently truncating CSS', () => {
  assert.throws(() => partitionMarketingCss('.x{color:red}', 5), /rule exceeds/);
});

test('the release guard checks final emitted CSS, not only the source chunks', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'marketing-css-final-'));
  try {
    assert.throws(() => verifyMarketingCss(directory), /missing/);
    fs.writeFileSync(path.join(directory, 'merged.css'), 'x'.repeat(150_001));
    assert.throws(() => verifyMarketingCss(directory), /exceeds 150 KB/);
    fs.writeFileSync(path.join(directory, 'merged.css'), '.card{color:green}');
    assert.equal(verifyMarketingCss(directory)[0].bytes, 18);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
