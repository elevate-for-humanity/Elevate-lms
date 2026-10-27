import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Admin service worker navigation contract', () => {
  it('does not intercept authenticated document navigations', () => {
    const worker = readFileSync(path.resolve('public/sw-admin.js'), 'utf8');

    expect(worker).toContain("if (request.mode === 'navigate') return;");
    const navigationGuard = worker.indexOf("if (request.mode === 'navigate') return;");
    const nextFetchHandler = worker.indexOf("event.respondWith(fetch(request, { cache: 'no-store', redirect: 'follow' })");
    expect(navigationGuard).toBeGreaterThan(-1);
    expect(nextFetchHandler).toBeGreaterThan(navigationGuard);
  });
});
