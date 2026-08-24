import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Admin service worker navigation contract', () => {
  it('does not intercept authenticated document navigations', () => {
    const worker = readFileSync(path.resolve('public/sw-admin.js'), 'utf8');

    expect(worker).toContain("if (request.mode === 'navigate') return;");
    expect(worker).not.toContain("event.respondWith(fetch(request, { cache: 'no-store', redirect: 'follow' })");
  });
});
