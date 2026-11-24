import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const middleware = readFileSync(new URL('../../apps/admin/middleware.ts', import.meta.url), 'utf8');
const layout = readFileSync(new URL('../../apps/admin/app/layout.tsx', import.meta.url), 'utf8');

test('Admin middleware owns the public crawler response and excludes its sitemap', () => {
  assert.match(middleware, /if \(pathname === '\/robots\.txt'\) return new NextResponse\('User-agent: \*\\nDisallow: \/\\n', \{\s*headers: \{[^}]*'X-Robots-Tag': 'noindex'/);
  assert.match(middleware, /if \(pathname === '\/sitemap\.xml'\) return new NextResponse\(null, \{\s*status: 404/);
  assert.equal(existsSync(new URL('../../apps/admin/app/robots.ts', import.meta.url)), false);
});

test('Admin pages declare non-indexing metadata', () => {
  assert.match(layout, /robots:\s*\{\s*index:\s*false,\s*follow:\s*false/);
});
