import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('canonical program redirects', () => {
  const raw = readFileSync(join(process.cwd(), 'lib/routes/canonical-routes.json'), 'utf8');
  const parsed = JSON.parse(raw) as {
    legacyAliases: { source: string; destination: string }[];
  };
  const redirects = parsed.legacyAliases;

  const programRedirects = redirects.filter(
    (r) => r.source.startsWith('/programs/') && r.destination !== '/programs',
  );

  it('no program slug redirects dump to /programs catalog', () => {
    const bad = redirects.filter(
      (r) =>
        r.source.startsWith('/programs/') &&
        r.destination === '/programs' &&
        r.source !== '/programs',
    );
    expect(bad.map((r) => r.source)).toEqual([]);
  });

  it('legacy slugs redirect to real program or funding pages', () => {
    const map = new Map(programRedirects.map((r) => [r.source, r.destination]));
    expect(map.get('/programs/cpr-aed')).toBe('/programs/cpr-first-aid');
    expect(map.get('/programs/reentry-specialist')).toBeUndefined();
    expect(map.get('/programs/wioa')).toBe('/wioa-funded-training-indiana');
    expect(map.get('/programs/workforce-readiness')).toBe('/programs/reentry-specialist');
  });
});
