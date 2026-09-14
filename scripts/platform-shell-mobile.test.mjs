import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const globalCssUrl = new URL('../apps/lms/app/globals.css', import.meta.url);
const platformShellUrl = new URL('../components/platform/PlatformShell.tsx', import.meta.url);
const navigationConfigUrl = new URL('../lib/navigation/navigation-config.ts', import.meta.url);

test('mobile styles do not make every button in a flex column full width', async () => {
  const css = await readFile(globalCssUrl, 'utf8');

  assert.doesNotMatch(css, /\.flex-col\s+(?:button|\.btn)\s*\{[^}]*width\s*:\s*100%/s);
});

test('the shared portal drawer preserves readable mobile header space', async () => {
  const shell = await readFile(platformShellUrl, 'utf8');

  assert.match(shell, /w-\[min\(20rem,calc\(100vw-2\.5rem\)\)\]/);
  assert.match(shell, /className="min-w-0 flex-1"/);
  assert.match(shell, /!w-11 !min-w-11 !max-w-11 shrink-0/);
  assert.doesNotMatch(shell, /Mesmerized by Beauty/i);
});

test('Program Holder navigation is not hardcoded to an unrelated program', async () => {
  const navigation = await readFile(navigationConfigUrl, 'utf8');
  const start = navigation.indexOf('  program_holder:');
  const end = navigation.indexOf('  provider:', start);
  const programHolderNavigation = start >= 0 && end > start ? navigation.slice(start, end) : '';

  assert.ok(programHolderNavigation, 'Program Holder navigation must exist');
  assert.match(programHolderNavigation, /label: 'My Programs'/);
  assert.doesNotMatch(programHolderNavigation, /label: '(?:CDL|HVAC)[^']*'/i);
});
