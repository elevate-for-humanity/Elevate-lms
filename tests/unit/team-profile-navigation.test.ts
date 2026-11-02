import { describe, expect, it } from 'vitest';
import { teamProfileHref } from '@/lib/navigation/team-profile';
import { TEAM } from '@/data/team';
import fs from 'node:fs';

describe('staff profile navigation', () => {
  it('uses the full dedicated biography for the founder', () => {
    expect(teamProfileHref({ name: 'Elizabeth Greene' })).toBe('/about/elizabeth-greene');
  });
  it('keeps honorifics from bypassing the established staff profile', () => {
    expect(teamProfileHref({ name: 'Dr. Carlina Wilkes' })).toBe('/about/team/carlina-wilkes');
  });
  it('has a real portrait and a resolvable static or dynamic profile for every listed staff member', () => {
    for (const member of TEAM) {
      if (member.headshotSrc?.startsWith('/')) expect(fs.existsSync(`public${member.headshotSrc}`)).toBe(true);
      const route = teamProfileHref(member);
      expect(fs.existsSync(`apps/marketing/app${route}/page.tsx`) || fs.existsSync('apps/marketing/app/about/team/[slug]/page.tsx')).toBe(true);
    }
    expect(new Set(TEAM.map(teamProfileHref)).size).toBe(TEAM.length);
  });
});
