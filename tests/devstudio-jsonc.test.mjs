import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseJsonc } from '../lib/devstudio/jsonc.mjs';

test('preserves URLs, block markers, escaped quotes and closing punctuation in configuration values', () => {
  const config = { url: 'https://example.org/a/*literal*/', command: 'echo ,} and ,]', escaped: '" // literal', windows: 'C:\\workspace' };
  assert.deepEqual(parseJsonc(JSON.stringify(config)), config);
});
test('accepts comments and trailing commas outside strings', () => {
  assert.deepEqual(parseJsonc('{ // config\n "items": [1, /* entry */ 2,],\n}'), { items: [1, 2] });
});
test('rejects invalid JSON and unterminated block comments', () => {
  for (const text of ['{"a":1} /*', '{"a":1/*}', '{"a":tru/* gap */e}', '{"a":"unterminated}', "{'a':1}"]) {
    assert.throws(() => parseJsonc(text), SyntaxError);
  }
});
test('repository devcontainer parses and client and API use the same parser', () => {
  const raw = readFileSync(new URL('../.devcontainer/devcontainer.json', import.meta.url), 'utf8');
  assert.equal(typeof parseJsonc(raw), 'object');
  for (const file of ['components/studio/DevContainerPanel.tsx', 'apps/admin/app/api/admin/dev-studio/devcontainer/route.ts']) {
    assert.match(readFileSync(new URL('../' + file, import.meta.url), 'utf8'), /import \{ parseJsonc \} from '@\/lib\/devstudio\/jsonc.mjs'/);
  }
});
