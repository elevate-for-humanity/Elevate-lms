import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { TEAM } from '@/data/team';
import { teamProfileHref } from '@/lib/navigation/team-profile';
import { resolveTeamProfileMember } from '@/lib/team-roster';

/**
 * Elizabeth (Nov 25, 2026): Carl, Sharon, and Debbie must not appear on the
 * team page. Guard the roster and the deleted profile routes so a later
 * re-seed cannot silently put them back.
 */
describe('staff team roster exclusions', () => {
  const migration = fs.readFileSync(
    'supabase/migrations/20261125140000_fix_staff_team_page.sql',
    'utf8',
  );

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

  it('does not substitute static content after a successful empty database lookup', () => {
    expect(resolveTeamProfileMember('alberta-davis', [], TEAM, false)).toBeUndefined();
  });

  it('uses static content only when the database query failed', () => {
    expect(resolveTeamProfileMember('alberta-davis', [], TEAM, true)?.name).toBe('Alberta Davis');
  });

  it('does not label a stock image as Naomi Jordan', () => {
    expect(TEAM.find((member) => member.name === 'Naomi Jordan')?.headshotSrc).toBeUndefined();
    expect(migration).toContain("WHERE lower(btrim(name)) = lower('Naomi Jordan')");
    expect(migration).toContain("images/naomi-jordan\\.jpg$");
    expect(migration).toContain('ELSE headshot_url');
    expect(migration).toContain('ELSE image_url');
    expect(migration).not.toContain("WHEN seed.name = 'Naomi Jordan' THEN NULL");
  });

  it('removes only Naomi Jordan’s stock field and preserves her saved portrait', async () => {
    const database = new PGlite();
    await database.exec(`
      CREATE TABLE public.team_members (
        name text,
        headshot_url text,
        image_url text,
        updated_at timestamptz
      );
      INSERT INTO public.team_members (name, headshot_url, image_url)
      VALUES (
        'Naomi Jordan',
        'https://cdn.example.test/images/naomi-jordan.jpg?version=old',
        'https://media.example.test/staff/naomi-real.webp'
      );
    `);
    const cleanup = migration.match(
      /UPDATE public\.team_members\nSET headshot_url =[\s\S]+?\n  \);(?=\n\n-- Update existing people)/,
    )?.[0];
    expect(cleanup).toBeTruthy();
    await database.exec(cleanup!);
    const result = await database.query<{
      headshot_url: string | null;
      image_url: string | null;
    }>('SELECT headshot_url, image_url FROM public.team_members');
    expect(result.rows).toEqual([
      {
        headshot_url: null,
        image_url: 'https://media.example.test/staff/naomi-real.webp',
      },
    ]);
    await database.close();
  });

  it('reconciles existing roster identities without an unsupported name-only upsert', () => {
    expect(migration).not.toContain('ON CONFLICT (name)');
    expect(migration).toContain('CREATE TEMP TABLE staff_roster_match');
    expect(migration).toContain('member.name = seed.name AND member.title = seed.title');
    expect(migration).toContain('member.id <> matched.member_id');
    expect(migration).not.toContain('DELETE FROM public.team_members');
    expect(migration).toContain('WHERE NOT EXISTS (');
  });

  it('preserves saved contact data when the verified roster has no email', () => {
    expect(migration).toContain("email = COALESCE(NULLIF(seed.email, ''), member.email)");
  });
});
