import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
const source = stripTypeScriptTypes(await readFile(new URL('../lib/devstudio/browser-configuration.ts', import.meta.url), 'utf8'));
const { browserConfiguration } = await import('data:text/javascript;base64,' + Buffer.from(source).toString('base64'));
test('runtime browser cutover controls both session creation and public stream', () => {
  const config = browserConfiguration({ STUDIO_BROWSER_URL: 'https://current.example/', STUDIO_BROWSER_PUBLIC_URL: 'https://current.example/', NEXT_PUBLIC_STUDIO_BROWSER_URL: 'https://obsolete.example', STUDIO_BROWSER_SECRET: 'test' });
  assert.equal(config.internalUrl, 'https://current.example');
  assert.equal(config.publicUrl, config.internalUrl);
  assert.equal(config.configured, true);
});
test('legacy public URL is used only without a runtime public URL', () => {
  assert.equal(browserConfiguration({ NEXT_PUBLIC_STUDIO_BROWSER_URL: 'https://legacy.example/' }).publicUrl, 'https://legacy.example');
  assert.equal(browserConfiguration({}).configured, false);
});
