import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Admin service worker navigation contract', () => {
  it('keeps authenticated document navigations network-only with a public offline fallback', () => {
    const worker = readFileSync(path.resolve('public/sw-admin.js'), 'utf8');

    expect(worker).toContain("if (request.mode === 'navigate') {");
    expect(worker).toContain("fetch(request, { cache: 'no-store', redirect: 'follow' })");
    expect(worker).toContain("caches.match('/offline.html')");

    const navigationHandler = worker.match(
      /if \(request\.mode === 'navigate'\) \{([\s\S]*?)\n\s*\}/,
    )?.[1] ?? '';
    expect(navigationHandler).not.toContain('safeCachePut');
    expect(navigationHandler).not.toContain('cache.put');
  });
});
