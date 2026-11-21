import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../../apps/admin/app/robots.ts', import.meta.url), 'utf8');
const middleware = readFileSync(new URL('../../apps/admin/middleware.ts', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../apps/admin/app/layout.tsx', import.meta.url), 'utf8');

test('private Admin publishes a robots route with full crawl exclusion', () => {
  assert.match(source, /export default function robots\(\)/);
  assert.match(source, /userAgent:\s*['"]\*['"]/);
  assert.match(source, /disallow:\s*['"]\/['"]/);
  assert.doesNotMatch(source, /sitemap\s*:/i);
});

test('Admin robots route remains public to scanners without weakening session RBAC', () => {
  // Middleware already allows root-level .txt assets for unauthenticated requests.
  assert.ok(middleware.includes('webmanifest|js|css|txt'), 'robots.txt must remain unauthenticated');
  assert.match(layout, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/);
});
