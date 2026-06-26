import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Regression: portal and dashboard paths must be auth-gated in proxy.ts middleware.
 */
describe('portal auth route coverage (proxy.ts)', () => {
  const proxySource = readFileSync(resolve(process.cwd(), 'proxy.ts'), 'utf8');

  const requiredAuthPrefixes = [
    '/learner/',
    '/lms/',
    '/portal/',
    '/portals',
    '/dashboards',
    '/student-portal',
    '/instructor/',
    // Use prefix patterns for nested routes
    '/employer/',
    '/partner/',
    '/case-manager/',
  ];

  it.each(requiredAuthPrefixes)('PROTECTED_ROUTES includes %s', (prefix) => {
    expect(proxySource).toContain(`'${prefix}'`);
  });

  it('PROTECTED_ROUTES includes instructor prefix', () => {
    expect(proxySource).toContain("'/instructor/':");
  });

  it('NOINDEX covers portal directory pages', () => {
    expect(proxySource).toMatch(/NOINDEX_PREFIXES[\s\S]*'\/portals'/);
    expect(proxySource).toMatch(/NOINDEX_PREFIXES[\s\S]*'\/dashboards'/);
  });
});
