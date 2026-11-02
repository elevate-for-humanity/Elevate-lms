import { describe, expect, it } from 'vitest';
import { teamProfileHref, teamPortrait, teamPortraitAlt } from '@/lib/navigation/team-profile';
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
  it('replaces removed group artwork without inventing staff portraits', () => {
    expect(teamPortrait({ name: 'Training Team', image_url: '/images/team-new/team-1.jpg' })).toBe('/images/about-training-20261102.webp');
    expect(teamPortrait({ name: 'Career Services', image_url: '/images/team-new/team-2.jpg' })).toBe('/images/career-advising-20261102.webp');
    expect(teamPortrait({ name: 'Student Support', image_url: '/images/team-new/team-3.jpg' })).toBe('/images/career-advising-20261102.webp');
    expect(teamPortrait({ name: 'Operations Team', image_url: '/images/team-new/team-4.jpg' })).toBe('/images/programs/refresh-20261101/employers.webp');
    expect(teamPortrait({ name: 'A person', image_url: '/images/team-new/team-1.jpg' })).toBeUndefined();
    expect(teamPortrait({ name: 'Elizabeth Greene', image_url: '/images/team/elizabeth-greene.webp' })).toBe('/images/team/elizabeth-greene.webp');
    expect(teamPortraitAlt('Training Team', '/images/about-training-20261102.webp')).toContain('Illustrative');
  });

});
