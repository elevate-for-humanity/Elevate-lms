import { describe, expect, it } from 'vitest';

/**
 * Mirror of proxy.ts pathMatchesAuthPrefix — keep in sync when changing middleware.
 */
function pathMatchesAuthPrefix(pathname: string, prefix: string): boolean {
  if (prefix.endsWith('/')) {
    const base = prefix.slice(0, -1);
    return pathname === base || pathname.startsWith(prefix);
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

describe('pathMatchesAuthPrefix', () => {
  it('does not treat /apprenticeships as /apprentice', () => {
    expect(pathMatchesAuthPrefix('/apprenticeships', '/apprentice')).toBe(false);
    expect(pathMatchesAuthPrefix('/apprenticeships/ipla-exam', '/apprentice')).toBe(false);
  });

  it('still protects apprentice portal routes', () => {
    expect(pathMatchesAuthPrefix('/apprentice', '/apprentice')).toBe(true);
    expect(pathMatchesAuthPrefix('/apprentice/hours', '/apprentice')).toBe(true);
  });

  it('allows public program marketing paths', () => {
    expect(pathMatchesAuthPrefix('/programs/barber-apprenticeship', '/programs/')).toBe(true);
    expect(pathMatchesAuthPrefix('/programs/cosmetology-apprenticeship', '/programs/')).toBe(true);
  });
});
