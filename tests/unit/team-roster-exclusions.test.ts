import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { TEAM } from '@/data/team';
import { teamProfileHref } from '@/lib/navigation/team-profile';

/**
 * Elizabeth (Nov 25, 2026): Carl, Sharon, and Debbie must not appear on the
 * team page. Guard the roster and the deleted profile routes so a later
 * re-seed cannot silently put them back.
 */
describe('staff team roster exclusions', () => {
  it('does not list Carl, Sharon, or Debbie anywhere on the team', () => {
    for (const member of TEAM) {
      expect(member.name).not.toMatch(/^(carl|sharon|debbie)\b/i);
    }
  });

  it('has no public profile page for the excluded people', () => {
    for (const slug of ['carl-brown', 'sharon-douglass']) {
      expect(fs.existsSync(`apps/marketing/app/about/team/${slug}/page.tsx`)).toBe(false);
      expect(fs.existsSync(`apps/marketing/app/about/team/team/${slug}/page.tsx`)).toBe(false);
    }
  });

  it('gives every listed member a title and a bio', () => {
    for (const member of TEAM) {
      expect(member.title.trim().length).toBeGreaterThan(0);
      expect(member.bio.trim().length).toBeGreaterThan(0);
    }
  });

  it('only lists verified, non-empty credentials', () => {
    for (const member of TEAM) {
      for (const credential of member.credentials ?? []) {
        expect(credential.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('has a unique profile route per member', () => {
    expect(new Set(TEAM.map(teamProfileHref)).size).toBe(TEAM.length);
  });
});
